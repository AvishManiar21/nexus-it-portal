from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from supabase import Client
from datetime import datetime

router = APIRouter(prefix="/engagement", tags=["engagement"])


class EngagementEvent(BaseModel):
    action: str
    product_name: str
    product_id: int
    session_id: str
    timestamp: str
    seconds_watched: Optional[int] = None


@router.post("/track")
def track_engagement(event: EngagementEvent, db: Client = None):
    """Track demo engagement events for anonymous visitors"""
    if db is None:
        db = get_db()

    try:
        # Prepare engagement data for anonymous_engagement_logs table
        details = {
            "timestamp": event.timestamp,
        }

        if event.seconds_watched is not None:
            details["seconds_watched"] = event.seconds_watched

        engagement_data = {
            "session_id": event.session_id,
            "action": event.action,
            "product_id": event.product_id,
            "product_name": event.product_name,
            "details": details,
            "created_at": datetime.now().isoformat(),
        }

        db.table("anonymous_engagement_logs").insert(engagement_data).execute()

        return {
            "success": True,
            "message": f"Engagement event '{event.action}' tracked for {event.product_name}",
        }
    except Exception as e:
        print(f"Error tracking engagement: {e}")
        # Return success anyway to not interrupt user experience
        return {"success": True}
