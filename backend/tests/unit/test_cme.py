"""Tests for app.engine.cme — CME cycle logic and distributed locking."""

from unittest.mock import AsyncMock, patch, MagicMock
from contextlib import asynccontextmanager

import pytest

from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.models.user import User
from app.models.idea import Idea
from app.engine.cme import (
    process_session,
    run_cme_cycle,
    acquire_cme_lock,
    renew_cme_lock,
    release_cme_lock,
    CME_LOCK_KEY,
)


def _mock_async_session(db):
    """Create a mock async_session context manager that yields the test db."""
    @asynccontextmanager
    async def _ctx():
        yield db
    return _ctx


async def _setup_active_session(db, num_subgroups=2, users_per=3):
    session = Session(title="Active Topic", status=SessionStatus.active)
    db.add(session)
    await db.flush()
    subgroups = []
    for i in range(num_subgroups):
        sg = Subgroup(session_id=session.id, label=f"ThinkTank {i+1}")
        db.add(sg)
        subgroups.append(sg)
    await db.flush()
    for sg in subgroups:
        for j in range(users_per):
            u = User(display_name=f"U{j}", session_id=session.id, subgroup_id=sg.id)
            db.add(u)
    await db.flush()
    return session, subgroups


class TestProcessSession:

    async def test_single_subgroup_skipped(self, db, mock_llm):
        """Sessions with < 2 subgroups should early-return."""
        session = Session(title="Solo", status=SessionStatus.active)
        db.add(session)
        await db.flush()
        sg = Subgroup(session_id=session.id, label="ThinkTank 1")
        db.add(sg)
        await db.flush()

        with patch("app.engine.cme.async_session", _mock_async_session(db)), \
             patch("app.engine.cme.update_taxonomy_for_subgroup") as mock_tax:
            await process_session(session)
            mock_tax.assert_not_awaited()

    async def test_taxonomy_runs_for_each_subgroup(self, db, mock_llm):
        session, subgroups = await _setup_active_session(db, num_subgroups=3)

        with patch("app.engine.cme.async_session", _mock_async_session(db)), \
             patch("app.engine.cme.update_taxonomy_for_subgroup", new_callable=AsyncMock) as mock_tax, \
             patch("app.engine.cme.get_ideas_not_in_subgroup", new_callable=AsyncMock, return_value=[]) as mock_ideas:
            await process_session(session)
            assert mock_tax.await_count == 3

    async def test_surrogate_called_with_foreign_ideas(self, db, mock_llm):
        session, subgroups = await _setup_active_session(db)
        # Add an idea from sg[0]
        idea = Idea(session_id=session.id, subgroup_id=subgroups[0].id, summary="Idea from sg1", sentiment=0.5)
        db.add(idea)
        await db.flush()

        with patch("app.engine.cme.async_session", _mock_async_session(db)), \
             patch("app.engine.cme.update_taxonomy_for_subgroup", new_callable=AsyncMock), \
             patch("app.engine.cme.get_ideas_not_in_subgroup", new_callable=AsyncMock, return_value=[idea]), \
             patch("app.engine.cme.deliver_surrogate_message", new_callable=AsyncMock) as mock_surrogate:
            await process_session(session)
            assert mock_surrogate.await_count >= 1

    async def test_error_in_one_subgroup_doesnt_stop_others(self, db, mock_llm):
        session, subgroups = await _setup_active_session(db, num_subgroups=2)

        call_count = 0

        async def fail_first(db, sess_id, sg_id):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise RuntimeError("Taxonomy exploded")

        with patch("app.engine.cme.async_session", _mock_async_session(db)), \
             patch("app.engine.cme.update_taxonomy_for_subgroup", side_effect=fail_first), \
             patch("app.engine.cme.get_ideas_not_in_subgroup", new_callable=AsyncMock, return_value=[]):
            # Should not raise
            await process_session(session)
            # Both subgroups attempted
            assert call_count == 2


class TestDistributedLock:

    async def test_acquire_lock_success(self, mock_redis):
        """Lock is acquired when Redis SET NX succeeds."""
        mock_redis["redis_client"].set = AsyncMock(return_value=True)
        assert await acquire_cme_lock("worker-1") is True

    async def test_acquire_lock_failure(self, mock_redis):
        """Lock is not acquired when another worker holds it."""
        mock_redis["redis_client"].set = AsyncMock(return_value=None)
        assert await acquire_cme_lock("worker-2") is False

    async def test_renew_lock_when_owner(self, mock_redis):
        """Lock is renewed when we still own it."""
        mock_redis["redis_client"].get = AsyncMock(return_value="worker-1")
        mock_redis["redis_client"].expire = AsyncMock(return_value=True)
        assert await renew_cme_lock("worker-1") is True
        mock_redis["redis_client"].expire.assert_awaited_once()

    async def test_renew_lock_lost_ownership(self, mock_redis):
        """Renewal fails if another worker now holds the lock."""
        mock_redis["redis_client"].get = AsyncMock(return_value="worker-other")
        assert await renew_cme_lock("worker-1") is False

    async def test_release_lock_when_owner(self, mock_redis):
        """Lock is released when we own it."""
        mock_redis["redis_client"].get = AsyncMock(return_value="worker-1")
        await release_cme_lock("worker-1")
        mock_redis["redis_client"].delete.assert_awaited_once_with(CME_LOCK_KEY)

    async def test_release_lock_not_owner(self, mock_redis):
        """Lock is not released if we don't own it."""
        mock_redis["redis_client"].get = AsyncMock(return_value="worker-other")
        await release_cme_lock("worker-1")
        mock_redis["redis_client"].delete.assert_not_awaited()
