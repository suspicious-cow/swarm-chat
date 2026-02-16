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

    # Batch fetch all existing summaries for dedup (avoids N queries)
    existing_result = await db.execute(
        select(Idea.summary).where(Idea.session_id == session_id)
    )
    existing_summaries = set(existing_result.scalars().all())

    new_ideas = []
    for idea_data in raw_ideas:
        summary = idea_data.get("summary", "").strip()
        sentiment = idea_data.get("sentiment", 0.0)
        if not summary or summary in existing_summaries:
            continue

        existing_summaries.add(summary)  # prevent duplicates within batch
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
    """Get ideas from other subgroups, prioritizing those that challenge local consensus.

    The CME paper specifies that cross-pollinated content should prioritize
    ideas that CHALLENGE a subgroup's prevailing beliefs, not just any unheard
    idea. We compute the subgroup's average sentiment and rank foreign ideas
    by how far they diverge from it.
    """
    from sqlalchemy import func as sa_func

    # Compute local subgroup's average sentiment
    local_avg = await db.scalar(
        select(sa_func.avg(Idea.sentiment))
        .where(Idea.session_id == session_id)
        .where(Idea.subgroup_id == subgroup_id)
    )
    local_sentiment: float = float(local_avg) if local_avg is not None else 0.0

    # Fetch foreign ideas
    result = await db.execute(
        select(Idea)
        .where(Idea.session_id == session_id)
        .where(Idea.subgroup_id != subgroup_id)
    )
    foreign_ideas = list(result.scalars().all())

    # Sort by sentiment distance from local consensus (most challenging first)
    foreign_ideas.sort(key=lambda idea: abs(idea.sentiment - local_sentiment), reverse=True)

    return foreign_ideas[:10]


async def compute_convergence(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> float:
    """Compute convergence score (0.0 = divergent, 1.0 = fully converged).

    Measures how aligned subgroup sentiments are across the session.
    When all subgroups share similar average sentiment, convergence is high.
    """
    from sqlalchemy import func as sa_func

    # Get average sentiment per subgroup
    result = await db.execute(
        select(
            Idea.subgroup_id,
            sa_func.avg(Idea.sentiment).label("avg_sentiment"),
        )
        .where(Idea.session_id == session_id)
        .group_by(Idea.subgroup_id)
    )
    rows = result.all()

    if len(rows) < 2:
        return 0.0  # Need at least 2 subgroups to measure convergence

    sentiments = [float(row.avg_sentiment) for row in rows]

    # Compute variance of subgroup sentiments
    mean = sum(sentiments) / len(sentiments)
    variance = sum((s - mean) ** 2 for s in sentiments) / len(sentiments)

    # Map variance to 0-1 scale. Max possible variance for sentiment in [-1,1] is 1.0.
    # Score = 1 - sqrt(variance) gives us a 0-1 convergence metric.
    convergence = max(0.0, 1.0 - variance ** 0.5)
    return round(convergence, 3)
