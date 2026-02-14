"""Tests for app.engine.partitioner — subgroup creation and assignment."""

import uuid

import pytest
from sqlalchemy import select

from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.models.user import User
from app.engine.partitioner import create_subgroups_for_session, assign_user_to_subgroup


async def _create_session(db, title="Test Topic", subgroup_size=5):
    session = Session(title=title, subgroup_size=subgroup_size)
    db.add(session)
    await db.flush()
    return session


async def _create_users(db, session_id, count):
    users = []
    for i in range(count):
        u = User(display_name=f"User{i}", session_id=session_id)
        db.add(u)
        users.append(u)
    await db.flush()
    return users


class TestCreateSubgroups:

    async def test_10_users_size_5_gives_2_subgroups(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 10)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        assert len(subgroups) == 2
        # Every user assigned
        for u in users:
            assert u.subgroup_id is not None

    async def test_11_users_size_5_gives_2_subgroups_not_3(self, db):
        """11 users / size 5: naive math gives 3 groups (5+5+1), but
        the tiny-group check collapses it to 2 groups (6+5)."""
        session = await _create_session(db)
        users = await _create_users(db, session.id, 11)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        assert len(subgroups) == 2

    async def test_2_users_size_5_gives_1_subgroup(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 2)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        assert len(subgroups) == 1

    async def test_labels_are_thinktank(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 10)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        assert subgroups[0].label == "ThinkTank 1"
        assert subgroups[1].label == "ThinkTank 2"

    async def test_round_robin_assignment(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 6)
        subgroups = await create_subgroups_for_session(db, session.id, users, 3)
        # 6/3 = 2 subgroups, round robin: 0→sg1, 1→sg2, 2→sg1, 3→sg2, etc.
        assert len(subgroups) == 2
        sg1_ids = {u.subgroup_id for u in users if u.subgroup_id == subgroups[0].id}
        sg2_ids = {u.subgroup_id for u in users if u.subgroup_id == subgroups[1].id}
        assert len(sg1_ids) > 0
        assert len(sg2_ids) > 0

    async def test_single_user(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 1)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        assert len(subgroups) == 1
        assert users[0].subgroup_id == subgroups[0].id


class TestAssignUserToSubgroup:

    async def test_late_joiner_assigned_to_smallest(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 6)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        # Now add a late joiner
        late = User(display_name="Late", session_id=session.id)
        db.add(late)
        await db.flush()
        sg = await assign_user_to_subgroup(db, late, session.id, 5)
        assert late.subgroup_id == sg.id

    async def test_all_full_creates_new_subgroup(self, db):
        session = await _create_session(db)
        users = await _create_users(db, session.id, 5)
        subgroups = await create_subgroups_for_session(db, session.id, users, 5)
        assert len(subgroups) == 1
        # All 5 slots full, so next joiner should create new subgroup
        late = User(display_name="Late", session_id=session.id)
        db.add(late)
        await db.flush()
        sg = await assign_user_to_subgroup(db, late, session.id, 5)
        assert sg.label == "ThinkTank 2"
        assert late.subgroup_id == sg.id
