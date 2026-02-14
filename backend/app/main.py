import asyncio
import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models.base import Base
from app.routers import sessions, users, admin
from app.websocket.routes import router as ws_router
from app.engine.cme import start_cme_loop, stop_cme_loop
from app.services.redis import close_redis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

cme_task: asyncio.Task | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global cme_task
    # Startup: create tables and start CME
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    cme_task = asyncio.create_task(start_cme_loop())
    logger.info("CME background loop started")

    yield

    # Shutdown
    stop_cme_loop()
    if cme_task:
        cme_task.cancel()
    await close_redis()
    await engine.dispose()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Swarm Chat - Conversational Swarm Intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
origins = [o.strip() for o in settings.BACKEND_CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(sessions.router)
app.include_router(users.router)
app.include_router(admin.router)

# WebSocket routes
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
