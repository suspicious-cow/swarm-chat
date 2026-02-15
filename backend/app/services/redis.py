import json
import uuid
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def close_redis():
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)


async def publish_to_subgroup(subgroup_id: uuid.UUID, event: str, data: dict[str, Any]):
    r = await get_redis()
    payload = json.dumps({"event": event, "data": data}, cls=UUIDEncoder)
    await r.publish(f"subgroup:{subgroup_id}", payload)


async def publish_to_session(session_id: uuid.UUID, event: str, data: dict[str, Any]):
    r = await get_redis()
    payload = json.dumps({"event": event, "data": data}, cls=UUIDEncoder)
    await r.publish(f"session:{session_id}", payload)


async def enqueue_cme_task(session_id: uuid.UUID, subgroup_id: uuid.UUID):
    r = await get_redis()
    await r.lpush(
        "cme:queue",
        json.dumps({"session_id": str(session_id), "subgroup_id": str(subgroup_id)}),
    )


async def start_redis_subscriber(on_subgroup_msg, on_session_msg):
    """Subscribe to subgroup:* and session:* channels, call handlers on messages.

    Runs as a long-lived background task. Each Gunicorn worker starts one
    subscriber so that Redis-published messages are delivered to the local
    WebSocket connections managed by that worker.
    """
    import logging

    logger = logging.getLogger(__name__)
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.psubscribe("subgroup:*", "session:*")
    logger.info("Redis subscriber started (subgroup:*, session:*)")
    try:
        async for raw_msg in pubsub.listen():
            if raw_msg["type"] != "pmessage":
                continue
            channel = raw_msg["channel"]
            payload = json.loads(raw_msg["data"])
            try:
                if channel.startswith("subgroup:"):
                    sg_id = uuid.UUID(channel.split(":", 1)[1])
                    await on_subgroup_msg(sg_id, payload["event"], payload["data"])
                elif channel.startswith("session:"):
                    sess_id = uuid.UUID(channel.split(":", 1)[1])
                    await on_session_msg(sess_id, payload["event"], payload["data"])
            except Exception as e:
                logger.error(f"Redis subscriber handler error: {e}")
    finally:
        await pubsub.punsubscribe("subgroup:*", "session:*")
        await r.close()
