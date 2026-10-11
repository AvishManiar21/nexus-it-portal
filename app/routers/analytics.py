"""
Analytics dashboard endpoint covering US-22 (lead totals) and US-23
(engagement / completion-rate analytics).

Uses the asyncpg pool directly (NOT the Supabase SDK) so we get reliable
reads from video_engagement_events and visitor_page_views (which the
PostgREST API cannot reliably persist to — see KNOWN_ISSUES.md) and
consistent perf via parallel query execution.
"""
import asyncio
from typing import Any, Dict, List, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException

from app.db_pg import get_pool
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _fetch_total_leads(conn: asyncpg.Connection) -> int:
    return await conn.fetchval("SELECT COUNT(*) FROM leads")


async def _fetch_new_leads_this_week(conn: asyncpg.Connection) -> int:
    return await conn.fetchval(
        "SELECT COUNT(*) FROM leads WHERE created_at >= NOW() - INTERVAL '7 days'"
    )


async def _fetch_total_contact_messages(conn: asyncpg.Connection) -> int:
    return await conn.fetchval("SELECT COUNT(*) FROM contact_messages")


async def _fetch_total_rfd_submissions(conn: asyncpg.Connection) -> int:
    """Count leads that came from RFD Form (matches the table display)"""
    return await conn.fetchval(
        "SELECT COUNT(*) FROM leads WHERE source = 'RFD Form'"
    )


async def _fetch_conversion_rate(conn: asyncpg.Connection) -> float:
    """Calculate percentage of leads that have been contacted or converted"""
    row = await conn.fetchrow(
        """
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status IN ('contacted', 'converted') THEN 1 ELSE 0 END) as converted
        FROM leads
        """
    )
    if row is None or int(row["total"]) == 0:
        return 0.0
    return float(row["converted"]) / float(row["total"])


async def _fetch_leads_by_source(conn: asyncpg.Connection) -> List[Dict[str, Any]]:
    """Get lead count breakdown by source"""
    rows = await conn.fetch(
        """
        SELECT
            COALESCE(source, 'Unknown') as source,
            COUNT(*) as count
        FROM leads
        GROUP BY source
        ORDER BY count DESC
        """
    )
    return [{"source": row["source"], "count": int(row["count"])} for row in rows]


async def _fetch_most_viewed_product(conn: asyncpg.Connection) -> Dict[str, Any]:
    row = await conn.fetchrow(
        """
        SELECT p.id AS product_id, p.name, COUNT(v.id) AS view_count
        FROM products p
        LEFT JOIN visitor_page_views v ON v.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY view_count DESC
        LIMIT 1
        """
    )
    if row is None or int(row["view_count"]) == 0:
        return {"product_id": None, "name": None, "view_count": 0}
    return {
        "product_id": int(row["product_id"]),
        "name": row["name"],
        "view_count": int(row["view_count"]),
    }


async def _fetch_completion_rates_by_product(
    conn: asyncpg.Connection,
) -> List[Dict[str, Any]]:
    rows = await conn.fetch(
        """
        SELECT
            p.id AS product_id,
            p.name,
            COALESCE(SUM(CASE WHEN v.event_type = 'start' THEN 1 ELSE 0 END), 0) AS starts,
            COALESCE(SUM(CASE WHEN v.event_type = 'complete' THEN 1 ELSE 0 END), 0) AS completes
        FROM products p
        LEFT JOIN video_engagement_events v
            ON v.product_id = p.id
            AND v.event_type IN ('start', 'complete')
        GROUP BY p.id, p.name
        ORDER BY p.id ASC
        """
    )
    result: List[Dict[str, Any]] = []
    for row in rows:
        starts = int(row["starts"])
        completes = int(row["completes"])
        rate = (completes / starts) if starts > 0 else 0.0
        result.append(
            {
                "product_id": int(row["product_id"]),
                "name": row["name"],
                "starts": starts,
                "completes": completes,
                "completion_rate": rate,
            }
        )
    return result


@router.get("/dashboard")
async def get_dashboard(admin=Depends(get_current_admin)) -> Dict[str, Any]:
    """
    Aggregate metrics for the admin dashboard.

    Returns total leads, new leads in the last 7 days, the single most-viewed
    product, and per-product video completion rates.

    All four queries run in parallel against a single pooled connection
    (asyncpg's Connection supports concurrent queries by serializing them
    internally). To keep things truly parallel we acquire one connection per
    query from the pool.
    """
    try:
        pool = await get_pool()

        # Acquire one connection per query so the queries truly run in parallel
        # (a single asyncpg Connection serializes concurrent queries).
        async def _with_conn(fn):
            async with pool.acquire() as conn:
                return await fn(conn)

        (
            total_leads,
            new_leads_this_week,
            most_viewed_product,
            completion_rates,
            total_contact_messages,
            total_rfd_submissions,
            conversion_rate,
            leads_by_source,
        ) = await asyncio.gather(
            _with_conn(_fetch_total_leads),
            _with_conn(_fetch_new_leads_this_week),
            _with_conn(_fetch_most_viewed_product),
            _with_conn(_fetch_completion_rates_by_product),
            _with_conn(_fetch_total_contact_messages),
            _with_conn(_fetch_total_rfd_submissions),
            _with_conn(_fetch_conversion_rate),
            _with_conn(_fetch_leads_by_source),
        )

        return {
            "total_leads": int(total_leads or 0),
            "new_leads_this_week": int(new_leads_this_week or 0),
            "most_viewed_product": most_viewed_product,
            "completion_rates_by_product": completion_rates,
            "total_contact_messages": int(total_contact_messages or 0),
            "total_rfd_submissions": int(total_rfd_submissions or 0),
            "conversion_rate": float(conversion_rate or 0.0),
            "leads_by_source": leads_by_source,
        }
    except asyncpg.PostgresError as e:
        print(f"[ANALYTICS] Query FAILED: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to compute analytics",
        )
