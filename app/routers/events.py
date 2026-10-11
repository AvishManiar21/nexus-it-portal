import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncpg

from app.db_pg import get_pool
from app.rate_limit import limiter, EVENT_LIMIT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["events"])


class ProductViewEvent(BaseModel):
    session_id: str
    product_id: int


@router.post("/product-view")
@limiter.limit(EVENT_LIMIT)
async def record_product_view(request: Request, event: ProductViewEvent):
    logger.debug("Product view received: session=%s product=%s", event.session_id, event.product_id)
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO visitor_page_views (session_id, product_id)
                VALUES ($1::uuid, $2)
                RETURNING id
                """,
                event.session_id,
                event.product_id,
            )
        new_id = row["id"]
        logger.debug("Product view recorded: id=%s", new_id)
        return {"status": "ok", "id": new_id}
    except asyncpg.PostgresError:
        logger.exception("Failed to record product view")
        raise HTTPException(status_code=500, detail="Failed to record view")


class VideoEngagementEvent(BaseModel):
    session_id: str
    product_id: int
    event_type: str
    watch_duration_seconds: int = 0


@router.post("/video-engagement")
@limiter.limit(EVENT_LIMIT)
async def record_video_engagement(request: Request, event: VideoEngagementEvent):
    if event.event_type not in ("start", "complete"):
        raise HTTPException(status_code=400, detail="Invalid event_type")
    logger.debug(
        "Video event received: session=%s product=%s type=%s duration=%s",
        event.session_id, event.product_id, event.event_type, event.watch_duration_seconds,
    )
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO video_engagement_events
                    (session_id, product_id, event_type, watch_duration_seconds)
                VALUES ($1::uuid, $2, $3, $4)
                RETURNING id
                """,
                event.session_id,
                event.product_id,
                event.event_type,
                event.watch_duration_seconds,
            )
        new_id = row["id"]
        logger.debug("Video event recorded: id=%s", new_id)
        return {"status": "ok", "id": new_id}
    except asyncpg.PostgresError:
        logger.exception("Failed to record video event")
        raise HTTPException(status_code=500, detail="Failed to record event")
