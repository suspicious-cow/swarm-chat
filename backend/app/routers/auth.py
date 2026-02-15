import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_mfa_challenge_token,
    get_current_account,
    COOKIE_NAME,
    MFA_COOKIE_NAME,
)
from app.config import settings
from app.database import get_db
from app.models.account import Account
from app.models.invite_code import InviteCode

router = APIRouter(prefix="/api/auth", tags=["auth"])

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,50}$")


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6)
    display_name: str = Field(min_length=1, max_length=100)
    invite_code: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AccountOut(BaseModel):
    id: uuid.UUID
    username: str
    display_name: str
    is_server_admin: bool
    totp_enabled: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_account(cls, account: Account) -> "AccountOut":
        return cls(
            id=account.id,
            username=account.username,
            display_name=account.display_name,
            is_server_admin=account.is_server_admin,
            totp_enabled=account.totp_secret is not None,
            created_at=account.created_at,
        )


def _set_auth_cookie(response: JSONResponse, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,
        max_age=settings.JWT_EXPIRY_HOURS * 3600,
        path="/",
    )


@router.post("/register", response_model=AccountOut)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if not USERNAME_PATTERN.match(body.username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-50 characters (letters, numbers, underscore)",
        )

    existing = await db.execute(
        select(Account).where(Account.username == body.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Registration failed")

    # Check if this is the first account (auto-admin, no invite code needed)
    account_count = await db.scalar(select(func.count(Account.id)))
    is_first_user = account_count == 0

    if not is_first_user:
        # Require a valid invite code
        if not body.invite_code:
            raise HTTPException(status_code=400, detail="Invite code is required")

        result = await db.execute(
            select(InviteCode).where(
                InviteCode.code == body.invite_code,
                InviteCode.is_active == True,
            )
        )
        invite = result.scalar_one_or_none()
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid invite code")

        now = datetime.now(timezone.utc)
        expires_at = invite.expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at < now:
            raise HTTPException(status_code=400, detail="Invite code has expired")
        if invite.max_uses is not None and invite.use_count >= invite.max_uses:
            raise HTTPException(status_code=400, detail="Invite code has been fully used")

        invite.use_count += 1

    account = Account(
        username=body.username,
        password_hash=hash_password(body.password),
        display_name=body.display_name,
        is_server_admin=is_first_user,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)

    token = create_access_token(str(account.id))
    out = AccountOut.from_account(account)
    response = JSONResponse(content=out.model_dump(mode="json"))
    _set_auth_cookie(response, token)
    return response


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Account).where(Account.username == body.username)
    )
    account = result.scalar_one_or_none()
    if not account or not verify_password(body.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # If MFA is enabled, return challenge instead of full auth
    if account.totp_secret:
        mfa_token = create_mfa_challenge_token(str(account.id))
        response = JSONResponse(content={"mfa_required": True})
        response.set_cookie(
            key=MFA_COOKIE_NAME,
            value=mfa_token,
            httponly=True,
            samesite="lax",
            secure=not settings.DEBUG,
            max_age=300,  # 5 minutes
            path="/",
        )
        return response

    token = create_access_token(str(account.id))
    out = AccountOut.from_account(account)
    response = JSONResponse(content=out.model_dump(mode="json"))
    _set_auth_cookie(response, token)
    return response


@router.post("/logout")
async def logout():
    response = JSONResponse(content={"status": "ok"})
    response.delete_cookie(key=COOKIE_NAME, path="/")
    response.delete_cookie(key=MFA_COOKIE_NAME, path="/")
    return response


@router.get("/me", response_model=AccountOut)
async def me(account: Account = Depends(get_current_account)):
    return AccountOut.from_account(account)
