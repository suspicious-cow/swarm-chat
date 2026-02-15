"""Integration tests for invite code system and admin invite code CRUD."""

from datetime import datetime, timezone, timedelta


FIRST_USER = {
    "username": "firstuser",
    "password": "firstpass123",
    "display_name": "First User",
}

SECOND_USER = {
    "username": "seconduser",
    "password": "secondpass123",
    "display_name": "Second User",
}


class TestFirstUserRegistration:

    async def test_first_user_no_invite_code_required(self, client):
        """First registered user should not need an invite code."""
        resp = await client.post("/api/auth/register", json=FIRST_USER)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "firstuser"
        assert data["is_server_admin"] is True

    async def test_first_user_auto_admin(self, client):
        """First user is automatically a server admin."""
        resp = await client.post("/api/auth/register", json=FIRST_USER)
        assert resp.status_code == 200
        assert resp.json()["is_server_admin"] is True


class TestInviteCodeRegistration:

    async def _create_first_user_and_code(self, client):
        """Helper: register first user (admin), create an invite code, return code string."""
        resp = await client.post("/api/auth/register", json=FIRST_USER)
        assert resp.status_code == 200
        # First user is admin — use their cookie to create an invite code
        code_resp = await client.post("/api/admin/invite-codes", json={})
        assert code_resp.status_code == 200
        return code_resp.json()["code"]

    async def test_second_user_requires_invite_code(self, client):
        """Second user registration without invite code should fail."""
        await client.post("/api/auth/register", json=FIRST_USER)
        resp = await client.post("/api/auth/register", json=SECOND_USER)
        assert resp.status_code == 400
        assert "invite code" in resp.json()["detail"].lower()

    async def test_second_user_with_valid_code(self, client):
        """Second user can register with a valid invite code."""
        code = await self._create_first_user_and_code(client)
        payload = {**SECOND_USER, "invite_code": code}
        resp = await client.post("/api/auth/register", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "seconduser"
        assert data["is_server_admin"] is False

    async def test_invalid_invite_code_rejected(self, client):
        """Registration with a bogus invite code should fail."""
        await client.post("/api/auth/register", json=FIRST_USER)
        payload = {**SECOND_USER, "invite_code": "FAKECODE"}
        resp = await client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400

    async def test_expired_invite_code_rejected(self, client, db):
        """Registration with an expired invite code should fail."""
        await client.post("/api/auth/register", json=FIRST_USER)
        code_resp = await client.post("/api/admin/invite-codes", json={
            "expires_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        })
        code = code_resp.json()["code"]
        payload = {**SECOND_USER, "invite_code": code}
        resp = await client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400
        assert "expired" in resp.json()["detail"].lower()

    async def test_maxed_out_invite_code_rejected(self, client, db):
        """Registration when invite code max_uses is reached should fail."""
        await client.post("/api/auth/register", json=FIRST_USER)
        code_resp = await client.post("/api/admin/invite-codes", json={"max_uses": 1})
        code = code_resp.json()["code"]

        # Use it once
        payload1 = {**SECOND_USER, "invite_code": code}
        resp1 = await client.post("/api/auth/register", json=payload1)
        assert resp1.status_code == 200

        # Second attempt should fail
        third_user = {
            "username": "thirduser",
            "password": "thirdpass123",
            "display_name": "Third User",
            "invite_code": code,
        }
        resp2 = await client.post("/api/auth/register", json=third_user)
        assert resp2.status_code == 400
        assert "fully used" in resp2.json()["detail"].lower()

    async def test_deactivated_invite_code_rejected(self, client):
        """Registration with a deactivated invite code should fail."""
        await client.post("/api/auth/register", json=FIRST_USER)
        code_resp = await client.post("/api/admin/invite-codes", json={})
        code_data = code_resp.json()

        # Deactivate it
        await client.delete(f"/api/admin/invite-codes/{code_data['id']}")

        payload = {**SECOND_USER, "invite_code": code_data["code"]}
        resp = await client.post("/api/auth/register", json=payload)
        assert resp.status_code == 400

    async def test_invite_code_use_count_increments(self, client):
        """After successful registration, invite code use_count should increase."""
        await client.post("/api/auth/register", json=FIRST_USER)
        code_resp = await client.post("/api/admin/invite-codes", json={})
        code_data = code_resp.json()
        assert code_data["use_count"] == 0

        payload = {**SECOND_USER, "invite_code": code_data["code"]}
        await client.post("/api/auth/register", json=payload)

        # Re-login as admin (registration set cookie to second user)
        await client.post("/api/auth/login", json={
            "username": FIRST_USER["username"],
            "password": FIRST_USER["password"],
        })

        # List codes to check use_count
        list_resp = await client.get("/api/admin/invite-codes")
        codes = list_resp.json()
        updated = [c for c in codes if c["code"] == code_data["code"]][0]
        assert updated["use_count"] == 1


class TestInviteCodeAdminCRUD:

    async def test_create_invite_code(self, admin_auth_client):
        resp = await admin_auth_client.post("/api/admin/invite-codes", json={})
        assert resp.status_code == 200
        data = resp.json()
        assert "code" in data
        assert len(data["code"]) == 8
        assert data["is_active"] is True
        assert data["use_count"] == 0

    async def test_create_invite_code_with_max_uses(self, admin_auth_client):
        resp = await admin_auth_client.post("/api/admin/invite-codes", json={"max_uses": 5})
        assert resp.status_code == 200
        assert resp.json()["max_uses"] == 5

    async def test_list_invite_codes(self, admin_auth_client):
        # Create two codes
        await admin_auth_client.post("/api/admin/invite-codes", json={})
        await admin_auth_client.post("/api/admin/invite-codes", json={})

        resp = await admin_auth_client.get("/api/admin/invite-codes")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    async def test_deactivate_invite_code(self, admin_auth_client):
        create_resp = await admin_auth_client.post("/api/admin/invite-codes", json={})
        code_id = create_resp.json()["id"]

        resp = await admin_auth_client.delete(f"/api/admin/invite-codes/{code_id}")
        assert resp.status_code == 200

        # Verify deactivated
        list_resp = await admin_auth_client.get("/api/admin/invite-codes")
        code = [c for c in list_resp.json() if c["id"] == code_id][0]
        assert code["is_active"] is False

    async def test_deactivate_nonexistent_code(self, admin_auth_client):
        import uuid
        resp = await admin_auth_client.delete(f"/api/admin/invite-codes/{uuid.uuid4()}")
        assert resp.status_code == 404

    async def test_non_admin_cannot_create(self, auth_client):
        resp = await auth_client.post("/api/admin/invite-codes", json={})
        assert resp.status_code == 403

    async def test_non_admin_cannot_list(self, auth_client):
        resp = await auth_client.get("/api/admin/invite-codes")
        assert resp.status_code == 403

    async def test_unauthenticated_cannot_access(self, client):
        resp = await client.post("/api/admin/invite-codes", json={})
        assert resp.status_code == 401
        resp2 = await client.get("/api/admin/invite-codes")
        assert resp2.status_code == 401
