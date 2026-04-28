from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import asyncpg

from app.db_pg import get_pool

router = APIRouter(prefix="/events", tags=["events"])


class ProductViewEvent(BaseModel):
    session_id: str
    product_id: int


@router.post("/product-view")
async def record_product_view(event: ProductViewEvent):
    print(f"[VIEW] Received: session={event.session_id}, product={event.product_id}")
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
        print(f"[VIEW] Inserted successfully: id={new_id}")
        return {"status": "ok", "id": new_id}
    except asyncpg.PostgresError as e:
        print(f"[VIEW] Insert FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record view: {str(e)}")


class VideoEngagementEvent(BaseModel):
    session_id: str
    product_id: int
    event_type: str
    watch_duration_seconds: int = 0


@router.post("/video-engagement")
async def record_video_engagement(event: VideoEngagementEvent):
    if event.event_type not in ("start", "complete"):
        raise HTTPException(status_code=400, detail="Invalid event_type")
    print(
        f"[VIDEO] Received: session={event.session_id}, product={event.product_id}, "
        f"type={event.event_type}, duration={event.watch_duration_seconds}"
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
        print(f"[VIDEO] Inserted successfully: id={new_id}")
        return {"status": "ok", "id": new_id}
    except asyncpg.PostgresError as e:
        print(f"[VIDEO] Insert FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record event: {str(e)}")
