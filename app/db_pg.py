"""
Direct Postgres connection pool (asyncpg) for tables that the Supabase
PostgREST API cannot reliably persist to.

See KNOWN_ISSUES.md: video_engagement_events and visitor_page_views inserts
return 200 OK from PostgREST but never persist. The fix is to bypass
PostgREST and talk to Supabase Postgres directly via asyncpg.

Usage:
    from app.db_pg import get_pool
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("INSERT INTO ... RETURNING id")
"""
import os
import asyncio
from typing import Optional

import asyncpg
from dotenv import load_dotenv

# Use override=True so the .env file wins over stale system env vars,
# matching the convention in app/database.py.
load_dotenv(override=True)


_pool: Optional[asyncpg.Pool] = None
_pool_lock: asyncio.Lock = asyncio.Lock()


def _get_database_url() -> str:
    """Read DATABASE_URL from env, raising a developer-friendly error if missing."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Copy it from Supabase Dashboard -> Settings -> Database -> "
            "Connection String -> URI (format: "
            "postgresql://postgres.[ref]:[password]@[host]:6543/postgres) "
            "and add it to your .env file."
        )
    return database_url


async def get_pool() -> asyncpg.Pool:
    """
    Lazily create (on first call) and return the shared asyncpg connection pool.

    The pool is created with min_size=1, max_size=10 and ssl='require' because
    Supabase Postgres requires TLS.
    """
    global _pool
    if _pool is not None:
        return _pool

    async with _pool_lock:
        # Double-checked locking: another coroutine may have created the pool
        # while we were waiting on the lock.
        if _pool is None:
            database_url = _get_database_url()
            _pool = await asyncpg.create_pool(
                dsn=database_url,
                min_size=1,
                max_size=10,
                ssl="require",
            )
    return _pool


async def close_pool() -> None:
    """Close the shared pool. Safe to call when no pool was ever created."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
