import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.models.idea import Idea
from app.services.llm import generate_text
from app.engine.taxonomy import compute_convergence
from app.websocket.manager import manager

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/{session_id}/status")
async def get_session_status(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(Subgroup)
        .options(selectinload(Subgroup.members))
        .where(Subgroup.session_id == session_id)
    )
    subgroups = result.scalars().all()

    convergence = await compute_convergence(db, session_id)

    return {
        "session_id": str(session.id),
        "title": session.title,
        "status": session.status.value,
        "convergence": convergence,
        "subgroups": [
            {
                "id": str(sg.id),
                "label": sg.label,
                "member_count": len(sg.members),
                "members": [
                    {"id": str(m.id), "display_name": m.display_name}
                    for m in sg.members
                ],
                "online_count": manager.get_subgroup_user_count(sg.id),
            }
            for sg in subgroups
        ],
    }


@router.post("/{session_id}/summary")
async def generate_summary(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(Idea).where(Idea.session_id == session_id).order_by(Idea.created_at)
    )
    ideas = result.scalars().all()

    if not ideas:
        return {"summary": "No ideas were captured during this session."}

    ideas_text = "\n".join(
        f"- {i.summary} (sentiment: {i.sentiment:.1f}, support: {i.support_count}, challenges: {i.challenge_count})"
        for i in ideas
    )

    prompt = f"""Summarize the outcomes of a group deliberation on: "{session.title}"

This deliberation used Conversational Swarm Intelligence — participants were divided
into small subgroups that were interconnected by AI agents relaying insights between
groups, enabling large-scale real-time discussion.

Ideas and arguments that emerged across all groups:
{ideas_text}

Write a deliberative summary (3-5 paragraphs) structured as follows:

1. **Collective Perspective**: State the group's overall conclusion in the voice of the
   collective ("Our collective perspective is..."). What did the group converge on?

2. **Reasoning and Persuasion**: Explain WHY the group reached this conclusion. What
   arguments were most persuasive? Which ideas gained traction across multiple subgroups
   and why? How did the deliberation evolve — did early disagreements resolve?

3. **Dissent and Counterarguments**: What minority views or counterarguments emerged?
   How did the group respond to challenges? Were any strong objections raised?

4. **Novel Insights**: What unexpected ideas, proposals, or connections emerged from
   the cross-group deliberation that individuals might not have reached alone?

5. **Confidence and Convergence**: How decisive was the outcome? Was there strong
   consensus or lingering disagreement? Note the sentiment distribution.

Write in a clear, professional tone. Use "we" and "our" to reflect the collective voice.
The summary should read as the group's own deliberative report, not an external analysis."""

    summary = await generate_text(prompt)

    session.summary = summary
    await db.commit()

    return {"summary": summary}
