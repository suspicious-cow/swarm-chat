"""Tests for app.engine.contributor — contributor message delivery."""

import pytest
from sqlalchemy import select

from app.models.session import Session
from app.models.subgroup import Subgroup
from app.models.message import Message, MessageType
from app.engine.contributor import deliver_contributor_message


async def _setup(db):
    session = Session(title="Test")
    db.add(session)
    await db.flush()
    sg = Subgroup(session_id=session.id, label="ThinkTank 1")
    db.add(sg)
    await db.flush()
    return session, sg


class TestDeliverContributorMessage:

    async def test_message_saved_as_contributor(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = "Have you considered X?"

        await deliver_contributor_message(db, session, sg, "Some context")
        await db.flush()

        result = await db.execute(select(Message).where(Message.subgroup_id == sg.id))
        messages = result.scalars().all()
        assert len(messages) == 1
        assert messages[0].msg_type == MessageType.contributor
        assert messages[0].user_id is None
        assert messages[0].content == "Have you considered X?"

    async def test_broadcasts_to_subgroup(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = "Novel question?"

        await deliver_contributor_message(db, session, sg, "context")

        mock_redis["publish_to_subgroup"].assert_awaited_once()
        call_args = mock_redis["publish_to_subgroup"].call_args
        assert call_args[0][0] == sg.id
        assert call_args[0][1] == "chat:new_message"

    async def test_empty_llm_response_no_save(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = ""

        await deliver_contributor_message(db, session, sg, "context")

        result = await db.execute(select(Message).where(Message.subgroup_id == sg.id))
        assert result.scalars().all() == []
        mock_redis["publish_to_subgroup"].assert_not_awaited()

    async def test_llm_exception_handled(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].side_effect = Exception("LLM down")

        # Should not raise
        await deliver_contributor_message(db, session, sg, "context")

        result = await db.execute(select(Message).where(Message.subgroup_id == sg.id))
        assert result.scalars().all() == []
