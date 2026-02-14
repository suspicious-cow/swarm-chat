"""Tests for app.websocket.manager — ConnectionManager unit tests."""

import uuid
import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.websocket.manager import ConnectionManager


@pytest.fixture
def mgr():
    return ConnectionManager()


def _mock_ws():
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_text = AsyncMock()
    return ws


class TestConnectToSubgroup:

    async def test_stores_connection(self, mgr):
        ws = _mock_ws()
        user_id = uuid.uuid4()
        sg_id = uuid.uuid4()
        await mgr.connect_to_subgroup(ws, user_id, sg_id)
        assert (user_id, ws) in mgr.subgroup_connections[sg_id]
        assert mgr.user_connections[user_id] is ws

    async def test_accepts_websocket(self, mgr):
        ws = _mock_ws()
        await mgr.connect_to_subgroup(ws, uuid.uuid4(), uuid.uuid4())
        ws.accept.assert_awaited_once()


class TestDisconnect:

    async def test_removes_from_subgroup(self, mgr):
        ws = _mock_ws()
        user_id = uuid.uuid4()
        sg_id = uuid.uuid4()
        await mgr.connect_to_subgroup(ws, user_id, sg_id)
        mgr.disconnect(user_id, subgroup_id=sg_id)
        assert (user_id, ws) not in mgr.subgroup_connections[sg_id]
        assert user_id not in mgr.user_connections

    async def test_removes_from_session(self, mgr):
        ws = _mock_ws()
        user_id = uuid.uuid4()
        sess_id = uuid.uuid4()
        await mgr.connect_to_session(ws, user_id, sess_id)
        mgr.disconnect(user_id, session_id=sess_id)
        assert (user_id, ws) not in mgr.session_connections[sess_id]


class TestBroadcastToSubgroup:

    async def test_sends_to_all_connections(self, mgr):
        sg_id = uuid.uuid4()
        ws1 = _mock_ws()
        ws2 = _mock_ws()
        await mgr.connect_to_subgroup(ws1, uuid.uuid4(), sg_id)
        await mgr.connect_to_subgroup(ws2, uuid.uuid4(), sg_id)

        await mgr.broadcast_to_subgroup(sg_id, "test:event", {"key": "val"})
        ws1.send_text.assert_awaited_once()
        ws2.send_text.assert_awaited_once()

        sent = json.loads(ws1.send_text.call_args[0][0])
        assert sent["event"] == "test:event"
        assert sent["data"]["key"] == "val"

    async def test_cleans_dead_connections(self, mgr):
        sg_id = uuid.uuid4()
        good_ws = _mock_ws()
        dead_ws = _mock_ws()
        dead_ws.send_text.side_effect = RuntimeError("disconnected")
        dead_uid = uuid.uuid4()

        await mgr.connect_to_subgroup(good_ws, uuid.uuid4(), sg_id)
        await mgr.connect_to_subgroup(dead_ws, dead_uid, sg_id)

        await mgr.broadcast_to_subgroup(sg_id, "test", {})
        # Dead connection should be removed
        assert (dead_uid, dead_ws) not in mgr.subgroup_connections[sg_id]

    async def test_no_connections_is_noop(self, mgr):
        await mgr.broadcast_to_subgroup(uuid.uuid4(), "test", {})


class TestGetSubgroupUserCount:

    async def test_correct_count(self, mgr):
        sg_id = uuid.uuid4()
        assert mgr.get_subgroup_user_count(sg_id) == 0
        await mgr.connect_to_subgroup(_mock_ws(), uuid.uuid4(), sg_id)
        await mgr.connect_to_subgroup(_mock_ws(), uuid.uuid4(), sg_id)
        assert mgr.get_subgroup_user_count(sg_id) == 2

    def test_unknown_subgroup_returns_zero(self, mgr):
        assert mgr.get_subgroup_user_count(uuid.uuid4()) == 0
