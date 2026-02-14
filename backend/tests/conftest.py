"""Shared test fixtures: in-memory SQLite DB, mock LLM, mock Redis, test client."""

import uuid
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import String, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.compiler import compiles

from httpx import ASGITransport, AsyncClient

# ---------------------------------------------------------------------------
# Compile-time override: render PostgreSQL UUID as CHAR(36) on SQLite
# ---------------------------------------------------------------------------

@compiles(PG_UUID, "sqlite")
def compile_uuid_sqlite(type_, compiler, **kw):
    return "CHAR(36)"


# ---------------------------------------------------------------------------
# Test database engine / session (in-memory SQLite)
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def _setup_db():
    """Create all tables before each test and drop them after."""
    from app.models.base import Base
    # Import all models so metadata knows about them
    import app.models  # noqa: F401

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db():
    """Yield a test database session."""
    async with TestSessionLocal() as session:
        yield session


async def _override_get_db():
    async with TestSessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# Mock LLM — patches at BOTH definition site AND all import sites
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def mock_llm(monkeypatch):
    """Patch generate_text and generate_json everywhere they're imported."""
    mock_text = AsyncMock(return_value="Mocked LLM response text.")
    mock_json = AsyncMock(return_value=[{"summary": "Test idea", "sentiment": 0.5}])

    # Definition site
    monkeypatch.setattr("app.services.llm.generate_text", mock_text)
    monkeypatch.setattr("app.services.llm.generate_json", mock_json)

    # All import sites (modules that do `from app.services.llm import ...`)
    monkeypatch.setattr("app.engine.surrogate.generate_text", mock_text)
    monkeypatch.setattr("app.engine.contributor.generate_text", mock_text)
    monkeypatch.setattr("app.engine.taxonomy.generate_json", mock_json)
    monkeypatch.setattr("app.routers.admin.generate_text", mock_text)

    return {"generate_text": mock_text, "generate_json": mock_json}


# ---------------------------------------------------------------------------
# Mock Redis — patches at BOTH definition site AND all import sites
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    """Patch Redis publish/enqueue functions everywhere they're imported."""
    mock_pub_subgroup = AsyncMock()
    mock_pub_session = AsyncMock()
    mock_enqueue = AsyncMock()

    # Definition site
    monkeypatch.setattr("app.services.redis.publish_to_subgroup", mock_pub_subgroup)
    monkeypatch.setattr("app.services.redis.publish_to_session", mock_pub_session)
    monkeypatch.setattr("app.services.redis.enqueue_cme_task", mock_enqueue)

    # Import sites in engine modules
    monkeypatch.setattr("app.engine.surrogate.publish_to_subgroup", mock_pub_subgroup)
    monkeypatch.setattr("app.engine.contributor.publish_to_subgroup", mock_pub_subgroup)

    return {
        "publish_to_subgroup": mock_pub_subgroup,
        "publish_to_session": mock_pub_session,
        "enqueue_cme_task": mock_enqueue,
    }


# ---------------------------------------------------------------------------
# FastAPI test client — overrides get_db on the real app
# ASGITransport does NOT trigger lifespan, so CME loop won't start.
# ---------------------------------------------------------------------------

@pytest.fixture
async def client():
    """Async httpx client wired to the FastAPI app with test DB."""
    from app.main import app
    from app.database import get_db

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.pop(get_db, None)
