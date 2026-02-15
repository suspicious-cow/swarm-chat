# Swarm Chat

Real-time deliberation platform powered by **Conversational Swarm Intelligence** (CSI). Large groups deliberate better when broken into small, interconnected subgroups rather than one giant conversation. Swarm Chat splits participants into "ThinkTanks" of ~5 people and uses LLM-powered **Surrogate Agents** to cross-pollinate ideas between them in real time.

![Lobby](screenshots/01-lobby-initial.png)

## How It Works

1. A **facilitator** creates a session with a deliberation topic
2. **Participants** join using a 6-character code and get auto-assigned to subgroups
3. People **chat in real time** within their small group via WebSocket
4. The **Conversational Matching Engine (CME)** runs on a background timer:
   - Extracts ideas from each subgroup's messages using an LLM
   - Identifies ideas that haven't been discussed across groups
   - Dispatches **Surrogate Agents** that naturally introduce cross-group insights
5. Ideas flow across all subgroups without anyone leaving their small-group conversation

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

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), PostgreSQL, Redis pub/sub |
| Frontend | React 19, TypeScript, Zustand, Vite |
| LLM | Provider-agnostic — Gemini, OpenAI, Anthropic, Mistral, or any OpenAI-compatible API |
| Infrastructure | Docker Compose (dev + prod), Nginx (prod) |
| Testing | pytest (backend), Vitest (frontend), Playwright (E2E) |

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- An API key for at least one LLM provider (Gemini, OpenAI, Anthropic, Mistral, DeepSeek, or a local model via Ollama)

### Setup

```bash
git clone https://github.com/suspicious-cow/swarm-chat.git
cd swarm-chat
cp .env.example .env
```

Edit `.env` and add your `LLM_API_KEY` at minimum. Then:

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:58432 |
| API Docs (Swagger) | http://localhost:58432/docs |

## Screenshots

| Lobby | Waiting Room | Chat | Visualizer |
|-------|-------------|------|------------|
| ![Lobby](screenshots/01-lobby-initial.png) | ![Waiting](screenshots/04-waiting-admin.png) | ![Chat](screenshots/07-chat-messages.png) | ![Visualizer](screenshots/08-visualizer-view.png) |

## LLM Configuration

Swap providers by changing environment variables — no code changes required.

| Provider | `LLM_PROVIDER` | `LLM_BASE_URL` | Example `LLM_MODEL` |
|----------|----------------|-----------------|----------------------|
| Gemini | `gemini` | *(not needed)* | `gemini-3-flash-preview` |
| OpenAI | `openai` | *(not needed)* | `gpt-5.2` |
| Anthropic | `anthropic` | *(not needed)* | `claude-haiku-4-5-20251001` |
| Mistral | `mistral` | *(not needed)* | `mistral-medium-3-1-25-08` |
| DeepSeek | `openai-compatible` | `https://api.deepseek.com` | `deepseek-chat` |
| Ollama (local) | `openai-compatible` | `http://host.docker.internal:11434/v1` | `llama3` |

**Example** — switch from Gemini to DeepSeek:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=sk-your-deepseek-key
LLM_MODEL=deepseek-chat
```

Then restart the backend: `docker compose restart backend`

## Environment Variables

All configuration is done via `.env` (see `.env.example`).

### Database & Infrastructure

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://swarmchat:...@postgres:5432/swarmchat` | PostgreSQL connection string |
| `POSTGRES_USER` | `swarmchat` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `swarmchat_dev_password` | PostgreSQL password |
| `POSTGRES_DB` | `swarmchat` | PostgreSQL database name |
| `REDIS_URL` | `redis://redis:6379/0` | Redis connection string |

### LLM

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `gemini` | Provider: `gemini`, `openai`, `anthropic`, `mistral`, `openai-compatible` |
| `LLM_API_KEY` | *(empty)* | API key for your chosen provider |
| `LLM_MODEL` | `gemini-3-flash-preview` | Model identifier |
| `LLM_BASE_URL` | *(empty)* | Base URL (only needed for `openai-compatible`) |

### Engine Tuning

| Variable | Default | Description |
|----------|---------|-------------|
| `SUBGROUP_SIZE` | `5` | Target number of members per ThinkTank |
| `CME_INTERVAL_SECONDS` | `20` | How often (seconds) the CME scans for new ideas |
| `SURROGATE_INTERVAL_SECONDS` | `30` | Minimum interval between surrogate messages per subgroup |

### Application

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key-change-in-production` | Application secret key |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000,http://localhost:80` | Allowed CORS origins |

## Architecture

### Core Engine: The CME Loop

The Conversational Matching Engine runs as a background async task every `CME_INTERVAL_SECONDS`:

```
┌─────────────────────────────────────────────────────┐
│                   CME Cycle                         │
│                                                     │
│  For each active session:                           │
│    For each subgroup:                               │
│                                                     │
│    1. TAXONOMY PHASE                                │
│       Fetch last 20 messages                        │
│       ──► LLM extracts ideas + sentiment            │
│       ──► Save as Idea records (deduplicated)       │
│                                                     │
│    2. CROSS-POLLINATION PHASE                       │
│       Find ideas NOT in this subgroup               │
│       Select up to 3 most relevant                  │
│       ──► LLM crafts natural surrogate message      │
│       ──► Save as Message (type: surrogate)         │
│       ──► Broadcast via Redis pub/sub + WebSocket   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Message Types

| Type | Source | Badge | Description |
|------|--------|-------|-------------|
| `human` | Real participant | *(name)* | Normal chat message |
| `surrogate` | CME engine | **AI RELAY** | Relays ideas from other subgroups |
| `contributor` | CME engine | **AI** | Asks probing questions (future feature) |

### Subgroup Partitioning

- **On session start**: Users assigned round-robin to subgroups. Small remainders are merged (e.g., 11 users / size 5 = groups of 6+5, not 5+5+1).
- **Late joins**: Assigned to the smallest existing subgroup, or a new subgroup is created if all are at capacity.
- **Labels**: Auto-generated as "ThinkTank 1", "ThinkTank 2", etc.

## Project Structure

```
swarm-chat/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, CORS, routers
│   │   ├── config.py            # Pydantic Settings (all env vars)
│   │   ├── database.py          # SQLAlchemy async engine & session
│   │   ├── models/              # ORM models
│   │   │   ├── session.py       #   Session (waiting → active → completed)
│   │   │   ├── user.py          #   User (display_name, is_admin, subgroup)
│   │   │   ├── subgroup.py      #   Subgroup (label, session)
│   │   │   ├── message.py       #   Message (human/surrogate/contributor)
│   │   │   └── idea.py          #   Idea (summary, sentiment, counts)
│   │   ├── engine/              # Core deliberation logic
│   │   │   ├── cme.py           #   Background CME loop
│   │   │   ├── taxonomy.py      #   Idea extraction & deduplication
│   │   │   ├── surrogate.py     #   Surrogate Agent message crafting
│   │   │   ├── contributor.py   #   Contributor Agent (future)
│   │   │   └── partitioner.py   #   Subgroup assignment (round-robin)
│   │   ├── services/
│   │   │   ├── llm.py           #   Provider-agnostic LLM client (5 backends)
│   │   │   └── redis.py         #   Redis pub/sub messaging
│   │   ├── routers/             # REST API endpoints
│   │   │   ├── sessions.py      #   Session CRUD, start/stop
│   │   │   ├── users.py         #   Join, get user, messages
│   │   │   └── admin.py         #   Status dashboard, summary generation
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   └── websocket/           # WebSocket connection manager & handlers
│   ├── tests/                   # pytest test suite (82 tests)
│   │   ├── conftest.py          #   Test DB, mock LLM/Redis, test client
│   │   ├── unit/                #   7 unit test modules
│   │   └── integration/         #   4 integration test modules
│   ├── requirements.txt
│   ├── requirements-test.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # View router (lobby/waiting/chat/visualizer)
│   │   ├── components/          # React UI components
│   │   │   ├── Layout.tsx       #   Header, navigation, session info
│   │   │   ├── LobbyView.tsx    #   Create/Join session forms
│   │   │   ├── WaitingView.tsx  #   Waiting room with join code
│   │   │   ├── ChatRoom.tsx     #   Chat interface with sidebar
│   │   │   ├── ChatInput.tsx    #   Message input + Send
│   │   │   ├── MessageBubble.tsx#   Styled message with agent badges
│   │   │   ├── AdminPanel.tsx   #   Start/Stop/Summary controls
│   │   │   ├── Visualizer.tsx   #   Deliberation Map (subgroup graph)
│   │   │   └── SubgroupNode.tsx #   Circular subgroup indicator
│   │   ├── stores/
│   │   │   └── deliberationStore.ts  # Zustand state management
│   │   ├── hooks/
│   │   │   ├── useDeliberation.ts    # Session polling & view transitions
│   │   │   └── useWebSocket.ts       # WebSocket connections & messaging
│   │   └── types/index.ts      # TypeScript interfaces
│   ├── src/__tests__/           # Vitest test suite (43 tests)
│   ├── vitest.config.ts
│   ├── vite.config.ts
│   ├── nginx.conf               # Production reverse proxy
│   └── Dockerfile
├── e2e/                         # Playwright E2E tests (10 tests)
│   ├── tests/
│   │   ├── lobby.spec.ts        #   Lobby screenshots (3 tests)
│   │   └── session-lifecycle.spec.ts  # Full journey (7 tests)
│   ├── playwright.config.ts
│   ├── global-setup.ts          #   Cleans screenshots/ before run
│   └── Dockerfile
├── screenshots/                 # Generated by E2E tests (gitignored)
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production overrides
└── .env.example                 # Environment variable template
```

## API Reference

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sessions` | Create a session `{title, subgroup_size}` |
| `GET` | `/api/sessions/{id}` | Get session details (includes user/subgroup counts) |
| `GET` | `/api/sessions/join/{code}` | Look up session by join code |
| `POST` | `/api/sessions/{id}/start` | Start deliberation (creates subgroups) |
| `POST` | `/api/sessions/{id}/stop` | End deliberation |
| `GET` | `/api/sessions/{id}/subgroups` | List subgroups with members |
| `GET` | `/api/sessions/{id}/ideas` | List extracted ideas |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users` | Join session `{join_code, display_name}` |
| `GET` | `/api/users/{id}` | Get user details |
| `GET` | `/api/users/{id}/messages` | Get messages in user's subgroup |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/{session_id}/status` | Session status with subgroup breakdown |
| `POST` | `/api/admin/{session_id}/summary` | Generate LLM-powered deliberation summary |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | `{"status": "ok"}` |

### WebSocket

| Endpoint | Purpose |
|----------|---------|
| `ws://.../ws/chat/{user_id}/{subgroup_id}` | Real-time subgroup chat |
| `ws://.../ws/session/{user_id}/{session_id}` | Session-wide events (start, stop, joins) |

**Events received by clients:**
- `chat:new_message` — New message in subgroup (human, surrogate, or contributor)
- `chat:surrogate_typing` — Surrogate Agent is about to speak
- `session:started` — Deliberation started, includes subgroup assignments
- `session:completed` — Deliberation ended
- `session:user_joined` — New participant joined

**Events sent by clients:**
```json
{"event": "chat:message", "data": {"content": "Your message text"}}
```

## Testing

All tests run inside Docker containers.

### Backend (82 tests)

```bash
docker compose exec backend python -m pytest tests/ -v
```

- **Unit tests**: LLM service dispatch, partitioner logic, taxonomy extraction, surrogate/contributor message crafting, CME cycle orchestration, WebSocket manager
- **Integration tests**: Full API endpoint coverage (sessions, users, admin, health)
- Uses in-memory SQLite with mocked LLM and Redis

### Frontend (43 tests)

```bash
docker compose exec frontend npm test
```

- **Store tests**: All Zustand actions and state transitions
- **Component tests**: LobbyView, ChatRoom, ChatInput, MessageBubble, AdminPanel, Visualizer

### E2E (10 tests, 10 screenshots)

```bash
docker compose --profile e2e run --rm e2e
```

Runs headless Chromium inside a Playwright container. Generates numbered screenshots in `screenshots/`:

| # | Screenshot | What it captures |
|---|------------|------------------|
| 01 | `lobby-initial.png` | Fresh lobby load |
| 02 | `lobby-create-filled.png` | Create form filled in |
| 03 | `lobby-session-created.png` | Session created with join code |
| 04 | `waiting-admin.png` | Admin in waiting room |
| 05 | `waiting-users-joined.png` | Multiple users joined |
| 06 | `chat-room-empty.png` | Chat room after session start |
| 07 | `chat-messages.png` | Messages sent in chat |
| 08 | `visualizer-view.png` | Deliberation Map visualization |
| 09 | `session-completed.png` | Session stopped |
| 10 | `summary-generated.png` | Summary generated |

## Production Deployment

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

This builds optimized images:
- **Backend**: Gunicorn with 4 Uvicorn workers
- **Frontend**: Static build served by Nginx on port 80
- Nginx proxies `/api/` and `/ws/` to the backend

Make sure to set strong values for `SECRET_KEY`, `POSTGRES_PASSWORD`, and `LLM_API_KEY` in production.

## License

MIT
