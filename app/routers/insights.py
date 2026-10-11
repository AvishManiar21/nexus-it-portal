"""Admin endpoints for AI lead insights (see app/services/lead_insights.py)."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.rate_limit import limiter
from app.services import lead_insights as li

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["insights"])


def _load_cached(db: Client, lead_id: int):
    res = db.table("lead_insights").select("*").eq("lead_id", lead_id).execute()
    return res.data[0] if res.data else None


def _response(score: li.LeadScore, signals: li.LeadSignals, insight):
    stale = False
    if insight and signals.last_activity:
        generated = li.parse_ts(insight.get("generated_at"))
        stale = bool(generated and signals.last_activity > generated)
    return {
        "score": {
            "points": score.points,
            "label": score.label,
            "breakdown": [{"reason": r, "points": p} for r, p in score.breakdown],
        },
        "insight": insight,
        "stale": stale,
    }


@router.get("/scores")
def get_scores(db: Client = Depends(get_db), admin: dict = Depends(get_current_admin)):
    """Rules-based score for every lead, hottest first (5 queries total)."""
    return li.score_all(db)


@router.get("/{lead_id}/insights")
def get_insights(lead_id: int, db: Client = Depends(get_db), admin: dict = Depends(get_current_admin)):
    """Live rules-based score plus the cached AI insight (if one was generated)."""
    lead, signals = li.gather(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    score = li.score_lead(lead.get("budget"), signals)
    return _response(score, signals, _load_cached(db, lead_id))


@router.post("/{lead_id}/insights")
@limiter.limit("10/minute")
async def generate_insights(
    request: Request, lead_id: int, db: Client = Depends(get_db), admin: dict = Depends(get_current_admin)
):
    """Generate (or regenerate) the AI insight for a lead and cache it."""
    lead, signals = li.gather(db, lead_id)
    if lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    score = li.score_lead(lead.get("budget"), signals)

    try:
        text = await li.generate(li.build_messages(lead, signals, score))
    except li.InsightUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))

    row = {
        "lead_id": lead_id,
        **text.model_dump(),
        "model": li.AI_MODEL,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    db.table("lead_insights").upsert(row, on_conflict="lead_id").execute()
    logger.info("Generated AI insight for lead %s with %s", lead_id, li.AI_MODEL)
    return _response(score, signals, row)
