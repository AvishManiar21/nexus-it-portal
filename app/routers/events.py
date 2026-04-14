from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/events", tags=["events"])


class ProductViewEvent(BaseModel):
    session_id: str
    product_id: int


@router.post("/product-view")
def record_product_view(event: ProductViewEvent, db=Depends(get_db)):
    try:
        db.table("visitor_page_views").insert({
            "session_id": event.session_id,
            "product_id": event.product_id,
        }).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to record view")
    return {"status": "ok"}


class VideoEngagementEvent(BaseModel):
    session_id: str
    product_id: int
    event_type: str
    watch_duration_seconds: int = 0


@router.post("/video-engagement")
def record_video_engagement(event: VideoEngagementEvent, db=Depends(get_db)):
    if event.event_type not in ("start", "complete"):
        raise HTTPException(status_code=400, detail="Invalid event_type")
    try:
        db.table("video_engagement_events").insert({
            "session_id": event.session_id,
            "product_id": event.product_id,
            "event_type": event.event_type,
            "watch_duration_seconds": event.watch_duration_seconds,
        }).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to record event")
    return {"status": "ok"}
