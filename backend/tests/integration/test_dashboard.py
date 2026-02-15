"""Integration tests for dashboard endpoints."""


class TestListSessions:

    async def test_list_sessions_empty(self, auth_client):
        resp = await auth_client.get("/api/dashboard/sessions")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_sessions_with_data(self, auth_client, account):
        # 1. Create a session
        create_resp = await auth_client.post(
            "/api/sessions", json={"title": "Dashboard Test"}
        )
        assert create_resp.status_code == 200
        join_code = create_resp.json()["join_code"]

        # 2. Join the session (auth_client has swarm_token, so account_id is set)
        join_resp = await auth_client.post(
            "/api/users",
            json={"join_code": join_code, "display_name": "Test User"},
        )
        assert join_resp.status_code == 200
        assert join_resp.json()["account_id"] == str(account.id)

        # 3. Dashboard should list the session
        resp = await auth_client.get("/api/dashboard/sessions")
        assert resp.status_code == 200
        sessions = resp.json()
        assert len(sessions) == 1
        assert sessions[0]["title"] == "Dashboard Test"
        assert sessions[0]["user_count"] == 1
        assert sessions[0]["is_admin"] is True

    async def test_list_sessions_unauthenticated(self, client):
        resp = await client.get("/api/dashboard/sessions")
        assert resp.status_code == 401
