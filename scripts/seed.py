"""Seed script to simulate users joining a session.

Usage:
  docker compose exec backend python -m scripts.seed --session-code ABC123 --users 20

Or run directly:
  python scripts/seed.py --api-url http://localhost:8000 --session-code ABC123 --users 20
"""
import argparse
import asyncio
import random

import httpx

NAMES = [
    "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry",
    "Iris", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul",
    "Quinn", "Rosa", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xander",
    "Yara", "Zach", "Amara", "Blake", "Cleo", "Dante", "Elena", "Felix",
    "Gina", "Hugo", "Isla", "Jules", "Kira", "Liam", "Maya", "Nico",
]

SAMPLE_MESSAGES = [
    "I think we need to consider the economic impact first.",
    "Has anyone thought about the environmental side of this?",
    "I disagree - the social benefits outweigh the costs.",
    "What about accessibility for people with disabilities?",
    "Let's look at some data before making assumptions.",
    "Other cities have tried this and it worked well.",
    "I'm worried about unintended consequences.",
    "Can we find a middle ground here?",
    "The technology already exists to make this work.",
    "We should prioritize equity in any solution.",
    "I'd like to hear more perspectives on this.",
    "That's a great point, but what about long-term effects?",
    "We're overthinking this - let's start small and iterate.",
    "History shows us that similar approaches have failed.",
    "I think there's a creative solution we're missing.",
]


async def main():
    parser = argparse.ArgumentParser(description="Seed a Swarm Chat session")
    parser.add_argument("--api-url", default="http://localhost:8000")
    parser.add_argument("--session-code", required=True, help="Join code for the session")
    parser.add_argument("--users", type=int, default=15, help="Number of simulated users")
    parser.add_argument("--messages", type=int, default=3, help="Messages per user")
    args = parser.parse_args()

    async with httpx.AsyncClient(base_url=args.api_url) as client:
        # Join users
        users = []
        names = random.sample(NAMES, min(args.users, len(NAMES)))
        if args.users > len(NAMES):
            names += [f"User_{i}" for i in range(len(NAMES), args.users)]

        print(f"Joining {args.users} users to session {args.session_code}...")
        for name in names[:args.users]:
            res = await client.post("/api/users", json={
                "display_name": name,
                "join_code": args.session_code,
            })
            if res.status_code == 200:
                user = res.json()
                users.append(user)
                print(f"  Joined: {name} ({user['id'][:8]}...)")
            else:
                print(f"  Failed to join as {name}: {res.text}")

        print(f"\n{len(users)} users joined successfully.")
        print("Use the admin panel to start the session, then run this script again with --simulate to send messages.")


if __name__ == "__main__":
    asyncio.run(main())
