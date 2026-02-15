"""Integration tests for MFA setup, enable, login challenge, verify, and disable flows."""

import pyotp


REGISTER_PAYLOAD = {
    "username": "mfauser",
    "password": "mfapass123",
    "display_name": "MFA User",
}


class TestMfaSetup:

    async def test_setup_returns_secret_and_uri(self, auth_client):
        resp = await auth_client.post("/api/auth/mfa/setup")
        assert resp.status_code == 200
        data = resp.json()
        assert "secret" in data
        assert "uri" in data
        assert data["uri"].startswith("otpauth://totp/")

    async def test_setup_fails_if_already_enabled(self, auth_client, account, db):
        account.totp_secret = pyotp.random_base32()
        await db.commit()
        resp = await auth_client.post("/api/auth/mfa/setup")
        assert resp.status_code == 400
        assert "already enabled" in resp.json()["detail"].lower()

    async def test_setup_unauthenticated(self, client):
        resp = await client.post("/api/auth/mfa/setup")
        assert resp.status_code == 401


class TestMfaEnableConfirm:

    async def test_enable_with_valid_code(self, auth_client, account, db):
        # Get a setup secret
        setup_resp = await auth_client.post("/api/auth/mfa/setup")
        secret = setup_resp.json()["secret"]

        # Generate a valid code
        totp = pyotp.TOTP(secret)
        code = totp.now()

        resp = await auth_client.post(
            "/api/auth/mfa/enable-confirm",
            json={"secret": secret, "code": code},
        )
        assert resp.status_code == 200
        assert resp.json()["mfa_enabled"] is True

        # Verify account now has totp_secret
        await db.refresh(account)
        assert account.totp_secret == secret

    async def test_enable_with_invalid_code(self, auth_client):
        setup_resp = await auth_client.post("/api/auth/mfa/setup")
        secret = setup_resp.json()["secret"]

        resp = await auth_client.post(
            "/api/auth/mfa/enable-confirm",
            json={"secret": secret, "code": "000000"},
        )
        assert resp.status_code == 400
        assert "invalid" in resp.json()["detail"].lower()

    async def test_enable_fails_if_already_enabled(self, auth_client, account, db):
        account.totp_secret = pyotp.random_base32()
        await db.commit()

        resp = await auth_client.post(
            "/api/auth/mfa/enable-confirm",
            json={"secret": "ANYSECRET", "code": "123456"},
        )
        assert resp.status_code == 400
        assert "already enabled" in resp.json()["detail"].lower()


class TestMfaLoginChallenge:

    async def _register_with_mfa(self, client):
        """Register first user, enable MFA, return (account_data, totp_secret)."""
        reg_resp = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
        assert reg_resp.status_code == 200

        # Setup MFA
        setup_resp = await client.post("/api/auth/mfa/setup")
        secret = setup_resp.json()["secret"]

        # Enable MFA with valid code
        totp = pyotp.TOTP(secret)
        enable_resp = await client.post(
            "/api/auth/mfa/enable-confirm",
            json={"secret": secret, "code": totp.now()},
        )
        assert enable_resp.status_code == 200
        return reg_resp.json(), secret

    async def test_login_with_mfa_returns_challenge(self, client):
        """Login with MFA-enabled account should return mfa_required."""
        await self._register_with_mfa(client)

        resp = await client.post(
            "/api/auth/login",
            json={"username": "mfauser", "password": "mfapass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["mfa_required"] is True
        # Should have MFA cookie but NOT auth cookie
        assert "swarm_mfa" in resp.headers.get("set-cookie", "")

    async def test_verify_mfa_completes_login(self, client):
        """Verify MFA with correct code should return account and set auth cookie."""
        _, secret = await self._register_with_mfa(client)

        # Login to get MFA challenge
        login_resp = await client.post(
            "/api/auth/login",
            json={"username": "mfauser", "password": "mfapass123"},
        )
        assert login_resp.status_code == 200

        # Verify with correct code
        totp = pyotp.TOTP(secret)
        verify_resp = await client.post(
            "/api/auth/mfa/verify-login",
            json={"code": totp.now()},
        )
        assert verify_resp.status_code == 200
        data = verify_resp.json()
        assert data["username"] == "mfauser"
        assert "swarm_token" in verify_resp.headers.get("set-cookie", "")

    async def test_verify_mfa_wrong_code(self, client):
        """Verify MFA with wrong code should fail."""
        await self._register_with_mfa(client)

        # Login to get MFA challenge
        await client.post(
            "/api/auth/login",
            json={"username": "mfauser", "password": "mfapass123"},
        )

        verify_resp = await client.post(
            "/api/auth/mfa/verify-login",
            json={"code": "000000"},
        )
        assert verify_resp.status_code == 401

    async def test_verify_mfa_no_cookie(self, client):
        """Verify MFA without the challenge cookie should fail."""
        resp = await client.post(
            "/api/auth/mfa/verify-login",
            json={"code": "123456"},
        )
        assert resp.status_code == 401
        assert "challenge not found" in resp.json()["detail"].lower()

    async def test_login_without_mfa_returns_account(self, client):
        """Login without MFA enabled should return account directly."""
        await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
        resp = await client.post(
            "/api/auth/login",
            json={"username": "mfauser", "password": "mfapass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "mfauser"
        assert "mfa_required" not in data


class TestMfaDisable:

    async def test_disable_with_valid_code(self, auth_client, account, db):
        # Enable MFA first
        secret = pyotp.random_base32()
        account.totp_secret = secret
        await db.commit()

        totp = pyotp.TOTP(secret)
        resp = await auth_client.post(
            "/api/auth/mfa/disable",
            json={"code": totp.now()},
        )
        assert resp.status_code == 200
        assert resp.json()["mfa_enabled"] is False

        await db.refresh(account)
        assert account.totp_secret is None

    async def test_disable_with_invalid_code(self, auth_client, account, db):
        secret = pyotp.random_base32()
        account.totp_secret = secret
        await db.commit()

        resp = await auth_client.post(
            "/api/auth/mfa/disable",
            json={"code": "000000"},
        )
        assert resp.status_code == 401

    async def test_disable_when_not_enabled(self, auth_client):
        resp = await auth_client.post(
            "/api/auth/mfa/disable",
            json={"code": "123456"},
        )
        assert resp.status_code == 400
        assert "not enabled" in resp.json()["detail"].lower()


class TestMeEndpointTotpEnabled:

    async def test_me_shows_totp_enabled_false(self, auth_client):
        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["totp_enabled"] is False

    async def test_me_shows_totp_enabled_true(self, auth_client, account, db):
        account.totp_secret = pyotp.random_base32()
        await db.commit()

        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["totp_enabled"] is True
