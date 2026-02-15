import secrets
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_server_admin
from app.database import get_db
from app.models.account import Account
from app.models.invite_code import InviteCode

router = APIRouter(prefix="/api/admin/invite-codes", tags=["invite-codes"])


class InviteCodeCreate(BaseModel):
    max_uses: int | None = None
    expires_at: datetime | None = None


class InviteCodeOut(BaseModel):
    id: uuid.UUID
    code: str
    created_by: uuid.UUID
    max_uses: int | None
    use_count: int
    expires_at: datetime | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=InviteCodeOut)
async def create_invite_code(
    body: InviteCodeCreate,
    admin: Account = Depends(get_current_server_admin),
    db: AsyncSession = Depends(get_db),
):
    code = secrets.token_hex(4).upper()
    invite = InviteCode(
        code=code,
        created_by=admin.id,
        max_uses=body.max_uses,
        expires_at=body.expires_at,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite


@router.get("", response_model=list[InviteCodeOut])
async def list_invite_codes(
    admin: Account = Depends(get_current_server_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InviteCode).order_by(InviteCode.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{invite_code_id}")
async def deactivate_invite_code(
    invite_code_id: uuid.UUID,
    admin: Account = Depends(get_current_server_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InviteCode).where(InviteCode.id == invite_code_id)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found")
    invite.is_active = False
    await db.commit()
    return {"status": "ok"}
