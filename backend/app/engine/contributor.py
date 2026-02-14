"""Contributor Agent - hybrid mode support.

In hybrid mode, a Contributor Agent can actively participate in the discussion
(not just relay messages) by generating novel arguments or questions.
This is an optional enhancement for Phase 4.
"""
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message, MessageType
from app.models.session import Session
from app.models.subgroup import Subgroup
from app.services.llm import generate_text
from app.services.redis import publish_to_subgroup

logger = logging.getLogger(__name__)


async def deliver_contributor_message(
    db: AsyncSession,
    session: Session,
    subgroup: Subgroup,
    conversation_context: str,
):
    """Generate a novel contribution to the discussion."""
    prompt = f"""You are a Contributor Agent in a group deliberation about: "{session.title}"

Your job is to actively participate by asking thought-provoking questions or
raising perspectives that haven't been considered yet.

Current conversation:
{conversation_context}

Write a single conversational message (1-3 sentences) that either:
- Asks a thought-provoking question that deepens the discussion
- Raises a perspective or consideration not yet mentioned
- Plays devil's advocate on a point of strong agreement

Be concise and natural. Speak as a thoughtful peer."""

    try:
        content = await generate_text(prompt)
    except Exception as e:
        logger.error(f"Contributor agent failed for {subgroup.label}: {e}")
        return

    if not content or not content.strip():
        return

    message = Message(
        subgroup_id=subgroup.id,
        user_id=None,
        content=content.strip(),
        msg_type=MessageType.contributor,
    )
    db.add(message)
    await db.flush()

    await publish_to_subgroup(
        subgroup.id,
        "chat:new_message",
        {
            "id": str(message.id),
            "subgroup_id": str(message.subgroup_id),
            "user_id": None,
            "display_name": "Contributor Agent",
            "content": message.content,
            "msg_type": "contributor",
            "source_subgroup_id": None,
            "created_at": message.created_at.isoformat() if message.created_at else None,
        },
    )
