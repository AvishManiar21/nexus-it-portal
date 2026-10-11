"""
AI lead insights.

Design:
- The lead SCORE is computed in code from transparent rules (score_lead). Small
  local models were unreliable at calibrated judgments (they rated an obviously
  hot lead "warm"), so the model never decides the score.
- The model only WRITES: a summary, a suggested next step and a draft follow-up
  email, grounded in the facts and score computed here.
- The prompt deliberately omits the lead's email and phone (data minimization).
- Any OpenAI-compatible endpoint works; the default is a local Ollama server, so
  lead data does not leave the machine.
"""
from __future__ import annotations

import json
import logging
import os
import re
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import httpx
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

AI_BASE_URL = os.getenv("AI_BASE_URL", "http://localhost:11434/v1").rstrip("/")
AI_MODEL = os.getenv("AI_MODEL", "llama3.2")
AI_API_KEY = os.getenv("AI_API_KEY", "")  # not needed for local Ollama
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "180"))

HOT_THRESHOLD = 60
WARM_THRESHOLD = 35


class InsightUnavailable(Exception):
    """The model could not be reached or returned unusable output."""


# ---------------------------------------------------------------------------
# Signals and scoring (pure, deterministic)
# ---------------------------------------------------------------------------

@dataclass
class LeadSignals:
    demo_requests: list[dict] = field(default_factory=list)     # {"product": str, "message": str}
    contact_messages: list[dict] = field(default_factory=list)  # {"subject": str, "message": str}
    page_views: Counter = field(default_factory=Counter)        # product name -> views
    videos_completed: list[str] = field(default_factory=list)
    videos_started: list[str] = field(default_factory=list)
    watch_seconds: int = 0
    last_activity: Optional[datetime] = None


@dataclass
class LeadScore:
    points: int
    label: str                                      # "hot" | "warm" | "cold"
    breakdown: list[tuple[str, int]]                # (reason, points)


def budget_lower_bound(budget: Optional[str]) -> Optional[int]:
    """Lower bound in dollars of a budget option, across both form scales.

    "$10,000 - $50,000" -> 10000, "$25,000+" -> 25000, "Over $100,000" -> 100000,
    "Under $10,000" -> 0. Unknown or empty -> None.
    """
    if not budget:
        return None
    text = budget.strip().lower()
    numbers = [int(n.replace(",", "")) for n in re.findall(r"\d[\d,]*", text)]
    if not numbers:
        return None
    if text.startswith("under"):
        return 0
    return numbers[0]


def score_lead(budget: Optional[str], signals: LeadSignals, now: Optional[datetime] = None) -> LeadScore:
    """Transparent points-based score. Each rule contributes a visible reason."""
    now = now or datetime.now(timezone.utc)
    breakdown: list[tuple[str, int]] = []

    if signals.demo_requests:
        breakdown.append(("Requested a demo", 30))
    elif signals.contact_messages:
        breakdown.append(("Sent a contact message", 15))

    lower = budget_lower_bound(budget)
    if lower is not None:
        if lower >= 50_000:
            pts = 25
        elif lower >= 25_000:
            pts = 20
        elif lower >= 10_000:
            pts = 15
        elif lower >= 5_000:
            pts = 8
        else:
            pts = 3
        breakdown.append((f"Budget: {budget}", pts))

    views = sum(signals.page_views.values())
    if views:
        breakdown.append((f"Viewed solution pages {views} time{'s' if views != 1 else ''}", min(views * 2, 10)))

    if signals.videos_completed:
        breakdown.append(("Watched a demo video to the end", 15))
    elif signals.videos_started:
        breakdown.append(("Started a demo video", 5))

    if signals.last_activity:
        age_days = (now - signals.last_activity).total_seconds() / 86400
        if age_days <= 7:
            breakdown.append(("Active in the last 7 days", 10))
        elif age_days <= 30:
            breakdown.append(("Active in the last 30 days", 5))

    points = sum(p for _, p in breakdown)
    label = "hot" if points >= HOT_THRESHOLD else "warm" if points >= WARM_THRESHOLD else "cold"
    return LeadScore(points=points, label=label, breakdown=breakdown)


# ---------------------------------------------------------------------------
# Data gathering (I/O)
# ---------------------------------------------------------------------------

def parse_ts(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        ts = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)


def gather(db, lead_id: int) -> tuple[Optional[dict], LeadSignals]:
    """Load the lead and its behavioral signals. Returns (None, empty) if the lead doesn't exist."""
    lead_res = db.table("leads").select("id, name, company, budget, source, status, session_id, created_at").eq("id", lead_id).execute()
    if not lead_res.data:
        return None, LeadSignals()
    lead = lead_res.data[0]
    signals = LeadSignals()
    timestamps: list[Optional[datetime]] = [parse_ts(lead.get("created_at"))]

    rfd = db.table("rfd_submissions").select("message, created_at, products(name)").eq("lead_id", lead_id).execute()
    for r in rfd.data or []:
        signals.demo_requests.append({"product": (r.get("products") or {}).get("name", "unknown product"), "message": r.get("message") or ""})
        timestamps.append(parse_ts(r.get("created_at")))

    contact = db.table("contact_messages").select("subject, message, created_at").eq("lead_id", lead_id).execute()
    for c in contact.data or []:
        signals.contact_messages.append({"subject": c.get("subject") or "", "message": c.get("message") or ""})
        timestamps.append(parse_ts(c.get("created_at")))

    session_id = lead.get("session_id")
    if session_id:
        views = db.table("visitor_page_views").select("viewed_at, products(name)").eq("session_id", session_id).execute()
        for v in views.data or []:
            signals.page_views[(v.get("products") or {}).get("name", "unknown product")] += 1
            timestamps.append(parse_ts(v.get("viewed_at")))

        videos = db.table("video_engagement_events").select(
            "event_type, watch_duration_seconds, created_at, products(name)"
        ).eq("session_id", session_id).execute()
        for e in videos.data or []:
            name = (e.get("products") or {}).get("name", "unknown product")
            if e.get("event_type") == "complete":
                signals.videos_completed.append(name)
                signals.watch_seconds += int(e.get("watch_duration_seconds") or 0)
            else:
                signals.videos_started.append(name)
            timestamps.append(parse_ts(e.get("created_at")))

    known = [t for t in timestamps if t]
    signals.last_activity = max(known) if known else None
    return lead, signals


# ---------------------------------------------------------------------------
# Prompt and model call
# ---------------------------------------------------------------------------

class InsightText(BaseModel):
    summary: str = Field(min_length=1, max_length=1500)
    next_step: str = Field(min_length=1, max_length=800)
    email_subject: str = Field(min_length=1, max_length=200)
    email_body: str = Field(min_length=1, max_length=3000)


INSIGHT_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "next_step": {"type": "string"},
        "email_subject": {"type": "string"},
        "email_body": {"type": "string"},
    },
    "required": ["summary", "next_step", "email_subject", "email_body"],
}

SYSTEM_PROMPT = (
    "You help a B2B IT sales team follow up on leads. Use ONLY the facts provided; never invent "
    "facts, numbers, names or products. The lead score is already decided; do not change or argue with it. "
    "Return JSON with: summary (2-3 sentences on who the lead is and what they care about), "
    "next_step (one concrete action for the sales team), email_subject, and email_body (a short, "
    "friendly follow-up email to the lead, signed '[Your name]', no placeholders other than that)."
)


def build_facts(lead: dict, signals: LeadSignals, score: LeadScore) -> str:
    """Plain-text facts for the model. Excludes email and phone on purpose."""
    lines = [
        f"Contact first name: {(lead.get('name') or 'there').split()[0]}",
        f"Company: {lead.get('company') or 'unknown'}",
        f"Budget: {lead.get('budget') or 'not given'}",
        f"Lead source: {lead.get('source') or 'unknown'}; current status: {lead.get('status') or 'new'}",
        f"Lead score (decided by rules): {score.label.upper()} ({score.points} points)",
        "Score reasons: " + ("; ".join(r for r, _ in score.breakdown) or "none"),
    ]
    for d in signals.demo_requests:
        lines.append(f"Demo requested for {d['product']}" + (f'; their message: "{d["message"]}"' if d["message"] else ""))
    for c in signals.contact_messages:
        lines.append(f'Contact message, subject "{c["subject"]}": "{c["message"]}"')
    if signals.page_views:
        lines.append("Solution pages viewed: " + ", ".join(f"{p} x{n}" for p, n in signals.page_views.most_common()))
    if signals.videos_completed:
        lines.append(f"Watched demo video to the end: {', '.join(sorted(set(signals.videos_completed)))} ({signals.watch_seconds}s total)")
    elif signals.videos_started:
        lines.append(f"Started (did not finish) demo video: {', '.join(sorted(set(signals.videos_started)))}")
    return "\n".join(lines)


def build_messages(lead: dict, signals: LeadSignals, score: LeadScore) -> list[dict]:
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": build_facts(lead, signals, score)},
    ]


async def generate(messages: list[dict]) -> InsightText:
    """Call the OpenAI-compatible endpoint with a JSON schema and validate the result."""
    headers = {"Authorization": f"Bearer {AI_API_KEY}"} if AI_API_KEY else {}
    payload = {
        "model": AI_MODEL,
        "temperature": 0.3,
        "messages": messages,
        "response_format": {"type": "json_schema", "json_schema": {"name": "lead_insight", "schema": INSIGHT_SCHEMA}},
    }
    try:
        async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
            res = await client.post(f"{AI_BASE_URL}/chat/completions", json=payload, headers=headers)
            res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"]
        return InsightText.model_validate(json.loads(content))
    except httpx.HTTPError as e:
        logger.warning("AI endpoint unavailable (%s): %s", AI_BASE_URL, e)
        raise InsightUnavailable("The AI model could not be reached.") from e
    except (KeyError, IndexError, ValueError, ValidationError) as e:
        logger.warning("AI returned unusable output: %s", e)
        raise InsightUnavailable("The AI model returned an unusable response.") from e
