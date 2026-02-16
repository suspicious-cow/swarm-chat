import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_account
from app.database import get_db
from app.models.account import Account
from app.models.session import SessionStatus
from app.models.user import User
from app.models.session import Session

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class DashboardSession(BaseModel):
    id: uuid.UUID
    title: str
    status: SessionStatus
    is_admin: bool
    join_code: str
    user_count: int
    created_at: datetime
    summary: str | None = None
    final_convergence: float | None = None


@router.get("/sessions", response_model=list[DashboardSession])
async def list_sessions(
    account: Account = Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    """List sessions the logged-in account has participated in."""
    # Subquery: count users per session (avoids N+1)
    user_count_sq = (
        select(User.session_id, func.count(User.id).label("user_count"))
        .group_by(User.session_id)
        .subquery()
    )

    # Single query joining session, the account's user row, and the count subquery
    my_user = select(User.session_id, User.is_admin).where(
        User.account_id == account.id
    ).subquery()

    result = await db.execute(
        select(
            Session.id,
            Session.title,
            Session.status,
            Session.join_code,
            Session.created_at,
            Session.summary,
            Session.final_convergence,
            my_user.c.is_admin,
            func.coalesce(user_count_sq.c.user_count, 0).label("user_count"),
        )
        .join(my_user, my_user.c.session_id == Session.id)
        .outerjoin(user_count_sq, user_count_sq.c.session_id == Session.id)
        .order_by(Session.created_at.desc())
    )
    rows = result.all()

    return [
        DashboardSession(
            id=row.id,
            title=row.title,
            status=row.status,
            is_admin=row.is_admin,
            join_code=row.join_code,
            user_count=row.user_count,
            created_at=row.created_at,
            summary=row.summary,
            final_convergence=row.final_convergence,
        )
        for row in rows
    ]
