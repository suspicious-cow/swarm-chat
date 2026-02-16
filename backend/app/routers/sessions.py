import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_optional_account
from app.database import get_db
from app.models.account import Account
from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.models.user import User
from app.schemas.session import SessionCreate, SessionOut, SessionDetail, SessionResults
from app.schemas.subgroup import SubgroupOut
from app.schemas.idea import IdeaOut
from app.schemas.message import MessageOut
from app.models.idea import Idea
from app.models.message import Message
from app.engine.partitioner import create_subgroups_for_session
from app.engine.taxonomy import compute_convergence
from app.websocket.manager import manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = Session(title=body.title, subgroup_size=body.subgroup_size)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_count = await db.scalar(
        select(func.count(User.id)).where(User.session_id == session_id)
    )
    subgroup_count = await db.scalar(
        select(func.count(Subgroup.id)).where(Subgroup.session_id == session_id)
    )

    return SessionDetail(
        **SessionOut.model_validate(session).model_dump(),
        user_count=user_count or 0,
        subgroup_count=subgroup_count or 0,
    )


@router.get("/join/{join_code}", response_model=SessionOut)
async def get_session_by_code(join_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Session).where(Session.join_code == join_code.upper())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid join code")
    return session


@router.post("/{session_id}/start", response_model=list[SubgroupOut])
async def start_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != SessionStatus.waiting:
        raise HTTPException(status_code=400, detail="Session already started")

    # Get all users in the session
    result = await db.execute(
        select(User).where(User.session_id == session_id)
    )
    users = list(result.scalars().all())
    if len(users) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 users to start")

    # Partition into subgroups
    subgroups = await create_subgroups_for_session(
        db, session_id, users, session.subgroup_size
    )
    session.status = SessionStatus.active
    await db.commit()

    # Reload subgroups with members
    result = await db.execute(
        select(Subgroup)
        .options(selectinload(Subgroup.members))
        .where(Subgroup.session_id == session_id)
    )
    subgroups = result.scalars().all()

    # Notify all connected users about session start
    subgroup_data = []
    for sg in subgroups:
        sg_out = SubgroupOut.model_validate(sg)
        subgroup_data.append(sg_out.model_dump(mode="json"))

        # Notify each member of their assignment
        for member in sg.members:
            await manager.send_to_user(
                member.id,
                "session:started",
                {
                    "subgroup": sg_out.model_dump(mode="json"),
                    "user_id": str(member.id),
                },
            )

    # Broadcast to session-level listeners
    await manager.broadcast_to_session(
        session_id,
        "session:started",
        {"subgroups": subgroup_data},
    )

    return subgroups


@router.post("/{session_id}/stop")
async def stop_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    score = await compute_convergence(db, session_id)
    session.final_convergence = score
    session.status = SessionStatus.completed
    await db.commit()

    await manager.broadcast_to_session(
        session_id, "session:completed", {"session_id": str(session_id)}
    )
    return {"status": "completed"}


@router.get("/{session_id}/subgroups", response_model=list[SubgroupOut])
async def get_subgroups(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Subgroup)
        .options(selectinload(Subgroup.members))
        .where(Subgroup.session_id == session_id)
    )
    return result.scalars().all()


@router.get("/{session_id}/ideas", response_model=list[IdeaOut])
async def get_ideas(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Idea)
        .where(Idea.session_id == session_id)
        .order_by(Idea.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{session_id}/results", response_model=SessionResults)
async def get_session_results(
    session_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Subgroups with members
    sg_result = await db.execute(
        select(Subgroup)
        .options(selectinload(Subgroup.members))
        .where(Subgroup.session_id == session_id)
    )
    subgroups = sg_result.scalars().all()

    # Ideas
    idea_result = await db.execute(
        select(Idea)
        .where(Idea.session_id == session_id)
        .order_by(Idea.created_at.desc())
    )
    ideas = idea_result.scalars().all()

    # All messages across all subgroups
    subgroup_ids = [sg.id for sg in subgroups]
    messages: list[Message] = []
    if subgroup_ids:
        msg_result = await db.execute(
            select(Message)
            .where(Message.subgroup_id.in_(subgroup_ids))
            .order_by(Message.created_at)
        )
        messages = list(msg_result.scalars().all())

    return SessionResults(
        id=session.id,
        title=session.title,
        status=session.status,
        created_at=session.created_at,
        summary=session.summary,
        final_convergence=session.final_convergence,
        subgroups=[SubgroupOut.model_validate(sg) for sg in subgroups],
        ideas=[IdeaOut.model_validate(i) for i in ideas],
        messages=[MessageOut.model_validate(m) for m in messages],
    )
