import asyncio
import json
import logging
import uuid
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections grouped by subgroup and session."""

    def __init__(self):
        # subgroup_id -> set of (user_id, websocket)
        self.subgroup_connections: dict[uuid.UUID, set[tuple[uuid.UUID, WebSocket]]] = defaultdict(set)
        # session_id -> set of (user_id, websocket) for visualizer/admin
        self.session_connections: dict[uuid.UUID, set[tuple[uuid.UUID, WebSocket]]] = defaultdict(set)
        # user_id -> websocket for direct messaging
        self.user_connections: dict[uuid.UUID, WebSocket] = {}

    async def connect_to_subgroup(
        self, websocket: WebSocket, user_id: uuid.UUID, subgroup_id: uuid.UUID
    ):
        await websocket.accept()
        self.subgroup_connections[subgroup_id].add((user_id, websocket))
        self.user_connections[user_id] = websocket

    async def connect_to_session(
        self, websocket: WebSocket, user_id: uuid.UUID, session_id: uuid.UUID
    ):
        await websocket.accept()
        self.session_connections[session_id].add((user_id, websocket))
        self.user_connections[user_id] = websocket

    def disconnect(self, user_id: uuid.UUID, subgroup_id: uuid.UUID | None = None, session_id: uuid.UUID | None = None):
        self.user_connections.pop(user_id, None)
        if subgroup_id:
            self.subgroup_connections[subgroup_id] = {
                (uid, ws) for uid, ws in self.subgroup_connections[subgroup_id]
                if uid != user_id
            }
        if session_id:
            self.session_connections[session_id] = {
                (uid, ws) for uid, ws in self.session_connections[session_id]
                if uid != user_id
            }

    async def broadcast_to_subgroup(self, subgroup_id: uuid.UUID, event: str, data: dict):
        message = json.dumps({"event": event, "data": data}, default=str)
        dead = []
        for user_id, ws in self.subgroup_connections.get(subgroup_id, set()):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append((user_id, ws))
        for item in dead:
            self.subgroup_connections[subgroup_id].discard(item)

    async def broadcast_to_session(self, session_id: uuid.UUID, event: str, data: dict):
        message = json.dumps({"event": event, "data": data}, default=str)
        dead = []
        for user_id, ws in self.session_connections.get(session_id, set()):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append((user_id, ws))
        for item in dead:
            self.session_connections[session_id].discard(item)

    async def send_to_user(self, user_id: uuid.UUID, event: str, data: dict):
        ws = self.user_connections.get(user_id)
        if ws:
            try:
                message = json.dumps({"event": event, "data": data}, default=str)
                await ws.send_text(message)
            except Exception:
                self.user_connections.pop(user_id, None)

    def get_subgroup_user_count(self, subgroup_id: uuid.UUID) -> int:
        return len(self.subgroup_connections.get(subgroup_id, set()))


manager = ConnectionManager()
