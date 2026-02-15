"""Unit tests for MFA utilities and MFA challenge tokens."""

import pyotp

from app.auth import create_mfa_challenge_token, verify_mfa_challenge_token
from app.mfa import generate_totp_secret, get_totp_uri, verify_totp


class TestGenerateTotpSecret:

    async def test_returns_base32_string(self):
        secret = generate_totp_secret()
        assert isinstance(secret, str)
        assert len(secret) > 0

    async def test_unique_each_call(self):
        s1 = generate_totp_secret()
        s2 = generate_totp_secret()
        assert s1 != s2


class TestGetTotpUri:

    async def test_uri_format(self):
        secret = generate_totp_secret()
        uri = get_totp_uri(secret, "alice")
        assert uri.startswith("otpauth://totp/")
        assert "alice" in uri
        assert "SwarmChat" in uri

    async def test_custom_issuer(self):
        secret = generate_totp_secret()
        uri = get_totp_uri(secret, "bob", issuer="MyApp")
        assert "MyApp" in uri


class TestVerifyTotp:

    async def test_valid_code(self):
        secret = generate_totp_secret()
        totp = pyotp.TOTP(secret)
        code = totp.now()
        assert verify_totp(secret, code) is True

    async def test_invalid_code(self):
        secret = generate_totp_secret()
        assert verify_totp(secret, "000000") is False

    async def test_wrong_secret(self):
        secret1 = generate_totp_secret()
        secret2 = generate_totp_secret()
        totp = pyotp.TOTP(secret1)
        code = totp.now()
        assert verify_totp(secret2, code) is False


class TestMfaChallengeToken:

    async def test_create_and_verify(self):
        token = create_mfa_challenge_token("test-account-id")
        result = verify_mfa_challenge_token(token)
        assert result == "test-account-id"

    async def test_invalid_token(self):
        result = verify_mfa_challenge_token("garbage-token")
        assert result is None

    async def test_access_token_rejected(self):
        """A regular access token (no 'purpose' claim) should not pass MFA verification."""
        from app.auth import create_access_token

        token = create_access_token("test-account-id")
        result = verify_mfa_challenge_token(token)
        assert result is None

    async def test_expired_token(self, monkeypatch):
        from datetime import datetime, timezone, timedelta
        from jose import jwt
        from app.config import settings

        expire = datetime.now(timezone.utc) - timedelta(minutes=1)
        payload = {"sub": "test-id", "purpose": "mfa", "exp": expire}
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        result = verify_mfa_challenge_token(token)
        assert result is None
