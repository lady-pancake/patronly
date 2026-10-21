import os
import uuid
from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import get_settings

_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine | None:
    """Return the shared engine, or None when DATABASE_URL is not configured."""
    global _engine, _sessionmaker
    if _engine is None:
        url = get_settings().database_url
        if not url:
            return None
        _engine = create_async_engine(url, **_engine_options())
        _sessionmaker = async_sessionmaker(_engine, expire_on_commit=False)
    return _engine


def _engine_options() -> dict:
    # Supabase's pooler (PgBouncer) does not support prepared statement caching.
    connect_args: dict = {"statement_cache_size": 0}
    if os.environ.get("VERCEL"):
        # Serverless: each request may run in a fresh instance, so don't keep connections
        # open between requests, and give prepared statements unique names so they don't
        # clash on Supabase's transaction pooler.
        connect_args["prepared_statement_name_func"] = lambda: f"__asyncpg_{uuid.uuid4()}__"
        return {"poolclass": NullPool, "connect_args": connect_args}
    return {"pool_pre_ping": True, "connect_args": connect_args}


async def get_session() -> AsyncIterator[AsyncSession]:
    if get_engine() is None or _sessionmaker is None:
        raise RuntimeError("DATABASE_URL is not configured")
    async with _sessionmaker() as session:
        yield session


async def check_database() -> str:
    """'ok', 'not_configured', or 'error'."""
    engine = get_engine()
    if engine is None:
        return "not_configured"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("select 1"))
        return "ok"
    except Exception:
        return "error"


async def dispose_engine() -> None:
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine, _sessionmaker = None, None
