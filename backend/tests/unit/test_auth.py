"""Unit tests for auth utility functions: hashing, verification, JWT tokens."""

from app.auth import hash_password, verify_password, create_access_token
from app.config import settings
from jose import jwt, ExpiredSignatureError


class TestHashPassword:

    async def test_hash_password_returns_bcrypt_hash(self):
        hashed = hash_password("mypassword")
        assert hashed.startswith("$2b$")

    async def test_hash_password_different_each_call(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # bcrypt salts differ


class TestVerifyPassword:

    async def test_verify_password_correct(self):
        hashed = hash_password("correct_password")
        assert verify_password("correct_password", hashed) is True

    async def test_verify_password_wrong(self):
        hashed = hash_password("correct_password")
        assert verify_password("wrong_password", hashed) is False


class TestCreateAccessToken:

    async def test_create_access_token_valid(self):
        token = create_access_token("some-account-id")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        assert payload["sub"] == "some-account-id"
        assert "exp" in payload

    async def test_create_access_token_expired(self, monkeypatch):
        monkeypatch.setattr(settings, "JWT_EXPIRY_HOURS", -1)
        token = create_access_token("expired-id")
        try:
            jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
            assert False, "Expected ExpiredSignatureError"
        except ExpiredSignatureError:
            pass  # expected
