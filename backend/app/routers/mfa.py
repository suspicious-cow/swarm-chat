from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    get_current_account,
    create_access_token,
    verify_mfa_challenge_token,
    MFA_COOKIE_NAME,
)
from app.database import get_db
from app.mfa import generate_totp_secret, get_totp_uri, verify_totp
from app.models.account import Account
from app.routers.auth import AccountOut, _set_auth_cookie

router = APIRouter(prefix="/api/auth/mfa", tags=["mfa"])


class MfaCodeRequest(BaseModel):
    code: str


class MfaSetupOut(BaseModel):
    secret: str
    uri: str


@router.post("/setup", response_model=MfaSetupOut)
async def mfa_setup(account: Account = Depends(get_current_account)):
    if account.totp_secret:
        raise HTTPException(status_code=400, detail="MFA is already enabled")
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, account.username)
    return MfaSetupOut(secret=secret, uri=uri)


class MfaEnableConfirm(BaseModel):
    secret: str
    code: str


@router.post("/enable-confirm")
async def mfa_enable_confirm(
    body: MfaEnableConfirm,
    account: Account = Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    if account.totp_secret:
        raise HTTPException(status_code=400, detail="MFA is already enabled")

    if not verify_totp(body.secret, body.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    account.totp_secret = body.secret
    await db.commit()
    return {"status": "ok", "mfa_enabled": True}


@router.post("/verify-login")
async def mfa_verify_login(
    body: MfaCodeRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    mfa_token = request.cookies.get(MFA_COOKIE_NAME)
    if not mfa_token:
        raise HTTPException(status_code=401, detail="MFA challenge not found")

    account_id = verify_mfa_challenge_token(mfa_token)
    if not account_id:
        raise HTTPException(status_code=401, detail="MFA challenge expired or invalid")

    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()
    if not account or not account.totp_secret:
        raise HTTPException(status_code=401, detail="Account not found")

    if not verify_totp(account.totp_secret, body.code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")

    token = create_access_token(str(account.id))
    out = AccountOut.from_account(account)
    response = JSONResponse(content=out.model_dump(mode="json"))
    _set_auth_cookie(response, token)
    response.delete_cookie(key=MFA_COOKIE_NAME, path="/")
    return response


@router.post("/disable")
async def mfa_disable(
    body: MfaCodeRequest,
    account: Account = Depends(get_current_account),
    db: AsyncSession = Depends(get_db),
):
    if not account.totp_secret:
        raise HTTPException(status_code=400, detail="MFA is not enabled")

    if not verify_totp(account.totp_secret, body.code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")

    account.totp_secret = None
    await db.commit()
    return {"status": "ok", "mfa_enabled": False}
