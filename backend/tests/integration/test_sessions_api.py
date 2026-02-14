"""Integration tests: Session CRUD, start/stop, subgroups, ideas."""

import uuid

import pytest


class TestSessionCreate:

    async def test_create_session(self, client):
        resp = await client.post("/api/sessions", json={"title": "Test Topic", "subgroup_size": 5})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Test Topic"
        assert data["subgroup_size"] == 5
        assert data["status"] == "waiting"
        assert len(data["join_code"]) == 6
        assert "id" in data

    async def test_create_session_default_size(self, client):
        resp = await client.post("/api/sessions", json={"title": "Default Size"})
        assert resp.status_code == 200
        assert resp.json()["subgroup_size"] == 5


class TestSessionGet:

    async def test_get_session_by_id(self, client):
        create = await client.post("/api/sessions", json={"title": "Topic"})
        sid = create.json()["id"]
        resp = await client.get(f"/api/sessions/{sid}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == sid
        assert data["user_count"] == 0
        assert data["subgroup_count"] == 0

    async def test_get_session_404(self, client):
        fake_id = str(uuid.uuid4())
        resp = await client.get(f"/api/sessions/{fake_id}")
        assert resp.status_code == 404


class TestSessionByCode:

    async def test_find_by_join_code(self, client):
        create = await client.post("/api/sessions", json={"title": "Code Test"})
        code = create.json()["join_code"]
        resp = await client.get(f"/api/sessions/join/{code}")
        assert resp.status_code == 200
        assert resp.json()["join_code"] == code

    async def test_invalid_code_404(self, client):
        resp = await client.get("/api/sessions/join/XXXXXX")
        assert resp.status_code == 404


class TestSessionStart:

    async def test_start_with_enough_users(self, client):
        create = await client.post("/api/sessions", json={"title": "Start Me"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        # Join 2 users
        await client.post("/api/users", json={"join_code": code, "display_name": "Alice"})
        await client.post("/api/users", json={"join_code": code, "display_name": "Bob"})

        resp = await client.post(f"/api/sessions/{sid}/start")
        assert resp.status_code == 200
        subgroups = resp.json()
        assert len(subgroups) >= 1

    async def test_start_with_one_user_fails(self, client):
        create = await client.post("/api/sessions", json={"title": "Lonely"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        await client.post("/api/users", json={"join_code": code, "display_name": "Solo"})

        resp = await client.post(f"/api/sessions/{sid}/start")
        assert resp.status_code == 400

    async def test_start_already_active_fails(self, client):
        create = await client.post("/api/sessions", json={"title": "Double Start"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        await client.post("/api/users", json={"join_code": code, "display_name": "A"})
        await client.post("/api/users", json={"join_code": code, "display_name": "B"})
        await client.post(f"/api/sessions/{sid}/start")

        resp = await client.post(f"/api/sessions/{sid}/start")
        assert resp.status_code == 400


class TestSessionStop:

    async def test_stop_session(self, client):
        create = await client.post("/api/sessions", json={"title": "Stop Me"})
        sid = create.json()["id"]
        resp = await client.post(f"/api/sessions/{sid}/stop")
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    async def test_stop_nonexistent_404(self, client):
        resp = await client.post(f"/api/sessions/{uuid.uuid4()}/stop")
        assert resp.status_code == 404


class TestSubgroupsEndpoint:

    async def test_get_subgroups(self, client):
        create = await client.post("/api/sessions", json={"title": "SG Test"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        await client.post("/api/users", json={"join_code": code, "display_name": "A"})
        await client.post("/api/users", json={"join_code": code, "display_name": "B"})
        await client.post(f"/api/sessions/{sid}/start")

        resp = await client.get(f"/api/sessions/{sid}/subgroups")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestIdeasEndpoint:

    async def test_get_ideas_empty(self, client):
        create = await client.post("/api/sessions", json={"title": "Ideas"})
        sid = create.json()["id"]
        resp = await client.get(f"/api/sessions/{sid}/ideas")
        assert resp.status_code == 200
        assert resp.json() == []
