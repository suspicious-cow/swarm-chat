import json
import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.websocket.manager import manager
from app.websocket.handlers import handle_chat_message

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/chat/{user_id}/{subgroup_id}")
async def websocket_chat(
    websocket: WebSocket,
    user_id: str,
    subgroup_id: str,
):
    uid = uuid.UUID(user_id)
    sgid = uuid.UUID(subgroup_id)

    await manager.connect_to_subgroup(websocket, uid, sgid)
    logger.info(f"User {uid} connected to subgroup {sgid}")

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            event = data.get("event", "")

            if event == "chat:message":
                async with async_session() as db:
                    await handle_chat_message(db, uid, sgid, data.get("data", {}))
    except WebSocketDisconnect:
        manager.disconnect(uid, subgroup_id=sgid)
        logger.info(f"User {uid} disconnected from subgroup {sgid}")
    except Exception as e:
        logger.error(f"WebSocket error for user {uid}: {e}")
        manager.disconnect(uid, subgroup_id=sgid)


@router.websocket("/ws/session/{user_id}/{session_id}")
async def websocket_session(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
):
    """WebSocket for session-level events (visualizer, admin)."""
    uid = uuid.UUID(user_id)
    sid = uuid.UUID(session_id)

    await manager.connect_to_session(websocket, uid, sid)
    logger.info(f"User {uid} connected to session {sid}")

    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(uid, session_id=sid)
        logger.info(f"User {uid} disconnected from session {sid}")
    except Exception as e:
        logger.error(f"Session WS error for user {uid}: {e}")
        manager.disconnect(uid, session_id=sid)
