"""Tests for app.engine.taxonomy — idea extraction via mocked LLM."""

import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.models.session import Session
from app.models.subgroup import Subgroup
from app.models.user import User
from app.models.message import Message, MessageType
from app.models.idea import Idea
from app.engine.taxonomy import update_taxonomy_for_subgroup, get_ideas_not_in_subgroup


async def _setup_session_with_subgroup(db):
    session = Session(title="Test Topic")
    db.add(session)
    await db.flush()
    sg = Subgroup(session_id=session.id, label="ThinkTank 1")
    db.add(sg)
    await db.flush()
    return session, sg


class TestUpdateTaxonomy:

    async def test_ideas_created_from_llm_output(self, db, mock_llm):
        session, sg = await _setup_session_with_subgroup(db)
        user = User(display_name="Alice", session_id=session.id, subgroup_id=sg.id)
        db.add(user)
        await db.flush()
        msg = Message(subgroup_id=sg.id, user_id=user.id, content="We should do X", msg_type=MessageType.human)
        db.add(msg)
        await db.flush()

        mock_llm["generate_json"].return_value = [
            {"summary": "We should do X", "sentiment": 0.7}
        ]
        ideas = await update_taxonomy_for_subgroup(db, session.id, sg.id)
        assert len(ideas) == 1
        assert ideas[0].summary == "We should do X"
        assert ideas[0].sentiment == 0.7

    async def test_no_messages_returns_empty(self, db, mock_llm):
        session, sg = await _setup_session_with_subgroup(db)
        ideas = await update_taxonomy_for_subgroup(db, session.id, sg.id)
        assert ideas == []
        mock_llm["generate_json"].assert_not_awaited()

    async def test_duplicate_summaries_deduplicated(self, db, mock_llm):
        session, sg = await _setup_session_with_subgroup(db)
        user = User(display_name="Bob", session_id=session.id, subgroup_id=sg.id)
        db.add(user)
        await db.flush()
        msg = Message(subgroup_id=sg.id, user_id=user.id, content="test", msg_type=MessageType.human)
        db.add(msg)
        await db.flush()

        mock_llm["generate_json"].return_value = [
            {"summary": "Same idea", "sentiment": 0.5}
        ]
        # First call creates it
        ideas1 = await update_taxonomy_for_subgroup(db, session.id, sg.id)
        assert len(ideas1) == 1
        await db.flush()

        # Second call: same summary → should be skipped
        ideas2 = await update_taxonomy_for_subgroup(db, session.id, sg.id)
        assert len(ideas2) == 0

    async def test_empty_summary_skipped(self, db, mock_llm):
        session, sg = await _setup_session_with_subgroup(db)
        user = User(display_name="C", session_id=session.id, subgroup_id=sg.id)
        db.add(user)
        await db.flush()
        msg = Message(subgroup_id=sg.id, user_id=user.id, content="x", msg_type=MessageType.human)
        db.add(msg)
        await db.flush()

        mock_llm["generate_json"].return_value = [
            {"summary": "", "sentiment": 0.0},
            {"summary": "Real idea", "sentiment": 0.3},
        ]
        ideas = await update_taxonomy_for_subgroup(db, session.id, sg.id)
        assert len(ideas) == 1
        assert ideas[0].summary == "Real idea"


class TestGetIdeasNotInSubgroup:

    async def test_excludes_own_subgroup(self, db):
        session, sg1 = await _setup_session_with_subgroup(db)
        sg2 = Subgroup(session_id=session.id, label="ThinkTank 2")
        db.add(sg2)
        await db.flush()

        idea1 = Idea(session_id=session.id, subgroup_id=sg1.id, summary="from sg1", sentiment=0.5)
        idea2 = Idea(session_id=session.id, subgroup_id=sg2.id, summary="from sg2", sentiment=0.3)
        db.add_all([idea1, idea2])
        await db.flush()

        foreign = await get_ideas_not_in_subgroup(db, session.id, sg1.id)
        summaries = [i.summary for i in foreign]
        assert "from sg2" in summaries
        assert "from sg1" not in summaries
