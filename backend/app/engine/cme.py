"""Conversational Matching Engine (CME).

Runs globally across all subgroups on a periodic timer.
Identifies ideas/arguments that haven't been discussed in a subgroup
but were raised elsewhere, prioritizing challenging content.
"""
import asyncio
import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.session import Session, SessionStatus
from app.models.subgroup import Subgroup
from app.models.idea import Idea
from app.engine.taxonomy import update_taxonomy_for_subgroup, get_ideas_not_in_subgroup
from app.engine.surrogate import deliver_surrogate_message
from app.config import settings

logger = logging.getLogger(__name__)

_running = False


async def run_cme_cycle():
    """Run one CME cycle across all active sessions."""
    async with async_session() as db:
        # Get all active sessions
        result = await db.execute(
            select(Session).where(Session.status == SessionStatus.active)
        )
        sessions = result.scalars().all()

        for session in sessions:
            await process_session(db, session)
            await db.commit()


async def process_session(db: AsyncSession, session: Session):
    """Process one session: extract ideas and trigger surrogates."""
    # Get all subgroups
    result = await db.execute(
        select(Subgroup).where(Subgroup.session_id == session.id)
    )
    subgroups = result.scalars().all()

    if len(subgroups) < 2:
        return  # Need at least 2 subgroups for cross-pollination

    # Phase 1: Update taxonomy for each subgroup
    for sg in subgroups:
        try:
            await update_taxonomy_for_subgroup(db, session.id, sg.id)
        except Exception as e:
            logger.error(f"Taxonomy update failed for {sg.label}: {e}")

    # Phase 2: For each subgroup, find ideas from other subgroups
    for sg in subgroups:
        try:
            foreign_ideas = await get_ideas_not_in_subgroup(db, session.id, sg.id)
            if foreign_ideas:
                # Pick up to 3 most relevant ideas to relay
                insights = [idea.summary for idea in foreign_ideas[:3]]
                await deliver_surrogate_message(db, session, sg, insights)
        except Exception as e:
            logger.error(f"Surrogate delivery failed for {sg.label}: {e}")


async def start_cme_loop():
    """Start the background CME loop."""
    global _running
    _running = True
    logger.info("CME loop started")

    while _running:
        try:
            await run_cme_cycle()
        except Exception as e:
            logger.error(f"CME cycle error: {e}")
        await asyncio.sleep(settings.CME_INTERVAL_SECONDS)


def stop_cme_loop():
    global _running
    _running = False
    logger.info("CME loop stopped")
