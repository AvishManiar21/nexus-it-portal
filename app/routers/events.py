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
        print(f"[VIEW] Received: session={event.session_id}, product={event.product_id}")
        result = db.table("visitor_page_views").insert({
            "session_id": event.session_id,
            "product_id": event.product_id,
        }).execute()
        print(f"[VIEW] Inserted successfully: {result.data}")
    except Exception as e:
        print(f"[VIEW] Insert FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record view: {str(e)}")
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
        print(f"[VIDEO] Received: session={event.session_id}, product={event.product_id}, type={event.event_type}, duration={event.watch_duration_seconds}")
        result = db.table("video_engagement_events").insert({
            "session_id": str(event.session_id),
            "product_id": event.product_id,
            "event_type": event.event_type,
            "watch_duration_seconds": event.watch_duration_seconds,
        }).execute()
        print(f"[VIDEO] Insert result type: {type(result)}")
        print(f"[VIDEO] Insert result data: {result.data}")
        print(f"[VIDEO] Insert result count: {result.count}")

        # Verify the insert by querying immediately
        verify = db.table("video_engagement_events").select("*").eq("session_id", str(event.session_id)).execute()
        print(f"[VIDEO] Verification query returned: {len(verify.data)} rows")

    except Exception as e:
        print(f"[VIDEO] Insert FAILED: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to record event: {str(e)}")
    return {"status": "ok"}
