# Swarm Chat — Facilitator Guide

A complete guide to setting up, running, and managing deliberation sessions with Swarm Chat.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Running a Deliberation Session](#running-a-deliberation-session)
  - [Creating a Session](#creating-a-session)
  - [Sharing the Join Code](#sharing-the-join-code)
  - [Starting the Deliberation](#starting-the-deliberation)
  - [Monitoring the Discussion](#monitoring-the-discussion)
  - [Ending the Deliberation](#ending-the-deliberation)
  - [Generating a Summary](#generating-a-summary)
- [How the AI Works](#how-the-ai-works)
  - [The Conversational Matching Engine](#the-conversational-matching-engine)
  - [Idea Extraction](#idea-extraction)
  - [Surrogate Agents](#surrogate-agents)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Development Setup](#development-setup)
  - [Choosing an LLM Provider](#choosing-an-llm-provider)
  - [Tuning Engine Parameters](#tuning-engine-parameters)
  - [Production Deployment](#production-deployment)
  - [Running Tests](#running-tests)
- [API Reference](#api-reference)
  - [REST Endpoints](#rest-endpoints)
  - [WebSocket Connections](#websocket-connections)
- [Troubleshooting](#troubleshooting)

---

## Overview

Swarm Chat enables productive group deliberation at scale. Instead of putting 50 people into one chaotic chat room, the platform splits them into small groups of ~5 ("ThinkTanks") and uses AI to relay the best ideas between groups. This approach is based on research into **Conversational Swarm Intelligence** — the finding that interconnected small groups reach better consensus than one large group.

```
  ThinkTank 1          ThinkTank 2          ThinkTank 3
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Alice    │         │ Dave     │         │ Grace    │
  │ Bob      │◄───────►│ Eve      │◄───────►│ Hank     │
  │ Carol    │ surrogate│ Frank    │ surrogate│ Ivy      │
  └──────────┘  agents  └──────────┘  agents  └──────────┘
        ▲                                          │
        └──────────────────────────────────────────┘
                    CME cross-pollinates ideas
```

**Key concepts:**

- **Session** — A single deliberation event with a topic/question
- **ThinkTank** — A small subgroup of ~5 participants who chat together
- **Surrogate Agent** — An AI that reads ideas from other ThinkTanks and naturally introduces them into a group's conversation
- **CME (Conversational Matching Engine)** — The background process that extracts ideas and dispatches Surrogate Agents
- **Join Code** — A 6-character code participants use to enter a session

---

## Quick Start

Once the platform is running (see [Setup and Installation](#setup-and-installation)), open your browser to `http://localhost:3000`. You'll see the lobby with two cards: **Create a Session** and **Join a Session**.

---

## Running a Deliberation Session

### Creating a Session

1. On the lobby page, find the **Create a Session** card on the left
2. Enter a deliberation topic or question in the **"Deliberation topic / question"** field
   - Good topics are open-ended questions: *"Should our city adopt congestion pricing?"*, *"How should we allocate the Q3 budget?"*
3. Enter your display name in the **"Your display name"** field
4. Optionally adjust the **"Subgroup size"** (default: 5, range: 3-10)
   - Smaller groups (3-4) create more intimate discussion
   - Larger groups (7-10) generate more diverse ideas per group but can be harder to follow
5. Click **Create Session**

After creation, you'll see a confirmation with the **join code** — a 6-character alphanumeric code like `A3X9K2`.

### Sharing the Join Code

The join code is displayed prominently after creation. Share it with your participants through whatever channel works best:

- Project it on a screen in a meeting room
- Send it in a Slack/Teams message
- Include it in a calendar invite
- Write it on a whiteboard

Participants enter this code on the same lobby page to join.

### Starting the Deliberation

After creating the session, you need to **join it yourself** to access admin controls:

1. Enter the join code and your name in the **Join a Session** card
2. Click **Join Session**
3. You'll enter the **Waiting Room** where you can see:
   - The session topic displayed at the top
   - The join code in large letters (easy to share/project)
   - A pulsing "Waiting for participants to join..." indicator
   - An **Admin Controls** panel at the bottom

When enough participants have joined, click **Start Deliberation** in the Admin Controls panel. This will:

- Automatically divide all participants into ThinkTanks
- Transition everyone from the waiting room to their group's chat room
- Start the CME background engine

> **Tip:** The first person to join a session is automatically the admin. If you create the session via the "Create" form, you still need to join via the "Join" form to become admin and access controls.

### Monitoring the Discussion

Once the deliberation is active, you can:

- **Chat** in your assigned ThinkTank like any other participant
- **Switch to the Visualizer** by clicking the **Visualizer** button in the header bar
- The Visualizer shows:
  - A **Deliberation Map** with circles representing each ThinkTank
  - The number of members in each group
  - Animated connection lines showing idea flow between groups
  - A **Live Ideas** sidebar listing all ideas extracted by the AI so far, with sentiment indicators

### Ending the Deliberation

When you're ready to wrap up:

1. Click **End Deliberation** in the Admin Controls (visible in both Chat and Visualizer views)
2. The session status changes to "completed"
3. All participants are notified in real time

### Generating a Summary

After ending the deliberation (or even while it's still active):

1. Click **Generate Summary** in the Admin Controls
2. The AI analyzes all extracted ideas across every ThinkTank
3. A comprehensive summary is generated covering the main themes, points of agreement, and areas of disagreement

---

## How the AI Works

### The Conversational Matching Engine

The CME is the brain of Swarm Chat. It runs automatically in the background on a configurable timer (default: every 20 seconds) and performs two phases for each subgroup:

**Phase 1 — Idea Extraction (Taxonomy)**
- Reads the last 20 messages from the subgroup
- Asks the LLM to extract distinct ideas/arguments
- For each idea, records a summary and sentiment score (-1.0 to 1.0)
- Stores ideas in the database, automatically deduplicating by summary text

**Phase 2 — Cross-Pollination (Surrogate Delivery)**
- Finds the 10 most recent ideas from *other* subgroups that haven't been discussed in this one
- Selects up to 3 of the most relevant
- Crafts a natural-sounding surrogate message using the LLM, providing the subgroup's recent conversation as context
- Broadcasts the message to the subgroup in real time via WebSocket

### Idea Extraction

The LLM is prompted to analyze messages and return structured JSON:

```json
[
  {"summary": "Congestion pricing could reduce downtown traffic by 30%", "sentiment": 0.7},
  {"summary": "Low-income residents may be disproportionately affected", "sentiment": -0.4}
]
```

Ideas are deduplicated at the session level — if ThinkTank 1 and ThinkTank 3 both discuss the same idea, it's stored once. This prevents redundant surrogate messages.

### Surrogate Agents

When the CME identifies ideas that a subgroup hasn't heard yet, it generates a surrogate message. The LLM is given:

1. The **session topic** for context
2. The **last 10 messages** in the target subgroup (so it knows the conversation tone)
3. The **new insights** to introduce (1-3 ideas from other groups)

It's instructed to write 2-4 sentences as a "friendly peer" — never lecture, never dominate, just naturally weave in the new perspective. Example outputs:

> *"Some folks elsewhere raised an interesting point about how transit alternatives would need to be in place before any car restrictions..."*

> *"I've been hearing that there's quite a bit of support for a phased approach, starting with weekends only."*

---

## Setup and Installation

### Prerequisites

- **Docker** and **Docker Compose** (v2+)
- An API key for at least one LLM provider

### Development Setup

```bash
# Clone the repository
git clone https://github.com/suspicious-cow/swarm-chat.git
cd swarm-chat

# Create environment file
cp .env.example .env
```

Edit `.env` with your preferred text editor:

```env
# Required: Add your LLM API key
LLM_API_KEY=your-api-key-here

# Optional: Change the provider (default is Gemini)
LLM_PROVIDER=gemini
LLM_MODEL=gemini-3-flash-preview
```

Start all services:

```bash
docker compose up --build
```

This starts four containers:
1. **postgres** — PostgreSQL 16 database (port 5432)
2. **redis** — Redis 7 for real-time pub/sub (port 6379)
3. **backend** — FastAPI server with hot-reload (port 58432)
4. **frontend** — Vite dev server with HMR (port 3000)

The backend automatically creates database tables on first startup and begins the CME loop once a session is started.

### Choosing an LLM Provider

Edit your `.env` file with one of these configurations:

**Google Gemini** (default, fast and affordable):
```env
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-3-flash-preview
```

**OpenAI**:
```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-openai-key
LLM_MODEL=gpt-5.2
```

**Anthropic (Claude)**:
```env
LLM_PROVIDER=anthropic
LLM_API_KEY=sk-ant-your-key
LLM_MODEL=claude-haiku-4-5-20251001
```

**Mistral**:
```env
LLM_PROVIDER=mistral
LLM_API_KEY=your-mistral-key
LLM_MODEL=mistral-medium-3-1-25-08
```

**DeepSeek** (OpenAI-compatible):
```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=sk-your-deepseek-key
LLM_MODEL=deepseek-chat
```

**Ollama** (free, runs locally):
```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=http://host.docker.internal:11434/v1
LLM_API_KEY=unused
LLM_MODEL=llama3
```

> For Ollama, install it on your host machine and pull a model first: `ollama pull llama3`. Use `host.docker.internal` so the Docker container can reach your host's Ollama server.

After changing LLM settings, restart the backend:

```bash
docker compose restart backend
```

### Tuning Engine Parameters

These settings control how the CME operates. Adjust them in `.env`:

| Variable | Default | What it does |
|----------|---------|--------------|
| `SUBGROUP_SIZE` | `5` | Number of people per ThinkTank. Smaller = more intimate; larger = more diverse ideas per group. |
| `CME_INTERVAL_SECONDS` | `20` | How often the engine scans for new ideas and dispatches surrogates. Lower = more responsive but more LLM calls. |
| `SURROGATE_INTERVAL_SECONDS` | `30` | Minimum time between surrogate messages in a single group. Prevents AI from dominating the conversation. |

**Recommendations by group size:**

| Total Participants | Subgroup Size | CME Interval | Surrogate Interval |
|--------------------|---------------|--------------|---------------------|
| 5-15 | 5 | 30s | 45s |
| 15-50 | 5 | 20s | 30s |
| 50-100 | 5-7 | 15s | 25s |
| 100+ | 5-7 | 10s | 20s |

### Production Deployment

For production, use the combined compose files:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

This changes:
- **Backend**: Runs with Gunicorn (4 Uvicorn workers) instead of dev server
- **Frontend**: Builds a static bundle served by Nginx on port 80
- **Nginx**: Proxies `/api/` and `/ws/` (WebSocket) to the backend
- No volume mounts (code is baked into images)

**Production checklist:**
- [ ] Set a strong, unique `SECRET_KEY` in `.env`
- [ ] Set a strong `POSTGRES_PASSWORD`
- [ ] Set your production `LLM_API_KEY`
- [ ] Update `BACKEND_CORS_ORIGINS` to your actual domain
- [ ] Consider running behind a reverse proxy (Caddy, Traefik) with TLS

### Running Tests

All tests run inside Docker containers:

```bash
# Backend tests (82 tests — unit + integration)
docker compose exec backend python -m pytest tests/ -v

# Frontend tests (43 tests — store + components)
docker compose exec frontend npm test

# E2E tests (10 tests — full UI journey with screenshots)
docker compose --profile e2e run --rm e2e
# Screenshots saved to ./screenshots/
```

---

## API Reference

The backend exposes a REST API and WebSocket endpoints. Full interactive documentation is available at `http://localhost:58432/docs` when the server is running.

### REST Endpoints

**Create a session:**
```bash
curl -X POST http://localhost:58432/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Should cities ban cars from downtown?", "subgroup_size": 5}'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Should cities ban cars from downtown?",
  "status": "waiting",
  "join_code": "A3X9K2",
  "subgroup_size": 5,
  "created_at": "2026-02-14T10:30:00Z"
}
```

**Join a session:**
```bash
curl -X POST http://localhost:58432/api/users \
  -H "Content-Type: application/json" \
  -d '{"join_code": "A3X9K2", "display_name": "Alice"}'
```

**Start the deliberation:**
```bash
curl -X POST http://localhost:58432/api/sessions/{session_id}/start
```

**Stop the deliberation:**
```bash
curl -X POST http://localhost:58432/api/sessions/{session_id}/stop
```

**Get session status:**
```bash
curl http://localhost:58432/api/admin/{session_id}/status
```

**Generate a summary:**
```bash
curl -X POST http://localhost:58432/api/admin/{session_id}/summary
```

Response:
```json
{
  "summary": "The deliberation covered three main themes: environmental benefits of car-free zones (strong support), accessibility concerns for disabled residents (significant concern raised across multiple groups), and economic impact on downtown businesses (divided opinions)..."
}
```

**List subgroups:**
```bash
curl http://localhost:58432/api/sessions/{session_id}/subgroups
```

**List extracted ideas:**
```bash
curl http://localhost:58432/api/sessions/{session_id}/ideas
```

### WebSocket Connections

Connect to a subgroup's chat:
```javascript
const ws = new WebSocket('ws://localhost:58432/ws/chat/{user_id}/{subgroup_id}');

// Send a message
ws.send(JSON.stringify({
  event: 'chat:message',
  data: { content: 'I think this is a great idea!' }
}));

// Receive messages
ws.onmessage = (event) => {
  const { event: evt, data } = JSON.parse(event.data);
  if (evt === 'chat:new_message') {
    console.log(`${data.display_name}: ${data.content}`);
    // data.msg_type is 'human', 'surrogate', or 'contributor'
  }
};
```

Listen for session-wide events:
```javascript
const sessionWs = new WebSocket('ws://localhost:58432/ws/session/{user_id}/{session_id}');

sessionWs.onmessage = (event) => {
  const { event: evt, data } = JSON.parse(event.data);
  if (evt === 'session:started') {
    // Deliberation has begun, data includes subgroup assignment
  } else if (evt === 'session:completed') {
    // Deliberation ended
  } else if (evt === 'session:user_joined') {
    // New participant joined
  }
};
```

---

## Troubleshooting

### "Waiting for participants to join..." but people can't connect

- Make sure participants are using the correct join code (case-insensitive)
- Verify they can reach the frontend URL (same network, no firewall blocking port 3000)
- Check backend logs: `docker compose logs backend --tail 50`

### Surrogate messages aren't appearing

- The CME only runs when a session is in "active" status — make sure you clicked **Start Deliberation**
- There must be messages in at least two subgroups for cross-pollination to occur
- Check the CME interval: the default is 20 seconds, so allow time for the first cycle
- Verify your LLM API key is valid: `docker compose logs backend --tail 50` (look for LLM errors)

### "Session not found" when participants try to join

- Join codes expire with the session — make sure the session hasn't been deleted
- Codes are 6 characters, alphanumeric, case-insensitive

### Frontend shows blank page or errors

- Check browser console for errors (F12 → Console)
- Make sure the backend is running: `curl http://localhost:58432/api/health`
- If you see CORS errors, check that `BACKEND_CORS_ORIGINS` in `.env` includes your frontend URL

### Docker containers won't start

- Make sure ports 3000, 5432, 6379, and 58432 aren't in use by other applications
- Run `docker compose down -v` to clean up, then `docker compose up --build` to rebuild
- Check individual container logs: `docker compose logs <service-name>`

### LLM errors in backend logs

- Verify your API key is correct and has sufficient quota/credits
- Make sure the model name is valid for your chosen provider
- For `openai-compatible` providers, ensure `LLM_BASE_URL` is correct and accessible from inside Docker
- For Ollama: use `http://host.docker.internal:11434/v1` (not `localhost`)
