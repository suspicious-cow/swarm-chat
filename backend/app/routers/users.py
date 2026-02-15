import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_optional_account
from app.database import get_db
from app.models.account import Account
from app.models.session import Session, SessionStatus
from app.models.user import User
from app.models.message import Message
from app.schemas.user import UserCreate, UserOut
from app.schemas.message import MessageOut
from app.engine.partitioner import assign_user_to_subgroup
from app.websocket.manager import manager

router = APIRouter(prefix="/api/users", tags=["users"])


@router.post("", response_model=UserOut)
async def join_session(
    body: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Join a session using a join code."""
    account = await get_optional_account(request, db)

    result = await db.execute(
        select(Session).where(Session.join_code == body.join_code.upper())
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid join code")
    if session.status == SessionStatus.completed:
        raise HTTPException(status_code=400, detail="Session has ended")

    # Check if this is the first user (make them admin)
    existing_count = await db.scalar(
        select(User.id).where(User.session_id == session.id).limit(1)
    )
    is_admin = existing_count is None

    display_name = body.display_name
    if account and not display_name:
        display_name = account.display_name

    user = User(
        display_name=display_name,
        session_id=session.id,
        is_admin=is_admin,
        account_id=account.id if account else None,
    )
    db.add(user)

    # If session is already active, assign to a subgroup immediately
    if session.status == SessionStatus.active:
        await db.flush()
        subgroup = await assign_user_to_subgroup(db, user, session.id, session.subgroup_size)
        await manager.broadcast_to_session(
            session.id,
            "session:user_joined",
            {"user_id": str(user.id), "display_name": user.display_name, "subgroup_id": str(subgroup.id)},
        )

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}/messages", response_model=list[MessageOut])
async def get_user_messages(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get messages in the user's subgroup."""
    user = await db.get(User, user_id)
    if not user or not user.subgroup_id:
        raise HTTPException(status_code=404, detail="User not in a subgroup")

    result = await db.execute(
        select(Message)
        .where(Message.subgroup_id == user.subgroup_id)
        .order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()

    # Enrich with display names
    out = []
    for m in messages:
        display_name = None
        if m.user_id:
            msg_user = await db.get(User, m.user_id)
            display_name = msg_user.display_name if msg_user else None
        elif m.msg_type.value == "surrogate":
            display_name = "Surrogate Agent"
        elif m.msg_type.value == "contributor":
            display_name = "Contributor Agent"

        out.append(MessageOut(
            id=m.id,
            subgroup_id=m.subgroup_id,
            user_id=m.user_id,
            display_name=display_name,
            content=m.content,
            msg_type=m.msg_type,
            source_subgroup_id=m.source_subgroup_id,
            created_at=m.created_at,
        ))
    return out
