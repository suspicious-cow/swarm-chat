from datetime import datetime, timezone, timedelta

from fastapi import Request, HTTPException, Depends
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.account import Account

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

COOKIE_NAME = "swarm_token"
MFA_COOKIE_NAME = "swarm_mfa"


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(account_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRY_HOURS)
    payload = {"sub": account_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_mfa_challenge_token(account_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    payload = {"sub": account_id, "purpose": "mfa", "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_mfa_challenge_token(token: str) -> str | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("purpose") != "mfa":
            return None
        return payload.get("sub")
    except JWTError:
        return None


async def get_current_account(
    request: Request, db: AsyncSession = Depends(get_db)
) -> Account:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        account_id = payload.get("sub")
        if not account_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=401, detail="Account not found")
    return account


async def get_current_server_admin(
    account: Account = Depends(get_current_account),
) -> Account:
    if not account.is_server_admin:
        raise HTTPException(status_code=403, detail="Server admin required")
    return account


async def get_optional_account(
    request: Request, db: AsyncSession = Depends(get_db)
) -> Account | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        account_id = payload.get("sub")
        if not account_id:
            return None
    except JWTError:
        return None

    result = await db.execute(select(Account).where(Account.id == account_id))
    return result.scalar_one_or_none()
