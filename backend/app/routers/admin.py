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

    return {
        "session_id": str(session.id),
        "title": session.title,
        "status": session.status.value,
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

Ideas and arguments that emerged across all groups:
{ideas_text}

Provide a concise summary (3-5 paragraphs) covering:
1. Key points of agreement
2. Major points of disagreement
3. Novel ideas or proposals that emerged
4. Overall sentiment and direction"""

    summary = await generate_text(prompt)
    return {"summary": summary}
