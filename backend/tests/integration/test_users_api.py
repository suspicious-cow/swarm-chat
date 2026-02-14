"""Integration tests: User join, get user, get messages."""

import uuid

import pytest


class TestJoinSession:

    async def test_join_session(self, client):
        create = await client.post("/api/sessions", json={"title": "Join Test"})
        code = create.json()["join_code"]

        resp = await client.post("/api/users", json={"join_code": code, "display_name": "Alice"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["display_name"] == "Alice"
        assert data["is_admin"] is True  # First user is admin
        assert data["subgroup_id"] is None  # Session still waiting

    async def test_second_user_not_admin(self, client):
        create = await client.post("/api/sessions", json={"title": "Admin Test"})
        code = create.json()["join_code"]

        await client.post("/api/users", json={"join_code": code, "display_name": "First"})
        resp = await client.post("/api/users", json={"join_code": code, "display_name": "Second"})
        assert resp.json()["is_admin"] is False

    async def test_invalid_code_404(self, client):
        resp = await client.post("/api/users", json={"join_code": "ZZZZZZ", "display_name": "Nobody"})
        assert resp.status_code == 404

    async def test_join_completed_session_fails(self, client):
        create = await client.post("/api/sessions", json={"title": "Done"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        # Stop session (mark completed)
        await client.post(f"/api/sessions/{sid}/stop")

        resp = await client.post("/api/users", json={"join_code": code, "display_name": "Late"})
        assert resp.status_code == 400


class TestGetUser:

    async def test_get_user(self, client):
        create = await client.post("/api/sessions", json={"title": "Get User"})
        code = create.json()["join_code"]
        join_resp = await client.post("/api/users", json={"join_code": code, "display_name": "Bob"})
        uid = join_resp.json()["id"]

        resp = await client.get(f"/api/users/{uid}")
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Bob"

    async def test_get_nonexistent_user_404(self, client):
        resp = await client.get(f"/api/users/{uuid.uuid4()}")
        assert resp.status_code == 404


class TestGetMessages:

    async def test_messages_for_user_without_subgroup_404(self, client):
        create = await client.post("/api/sessions", json={"title": "Msgs"})
        code = create.json()["join_code"]
        join_resp = await client.post("/api/users", json={"join_code": code, "display_name": "NoSG"})
        uid = join_resp.json()["id"]

        resp = await client.get(f"/api/users/{uid}/messages")
        assert resp.status_code == 404

    async def test_messages_for_user_in_subgroup(self, client):
        create = await client.post("/api/sessions", json={"title": "Chat Msgs"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        u1 = (await client.post("/api/users", json={"join_code": code, "display_name": "A"})).json()
        await client.post("/api/users", json={"join_code": code, "display_name": "B"})
        await client.post(f"/api/sessions/{sid}/start")

        # Refresh user to get subgroup
        uid = u1["id"]
        user_resp = await client.get(f"/api/users/{uid}")
        user_data = user_resp.json()

        if user_data["subgroup_id"]:
            resp = await client.get(f"/api/users/{uid}/messages")
            assert resp.status_code == 200
            assert isinstance(resp.json(), list)
