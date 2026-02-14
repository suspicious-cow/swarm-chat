# Swarm Chat

Real-time deliberation platform that splits participants into small groups and uses LLM-powered agents to cross-pollinate ideas between them. Based on [Conversational Swarm Intelligence](https://en.wikipedia.org/wiki/Swarm_intelligence) (CSI) — the idea that large groups deliberate better when broken into interconnected subgroups rather than one giant conversation.

## How it works

1. **A facilitator creates a session** with a topic (e.g. "Should our city adopt congestion pricing?")
2. **Participants join** and get auto-assigned to subgroups of ~5 people ("ThinkTanks")
3. **People chat** in real time within their subgroup via WebSocket
4. **The Conversational Matching Engine (CME)** runs on a timer in the background:
   - Extracts ideas from each subgroup's messages using an LLM
   - Identifies ideas that haven't been discussed across groups
   - Dispatches **Surrogate Agents** — LLM-generated messages that naturally introduce insights from other groups ("I've been hearing from other groups that...")
5. **Ideas flow across subgroups** without anyone leaving their small-group conversation

```
  ThinkTank 1          ThinkTank 2          ThinkTank 3
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │ Alice    │         │ Dave     │         │ Grace    │
  │ Bob      │◄───────►│ Eve      │◄───────►│ Hank     │
  │ Carol    │ surrogate│ Frank    │ surrogate│ Ivy      │
  └──────────┘ agents   └──────────┘ agents   └──────────┘
        ▲                                          │
        └──────────────────────────────────────────┘
                    CME cross-pollinates ideas
```

## Tech stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL, Redis pub/sub |
| Frontend | React 19, TypeScript, Zustand, Vite |
| LLM | Provider-agnostic — any OpenAI-compatible API or Anthropic |
| Infra | Docker Compose (dev + prod) |

## Quick start

```bash
# 1. Clone and configure
git clone https://github.com/suspicious-cow/swarm-chat.git
cd swarm-chat
cp .env.example .env
# Edit .env — add your LLM_API_KEY at minimum
```

```bash
# 2. Run everything
docker compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:58432
- **API docs**: http://localhost:58432/docs

## LLM configuration

Swap providers by changing env vars — no code changes required.

| Provider | `LLM_PROVIDER` | `LLM_BASE_URL` | `LLM_MODEL` |
|----------|----------------|-----------------|-------------|
| Gemini | `openai-compatible` | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.0-flash` |
| OpenAI | `openai-compatible` | `https://api.openai.com/v1` | `gpt-4.1-nano` |
| DeepSeek | `openai-compatible` | `https://api.deepseek.com` | `deepseek-chat` |
| Mistral | `openai-compatible` | `https://api.mistral.ai/v1` | `mistral-medium-latest` |
| Anthropic | `anthropic` | *(not needed)* | `claude-haiku-4-5-20251001` |
| Ollama | `openai-compatible` | `http://localhost:11434/v1` | `llama3` |

Example — switch from Gemini to DeepSeek:

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=sk-your-deepseek-key
LLM_MODEL=deepseek-chat
```

Then `docker compose restart backend`.

## Project structure

```
backend/
  app/
    engine/          # Core deliberation logic
      cme.py         #   Conversational Matching Engine (background loop)
      taxonomy.py    #   Idea extraction & deduplication
      surrogate.py   #   Surrogate Agent message crafting
      contributor.py #   Contributor Agent (optional, for hybrid mode)
      partitioner.py #   Subgroup assignment (round-robin)
    services/
      llm.py         #   Provider-agnostic LLM client
      redis.py       #   Redis pub/sub for real-time messaging
    models/          # SQLAlchemy ORM models
    routers/         # FastAPI REST endpoints
    schemas/         # Pydantic request/response schemas
    websocket/       # WebSocket connection manager & handlers
frontend/
  src/
    components/      # React UI components
    hooks/           # WebSocket & deliberation hooks
    stores/          # Zustand state management
```

## Engine settings

| Env var | Default | Description |
|---------|---------|-------------|
| `SUBGROUP_SIZE` | `5` | Target members per subgroup |
| `CME_INTERVAL_SECONDS` | `20` | How often the CME scans for new ideas |
| `SURROGATE_INTERVAL_SECONDS` | `30` | Min interval between surrogate messages per group |

## License

MIT
