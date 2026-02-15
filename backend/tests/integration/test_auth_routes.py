"""Integration tests for auth endpoints: register, login, logout, me."""


REGISTER_PAYLOAD = {
    "username": "testuser",
    "password": "testpass123",
    "display_name": "Test User",
}


class TestRegister:

    async def test_register_success(self, client):
        resp = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["display_name"] == "Test User"
        assert "swarm_token" in resp.cookies

    async def test_register_duplicate_username(self, client):
        await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
        resp = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
        assert resp.status_code == 409

    async def test_register_short_username(self, client):
        resp = await client.post(
            "/api/auth/register",
            json={"username": "ab", "password": "testpass123", "display_name": "X"},
        )
        assert resp.status_code == 422

    async def test_register_short_password(self, client):
        resp = await client.post(
            "/api/auth/register",
            json={"username": "validuser", "password": "12345", "display_name": "X"},
        )
        assert resp.status_code == 422

    async def test_register_invalid_username_chars(self, client):
        resp = await client.post(
            "/api/auth/register",
            json={"username": "user@name", "password": "testpass123", "display_name": "X"},
        )
        assert resp.status_code == 400


class TestLogin:

    async def _register(self, client):
        await client.post("/api/auth/register", json=REGISTER_PAYLOAD)

    async def test_login_success(self, client):
        await self._register(client)
        resp = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "testpass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert "swarm_token" in resp.cookies

    async def test_login_wrong_password(self, client):
        await self._register(client)
        resp = await client.post(
            "/api/auth/login",
            json={"username": "testuser", "password": "wrongpass"},
        )
        assert resp.status_code == 401

    async def test_login_nonexistent(self, client):
        resp = await client.post(
            "/api/auth/login",
            json={"username": "ghost", "password": "testpass123"},
        )
        assert resp.status_code == 401


class TestLogout:

    async def test_logout(self, client):
        resp = await client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        # Cookie should be deleted (set to empty / max-age=0)
        assert "swarm_token" in resp.headers.get("set-cookie", "")


class TestMe:

    async def test_me_authenticated(self, auth_client):
        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["display_name"] == "Test User"

    async def test_me_unauthenticated(self, client):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401
