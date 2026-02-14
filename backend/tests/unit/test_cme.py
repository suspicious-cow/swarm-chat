"""Tests for app.engine.cme — CME cycle logic."""

from unittest.mock import AsyncMock, patch

import pytest

from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.models.user import User
from app.models.idea import Idea
from app.engine.cme import process_session, run_cme_cycle


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

        with patch("app.engine.cme.update_taxonomy_for_subgroup") as mock_tax:
            await process_session(db, session)
            mock_tax.assert_not_awaited()

    async def test_taxonomy_runs_for_each_subgroup(self, db, mock_llm):
        session, subgroups = await _setup_active_session(db, num_subgroups=3)

        with patch("app.engine.cme.update_taxonomy_for_subgroup", new_callable=AsyncMock) as mock_tax, \
             patch("app.engine.cme.get_ideas_not_in_subgroup", new_callable=AsyncMock, return_value=[]) as mock_ideas:
            await process_session(db, session)
            assert mock_tax.await_count == 3

    async def test_surrogate_called_with_foreign_ideas(self, db, mock_llm):
        session, subgroups = await _setup_active_session(db)
        # Add an idea from sg[0]
        idea = Idea(session_id=session.id, subgroup_id=subgroups[0].id, summary="Idea from sg1", sentiment=0.5)
        db.add(idea)
        await db.flush()

        with patch("app.engine.cme.update_taxonomy_for_subgroup", new_callable=AsyncMock), \
             patch("app.engine.cme.get_ideas_not_in_subgroup", new_callable=AsyncMock, return_value=[idea]), \
             patch("app.engine.cme.deliver_surrogate_message", new_callable=AsyncMock) as mock_surrogate:
            await process_session(db, session)
            assert mock_surrogate.await_count >= 1

    async def test_error_in_one_subgroup_doesnt_stop_others(self, db, mock_llm):
        session, subgroups = await _setup_active_session(db, num_subgroups=2)

        call_count = 0

        async def fail_first(db, sess_id, sg_id):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise RuntimeError("Taxonomy exploded")

        with patch("app.engine.cme.update_taxonomy_for_subgroup", side_effect=fail_first), \
             patch("app.engine.cme.get_ideas_not_in_subgroup", new_callable=AsyncMock, return_value=[]):
            # Should not raise
            await process_session(db, session)
            # Both subgroups attempted
            assert call_count == 2
