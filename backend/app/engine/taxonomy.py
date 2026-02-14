import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.idea import Idea
from app.models.message import Message
from app.models.session import Session
from app.services.llm import generate_json


async def update_taxonomy_for_subgroup(
    db: AsyncSession,
    session_id: uuid.UUID,
    subgroup_id: uuid.UUID,
) -> list[Idea]:
    """Extract ideas from recent messages and update the idea taxonomy."""
    # Get session topic
    session = await db.get(Session, session_id)
    if not session:
        return []

    # Get recent messages from this subgroup (last 20)
    result = await db.execute(
        select(Message)
        .where(Message.subgroup_id == subgroup_id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    messages = result.scalars().all()
    if not messages:
        return []

    messages_text = "\n".join(
        f"- {m.content}" for m in reversed(messages)
    )

    # Extract ideas via LLM
    prompt = f"""Analyze the following discussion messages about the topic: "{session.title}"

Extract distinct ideas, arguments, or proposals mentioned. For each idea, provide:
- summary: A concise 1-2 sentence description
- sentiment: A float from -1.0 (strongly against the topic) to 1.0 (strongly for)

Return a JSON array of objects with "summary" and "sentiment" fields.
If no clear ideas are present, return an empty array [].

Messages:
{messages_text}

Return ONLY valid JSON, no markdown formatting."""

    raw_ideas = await generate_json(prompt)

    new_ideas = []
    for idea_data in raw_ideas:
        summary = idea_data.get("summary", "").strip()
        sentiment = idea_data.get("sentiment", 0.0)
        if not summary:
            continue

        # Check if a similar idea already exists (simple dedup by session)
        existing = await db.execute(
            select(Idea)
            .where(Idea.session_id == session_id)
            .where(Idea.summary == summary)
        )
        if existing.scalar_one_or_none():
            continue

        idea = Idea(
            session_id=session_id,
            subgroup_id=subgroup_id,
            summary=summary,
            sentiment=float(sentiment),
        )
        db.add(idea)
        new_ideas.append(idea)

    await db.flush()
    return new_ideas


async def get_ideas_for_session(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[Idea]:
    result = await db.execute(
        select(Idea)
        .where(Idea.session_id == session_id)
        .order_by(Idea.created_at.desc())
    )
    return list(result.scalars().all())


async def get_ideas_not_in_subgroup(
    db: AsyncSession,
    session_id: uuid.UUID,
    subgroup_id: uuid.UUID,
) -> list[Idea]:
    """Get ideas from other subgroups not yet discussed in this one."""
    result = await db.execute(
        select(Idea)
        .where(Idea.session_id == session_id)
        .where(Idea.subgroup_id != subgroup_id)
        .order_by(Idea.created_at.desc())
        .limit(10)
    )
    return list(result.scalars().all())
