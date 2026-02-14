"""Integration tests: Admin status and summary endpoints."""

import uuid

import pytest


class TestSessionStatus:

    async def test_get_status(self, client):
        create = await client.post("/api/sessions", json={"title": "Status Test"})
        sid = create.json()["id"]

        resp = await client.get(f"/api/admin/{sid}/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Status Test"
        assert data["status"] == "waiting"
        assert data["subgroups"] == []

    async def test_status_with_subgroups(self, client):
        create = await client.post("/api/sessions", json={"title": "With SG"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        await client.post("/api/users", json={"join_code": code, "display_name": "A"})
        await client.post("/api/users", json={"join_code": code, "display_name": "B"})
        await client.post(f"/api/sessions/{sid}/start")

        resp = await client.get(f"/api/admin/{sid}/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "active"
        assert len(data["subgroups"]) >= 1

    async def test_status_404(self, client):
        resp = await client.get(f"/api/admin/{uuid.uuid4()}/status")
        assert resp.status_code == 404


class TestGenerateSummary:

    async def test_summary_no_ideas(self, client):
        create = await client.post("/api/sessions", json={"title": "No Ideas"})
        sid = create.json()["id"]

        resp = await client.post(f"/api/admin/{sid}/summary")
        assert resp.status_code == 200
        assert "No ideas" in resp.json()["summary"]

    async def test_summary_with_ideas_calls_llm(self, client, mock_llm):
        """When ideas exist, LLM is called and summary returned."""
        # Create session with users and start it
        create = await client.post("/api/sessions", json={"title": "Has Ideas"})
        code = create.json()["join_code"]
        sid = create.json()["id"]
        await client.post("/api/users", json={"join_code": code, "display_name": "A"})
        await client.post("/api/users", json={"join_code": code, "display_name": "B"})
        start_resp = await client.post(f"/api/sessions/{sid}/start")
        subgroups = start_resp.json()
        sg_id = subgroups[0]["id"]

        # Manually insert an idea via the DB
        from tests.conftest import TestSessionLocal
        from app.models.idea import Idea
        import uuid as _uuid
        async with TestSessionLocal() as db:
            idea = Idea(
                session_id=_uuid.UUID(sid),
                subgroup_id=_uuid.UUID(sg_id),
                summary="Test idea for summary",
                sentiment=0.5,
            )
            db.add(idea)
            await db.commit()

        mock_llm["generate_text"].return_value = "The group agreed on several points..."
        resp = await client.post(f"/api/admin/{sid}/summary")
        assert resp.status_code == 200
        assert resp.json()["summary"] == "The group agreed on several points..."

    async def test_summary_404(self, client):
        resp = await client.post(f"/api/admin/{uuid.uuid4()}/summary")
        assert resp.status_code == 404
