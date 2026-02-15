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


# Override bind processor so SQLite accepts both str and uuid.UUID values
_original_bind_processor = PG_UUID.bind_processor


def _patched_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        def process(value):
            if value is None:
                return value
            return str(value) if not isinstance(value, str) else value
        return process
    return _original_bind_processor(self, dialect)


PG_UUID.bind_processor = _patched_bind_processor


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

    # Import site in websocket handlers (human chat messages now go through Redis)
    monkeypatch.setattr("app.websocket.handlers.publish_to_subgroup", mock_pub_subgroup)

    # start_redis_subscriber — no-op in tests (no real Redis connection)
    monkeypatch.setattr("app.services.redis.start_redis_subscriber", AsyncMock())

    # Mock get_redis in cme module (used by distributed lock)
    mock_redis_client = AsyncMock()
    mock_redis_client.set = AsyncMock(return_value=True)
    mock_redis_client.get = AsyncMock(return_value=None)
    mock_redis_client.expire = AsyncMock(return_value=True)
    mock_redis_client.delete = AsyncMock(return_value=1)
    mock_get_redis = AsyncMock(return_value=mock_redis_client)
    monkeypatch.setattr("app.engine.cme.get_redis", mock_get_redis)

    return {
        "publish_to_subgroup": mock_pub_subgroup,
        "publish_to_session": mock_pub_session,
        "enqueue_cme_task": mock_enqueue,
        "redis_client": mock_redis_client,
        "get_redis": mock_get_redis,
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


# ---------------------------------------------------------------------------
# Auth fixtures — test account and pre-authenticated client
# ---------------------------------------------------------------------------

@pytest.fixture
async def account(db):
    """Create a test account with known credentials."""
    from app.auth import hash_password
    from app.models.account import Account

    acct = Account(
        username="testuser",
        password_hash=hash_password("testpass123"),
        display_name="Test User",
    )
    db.add(acct)
    await db.commit()
    await db.refresh(acct)
    return acct


@pytest.fixture
async def admin_account(db):
    """Create an admin account with known credentials."""
    from app.auth import hash_password
    from app.models.account import Account

    acct = Account(
        username="adminuser",
        password_hash=hash_password("adminpass123"),
        display_name="Admin User",
        is_server_admin=True,
    )
    db.add(acct)
    await db.commit()
    await db.refresh(acct)
    return acct


@pytest.fixture
async def auth_client(client, account):
    """Client with swarm_token cookie set for the test account."""
    from app.auth import create_access_token

    token = create_access_token(str(account.id))
    client.cookies.set("swarm_token", token)
    return client


@pytest.fixture
async def admin_auth_client(client, admin_account):
    """Client with swarm_token cookie set for the admin account."""
    from app.auth import create_access_token

    token = create_access_token(str(admin_account.id))
    client.cookies.set("swarm_token", token)
    return client


@pytest.fixture
async def invite_code(db, admin_account):
    """Create a test invite code."""
    from app.models.invite_code import InviteCode

    code = InviteCode(
        code="TESTCODE",
        created_by=admin_account.id,
        max_uses=10,
    )
    db.add(code)
    await db.commit()
    await db.refresh(code)
    return code
