"""Integration test: GET /api/health."""

import pytest


class TestHealthEndpoint:

    async def test_health_returns_ok(self, client):
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}
