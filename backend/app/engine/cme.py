"""Conversational Matching Engine (CME).

Runs globally across all subgroups on a periodic timer.
Identifies ideas/arguments that haven't been discussed in a subgroup
but were raised elsewhere, prioritizing challenging content.

Uses a Redis distributed lock so that only one worker runs the CME
cycle at a time (safe with multi-worker deployments like Gunicorn).
"""
import asyncio
import logging
import uuid

from sqlalchemy import select

from app.database import async_session
from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.engine.taxonomy import update_taxonomy_for_subgroup, get_ideas_not_in_subgroup
from app.engine.surrogate import deliver_surrogate_message
from app.services.redis import get_redis
from app.config import settings

logger = logging.getLogger(__name__)

_running = False

CME_LOCK_KEY = "cme:leader_lock"
# Lock TTL should be longer than a single cycle could take, but short enough
# that another worker picks up quickly if the leader dies.
CME_LOCK_TTL_SECONDS = max(settings.CME_INTERVAL_SECONDS * 3, 60)


async def acquire_cme_lock(worker_id: str) -> bool:
    """Try to acquire the distributed CME lock. Returns True if acquired."""
    r = await get_redis()
    acquired = await r.set(CME_LOCK_KEY, worker_id, nx=True, ex=CME_LOCK_TTL_SECONDS)
    return acquired is not None


async def renew_cme_lock(worker_id: str) -> bool:
    """Renew the lock if we still own it. Returns True if renewed."""
    r = await get_redis()
    current = await r.get(CME_LOCK_KEY)
    if current == worker_id:
        await r.expire(CME_LOCK_KEY, CME_LOCK_TTL_SECONDS)
        return True
    return False


async def release_cme_lock(worker_id: str):
    """Release the lock if we still own it."""
    r = await get_redis()
    current = await r.get(CME_LOCK_KEY)
    if current == worker_id:
        await r.delete(CME_LOCK_KEY)


async def run_cme_cycle():
    """Run one CME cycle across all active sessions."""
    async with async_session() as db:
        # Get all active sessions
        result = await db.execute(
            select(Session).where(Session.status == SessionStatus.active)
        )
        sessions = result.scalars().all()

    # Each session creates its own DB sessions internally
    for session in sessions:
        await process_session(session)


async def process_session(session: Session):
    """Process one session: extract ideas and trigger surrogates concurrently.

    Each subgroup gets its own DB session to avoid SQLAlchemy concurrency
    issues with asyncio.gather().
    """
    # Fetch subgroups in a short-lived session
    async with async_session() as db:
        result = await db.execute(
            select(Subgroup).where(Subgroup.session_id == session.id)
        )
        subgroups = result.scalars().all()

    if len(subgroups) < 2:
        return  # Need at least 2 subgroups for cross-pollination

    sem = asyncio.Semaphore(settings.CME_CONCURRENCY)

    async def process_subgroup(sg: Subgroup):
        async with sem:
            async with async_session() as sg_db:
                try:
                    await update_taxonomy_for_subgroup(sg_db, session.id, sg.id)
                    await sg_db.commit()
                except Exception as e:
                    logger.error(f"Taxonomy update failed for {sg.label}: {e}")

                try:
                    foreign_ideas = await get_ideas_not_in_subgroup(sg_db, session.id, sg.id)
                    if foreign_ideas:
                        insights = [idea.summary for idea in foreign_ideas[:3]]
                        session_obj = await sg_db.get(Session, session.id)
                        await deliver_surrogate_message(sg_db, session_obj, sg, insights)
                        await sg_db.commit()
                except Exception as e:
                    logger.error(f"Surrogate delivery failed for {sg.label}: {e}")

    await asyncio.gather(*[process_subgroup(sg) for sg in subgroups])


async def start_cme_loop():
    """Start the background CME loop with distributed locking.

    Each worker attempts to acquire a Redis lock before running the cycle.
    Only the lock holder executes; others sleep and retry. If the leader
    dies, the lock expires and another worker takes over.
    """
    global _running
    _running = True
    worker_id = str(uuid.uuid4())
    is_leader = False
    logger.info(f"CME loop started (worker {worker_id[:8]})")

    while _running:
        try:
            if not is_leader:
                is_leader = await acquire_cme_lock(worker_id)
                if is_leader:
                    logger.info(f"CME worker {worker_id[:8]} acquired leader lock")

            if is_leader:
                renewed = await renew_cme_lock(worker_id)
                if not renewed:
                    logger.warning(f"CME worker {worker_id[:8]} lost leader lock")
                    is_leader = False
                    continue

                await run_cme_cycle()
        except Exception as e:
            logger.error(f"CME cycle error: {e}")
        await asyncio.sleep(settings.CME_INTERVAL_SECONDS)

    # Release lock on shutdown
    if is_leader:
        await release_cme_lock(worker_id)
        logger.info(f"CME worker {worker_id[:8]} released leader lock")


def stop_cme_loop():
    global _running
    _running = False
    logger.info("CME loop stopped")
