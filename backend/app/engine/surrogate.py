"""Surrogate Agent - crafts and delivers relay messages."""
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message, MessageType
from app.models.session import Session
from app.models.subgroup import Subgroup
from app.services.llm import generate_text
from app.services.redis import publish_to_subgroup

logger = logging.getLogger(__name__)


async def deliver_surrogate_message(
    db: AsyncSession,
    session: Session,
    subgroup: Subgroup,
    insights: list[str],
):
    """Craft and deliver a surrogate message to a subgroup."""
    if not insights:
        return

    # Get recent messages for context
    result = await db.execute(
        select(Message)
        .where(Message.subgroup_id == subgroup.id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    recent_messages = result.scalars().all()

    context = "\n".join(
        f"- {m.content}" for m in reversed(recent_messages)
    ) if recent_messages else "(No messages yet)"

    # Notify typing
    await publish_to_subgroup(
        subgroup.id,
        "chat:surrogate_typing",
        {"subgroup_id": str(subgroup.id)},
    )

    # Craft message via LLM
    insights_text = "\n".join(f"- {i}" for i in insights)
    prompt = f"""You are a Surrogate Agent in a group deliberation about: "{session.title}"

Your job is to naturally introduce insights from other discussion groups into this conversation.
You should speak as a friendly peer, not as an authority or AI. Use natural language like:
- "I've been hearing from other groups that..."
- "Some folks elsewhere raised an interesting point about..."
- "There's another perspective floating around that..."

Current conversation context in this group:
{context}

Insights from other groups to introduce:
{insights_text}

Write a single conversational message (2-4 sentences) that naturally weaves in 1-2 of these insights.
Be concise and conversational. Do NOT list all insights - pick the most relevant or challenging ones.
Do NOT use bullet points. Write naturally as if you're chatting."""

    try:
        content = await generate_text(prompt)
    except Exception as e:
        logger.error(f"LLM call failed for surrogate in {subgroup.label}: {e}")
        return

    if not content or not content.strip():
        return

    # Save to DB
    message = Message(
        subgroup_id=subgroup.id,
        user_id=None,
        content=content.strip(),
        msg_type=MessageType.surrogate,
    )
    db.add(message)
    await db.flush()

    # Broadcast via Redis
    await publish_to_subgroup(
        subgroup.id,
        "chat:new_message",
        {
            "id": str(message.id),
            "subgroup_id": str(message.subgroup_id),
            "user_id": None,
            "display_name": "Surrogate Agent",
            "content": message.content,
            "msg_type": "surrogate",
            "source_subgroup_id": None,
            "created_at": message.created_at.isoformat() if message.created_at else None,
        },
    )
