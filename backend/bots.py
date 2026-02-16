"""Simulated bot users for manual testing.

Usage (inside backend container):
    python bots.py <JOIN_CODE> [--bots 8]

Bots join the session, wait for it to start, then chat naturally
in their assigned subgroups so you can test the full deliberation flow solo.

Each bot uses the configured LLM to generate on-topic responses that are
relevant to the session's actual discussion topic.
"""

import argparse
import asyncio
import json
import logging
import random
import sys

import httpx
import websockets

from app.services.llm import generate_text

BASE = "http://localhost:8000"
WS_BASE = "ws://localhost:8000"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("bots")

BOT_NAMES = [
    "Ava", "Marcus", "Priya", "Jordan", "Elena",
    "Kai", "Sofia", "Liam", "Nadia", "Oscar",
    "Zara", "Finn", "Maya", "Ravi", "Chloe",
]

BOT_PERSONAS = [
    "pragmatic and solution-oriented, always looking for actionable next steps",
    "skeptical and analytical, likes to challenge assumptions with evidence",
    "empathetic and people-focused, thinks about how things affect individuals",
    "creative and unconventional, suggests ideas others wouldn't think of",
    "experienced and anecdotal, draws on real-world stories and examples",
    "systematic and structured, wants to break problems into clear steps",
    "enthusiastic and optimistic, builds on others' ideas with energy",
    "cautious and risk-aware, considers what could go wrong",
    "philosophical and big-picture, connects ideas to broader themes",
    "direct and concise, cuts through complexity to the core point",
    "collaborative and bridging, finds connections between different viewpoints",
    "curious and question-driven, asks probing questions to deepen the discussion",
    "data-oriented and precise, wants evidence before reaching conclusions",
    "passionate and values-driven, argues from principles and convictions",
    "humorous and disarming, uses wit to make points memorable",
]

SYSTEM_PROMPT = """You are {name}, a participant in a group discussion.
Your personality: {persona}

Rules:
- Write ONE short message (1-3 sentences max).
- Be conversational and natural — like a real person chatting, not an essay.
- Stay on topic. The discussion is about: "{topic}"
- Don't use bullet points, headers, or markdown. Just plain conversational text.
- Don't start with "I think" every time — vary your openings.
- Have a distinct voice. Be opinionated. Disagree sometimes.
- Reference what others said when given chat history.
- Never mention that you are an AI or bot."""


async def _generate_message(
    name: str, persona: str, topic: str, chat_history: list[str], is_opener: bool,
) -> str:
    """Use the LLM to generate an on-topic chat message."""
    system = SYSTEM_PROMPT.format(name=name, persona=persona, topic=topic)

    if is_opener:
        prompt = f'The discussion topic is: "{topic}"\n\nYou\'re joining the conversation. Share your initial take.'
    else:
        recent = chat_history[-6:] if len(chat_history) > 6 else chat_history
        history_text = "\n".join(recent)
        prompt = (
            f'The discussion topic is: "{topic}"\n\n'
            f"Recent messages:\n{history_text}\n\n"
            f"Respond naturally to the conversation. Build on, challenge, or add to what's been said."
        )

    try:
        response = await generate_text(prompt, system)
        # Clean up: strip quotes the LLM might wrap around the response
        response = response.strip().strip('"').strip("'")
        if len(response) > 500:
            response = response[:497] + "..."
        return response
    except Exception as e:
        logger.warning(f"{name}: LLM generation failed ({e}), using fallback")
        return random.choice([
            f"That's an interesting angle on {topic.split()[-1] if topic else 'this'}.",
            "I hadn't considered that perspective before.",
            "Can someone elaborate on that point?",
            "I agree with the general direction but wonder about the details.",
        ])


async def run_bot(
    name: str, persona: str, join_code: str, topic: str,
    chat_history: list[str], client: httpx.AsyncClient,
):
    """A single bot that joins, waits for session start, then chats."""
    # Join the session
    r = await client.post("/api/users", json={
        "display_name": name,
        "join_code": join_code,
    })
    if r.status_code != 200:
        logger.error(f"{name}: Failed to join — {r.status_code} {r.text}")
        return
    user = r.json()
    user_id = user["id"]
    session_id = user["session_id"]
    logger.info(f"{name} joined session (user_id={user_id[:8]})")

    # Poll until the session becomes active and we have a subgroup
    subgroup_id = user.get("subgroup_id")
    while not subgroup_id:
        await asyncio.sleep(2)
        r = await client.get(f"/api/users/{user_id}")
        if r.status_code == 200:
            subgroup_id = r.json().get("subgroup_id")

    logger.info(f"{name} assigned to subgroup {subgroup_id[:8]}")

    # Connect WebSocket
    uri = f"{WS_BASE}/ws/chat/{user_id}/{subgroup_id}"
    try:
        async with websockets.connect(uri) as ws:
            logger.info(f"{name} connected to chat WebSocket")

            # Small random delay so bots don't all talk at once
            await asyncio.sleep(random.uniform(3, 12))

            # Send opener
            opener = await _generate_message(name, persona, topic, chat_history, is_opener=True)
            await ws.send(json.dumps({
                "event": "chat:message",
                "data": {"content": opener},
            }))
            chat_history.append(f"{name}: {opener}")
            logger.info(f'{name}: "{opener[:70]}..."')

            # Send 2-4 follow-ups over time
            num_followups = random.randint(2, 4)
            for i in range(num_followups):
                delay = random.uniform(15, 45)
                await asyncio.sleep(delay)

                # Check if session is still active
                r = await client.get(f"/api/sessions/{session_id}")
                if r.status_code == 200 and r.json().get("status") != "active":
                    logger.info(f"{name}: Session ended, stopping.")
                    return

                msg = await _generate_message(name, persona, topic, chat_history, is_opener=False)
                await ws.send(json.dumps({
                    "event": "chat:message",
                    "data": {"content": msg},
                }))
                chat_history.append(f"{name}: {msg}")
                logger.info(f'{name}: "{msg[:70]}..."')

            # Stay connected to keep the session alive
            logger.info(f"{name}: Done chatting, staying connected...")
            while True:
                r = await client.get(f"/api/sessions/{session_id}")
                if r.status_code == 200 and r.json().get("status") != "active":
                    logger.info(f"{name}: Session ended, disconnecting.")
                    return
                await asyncio.sleep(10)

    except websockets.ConnectionClosed:
        logger.info(f"{name}: WebSocket closed")
    except Exception as e:
        logger.error(f"{name}: Error — {e}")


async def main():
    parser = argparse.ArgumentParser(description="Run bot users for Swarm Chat testing")
    parser.add_argument("join_code", help="Session join code (e.g., ABC123)")
    parser.add_argument("--bots", type=int, default=8, help="Number of bots (default: 8)")
    args = parser.parse_args()

    num_bots = min(args.bots, len(BOT_NAMES))
    names = random.sample(BOT_NAMES, num_bots)
    personas = random.sample(BOT_PERSONAS, num_bots)

    logger.info(f"Starting {num_bots} bots for session {args.join_code}...")
    logger.info(f"Bots: {', '.join(names)}")
    logger.info("They'll join, wait for you to start, then chat in their subgroups.")
    logger.info("Press Ctrl+C to stop all bots.\n")

    async with httpx.AsyncClient(base_url=BASE, timeout=30) as client:
        # Verify join code works
        r = await client.get(f"/api/sessions/join/{args.join_code}")
        if r.status_code != 200:
            logger.error(f"Invalid join code: {args.join_code}")
            sys.exit(1)
        session = r.json()
        topic = session["title"]
        logger.info(f'Session: "{topic}" (status: {session["status"]})\n')

        # Shared chat history so bots can reference each other's messages
        chat_history: list[str] = []

        try:
            await asyncio.gather(*[
                run_bot(name, persona, args.join_code, topic, chat_history, client)
                for name, persona in zip(names, personas)
            ])
        except KeyboardInterrupt:
            logger.info("\nStopping bots...")


if __name__ == "__main__":
    asyncio.run(main())
