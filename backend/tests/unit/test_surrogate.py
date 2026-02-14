"""Tests for app.engine.surrogate — surrogate message delivery."""

from unittest.mock import AsyncMock

import pytest

from app.models.session import Session
from app.models.subgroup import Subgroup
from app.models.user import User
from app.models.message import Message, MessageType
from app.engine.surrogate import deliver_surrogate_message
from sqlalchemy import select


async def _setup(db):
    session = Session(title="Test")
    db.add(session)
    await db.flush()
    sg = Subgroup(session_id=session.id, label="ThinkTank 1")
    db.add(sg)
    await db.flush()
    return session, sg


class TestDeliverSurrogateMessage:

    async def test_message_saved_as_surrogate(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = "Here's what another group said..."

        await deliver_surrogate_message(db, session, sg, ["Insight from group 2"])
        await db.flush()

        result = await db.execute(select(Message).where(Message.subgroup_id == sg.id))
        messages = result.scalars().all()
        assert len(messages) == 1
        assert messages[0].msg_type == MessageType.surrogate
        assert messages[0].user_id is None
        assert "another group" in messages[0].content

    async def test_typing_indicator_published(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = "Relay message"

        await deliver_surrogate_message(db, session, sg, ["Insight"])

        # First call should be typing indicator
        mock_redis["publish_to_subgroup"].assert_any_call(
            sg.id, "chat:surrogate_typing", {"subgroup_id": str(sg.id)}
        )

    async def test_empty_llm_response_no_message(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = ""

        await deliver_surrogate_message(db, session, sg, ["Insight"])

        result = await db.execute(select(Message).where(Message.subgroup_id == sg.id))
        assert result.scalars().all() == []

    async def test_empty_insights_early_return(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)

        await deliver_surrogate_message(db, session, sg, [])

        mock_llm["generate_text"].assert_not_awaited()

    async def test_broadcast_after_save(self, db, mock_llm, mock_redis):
        session, sg = await _setup(db)
        mock_llm["generate_text"].return_value = "Relay content"

        await deliver_surrogate_message(db, session, sg, ["Insight"])

        # Should have broadcast to subgroup after saving
        calls = mock_redis["publish_to_subgroup"].call_args_list
        # At least 2 calls: typing indicator + new_message
        assert len(calls) >= 2
        last_call = calls[-1]
        assert last_call[0][1] == "chat:new_message"
