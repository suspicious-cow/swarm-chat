import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message, MessageType
from app.models.user import User
from app.websocket.manager import manager
from app.services.redis import publish_to_subgroup

logger = logging.getLogger(__name__)


async def handle_chat_message(
    db: AsyncSession,
    user_id: uuid.UUID,
    subgroup_id: uuid.UUID,
    data: dict,
):
    """Handle an incoming chat message from a user."""
    content = data.get("content", "").strip()
    if not content:
        return

    # Get user display name
    user = await db.get(User, user_id)
    if not user:
        return

    # Save message to DB
    message = Message(
        subgroup_id=subgroup_id,
        user_id=user_id,
        content=content,
        msg_type=MessageType.human,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Broadcast to subgroup
    msg_data = {
        "id": str(message.id),
        "subgroup_id": str(subgroup_id),
        "user_id": str(user_id),
        "display_name": user.display_name,
        "content": content,
        "msg_type": "human",
        "source_subgroup_id": None,
        "created_at": message.created_at.isoformat() if message.created_at else datetime.now(timezone.utc).isoformat(),
    }

    await manager.broadcast_to_subgroup(subgroup_id, "chat:new_message", msg_data)
