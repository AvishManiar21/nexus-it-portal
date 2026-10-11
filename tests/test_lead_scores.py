"""Batch lead scoring: same results as single-lead scoring, sorted, and routed correctly."""
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

import main
from app.database import get_db
from app.services import lead_insights as li

NOW = datetime.now(timezone.utc)
iso = lambda days: (NOW - timedelta(days=days)).isoformat()  # noqa: E731


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *_):
        return self

    def eq(self, key, value):
        return FakeQuery([r for r in self.rows if r.get(key) == value])

    def execute(self):
        return type("Res", (), {"data": list(self.rows)})()


class FakeDB:
    """Minimal stand-in for the Supabase client: table(name).select().eq().execute()."""

    def __init__(self, tables):
        self.tables = tables

    def table(self, name):
        return FakeQuery(self.tables.get(name, []))


PRODUCT = {"products": {"name": "Cybersecurity Shield"}}
DB = FakeDB({
    "leads": [
        {"id": 1, "name": "Hot Lead", "company": "A", "budget": "$10,000 - $50,000", "status": "new", "session_id": "s1", "created_at": iso(3)},
        {"id": 2, "name": "Cold Lead", "company": "B", "budget": None, "status": "new", "session_id": None, "created_at": iso(120)},
        {"id": 3, "name": "Warm Lead", "company": "C", "budget": "$25,000+", "status": "contacted", "session_id": "s3", "created_at": iso(40)},
    ],
    "rfd_submissions": [{"lead_id": 1, "message": "Audit soon", "created_at": iso(2), **PRODUCT}],
    "contact_messages": [{"lead_id": 3, "subject": "Pricing", "message": "Hi", "created_at": iso(20)}],
    "visitor_page_views": [{"session_id": "s1", "viewed_at": iso(2), **PRODUCT} for _ in range(4)]
                          + [{"session_id": "s3", "viewed_at": iso(25), **PRODUCT}],
    "video_engagement_events": [
        {"session_id": "s1", "event_type": "start", "watch_duration_seconds": 0, "created_at": iso(2), **PRODUCT},
        {"session_id": "s1", "event_type": "complete", "watch_duration_seconds": 300, "created_at": iso(2), **PRODUCT},
    ],
})


def test_batch_scores_match_single_lead_scoring():
    batch = {r["lead_id"]: r for r in li.score_all(DB)}
    for lead_id in (1, 2, 3):
        lead, signals = li.gather(DB, lead_id)
        single = li.score_lead(lead["budget"], signals)
        assert (batch[lead_id]["label"], batch[lead_id]["points"]) == (single.label, single.points)


def test_batch_scores_are_sorted_hottest_first():
    results = li.score_all(DB)
    assert [r["lead_id"] for r in results] == [1, 3, 2]
    assert [r["label"] for r in results] == ["hot", "warm", "cold"]


def test_scores_endpoint_requires_admin_and_is_not_captured_by_lead_route():
    client = TestClient(main.app)
    assert client.get("/leads/scores").status_code == 401  # not 422 from /leads/{lead_id}

    token = jwt.encode(
        {"userId": "1", "email": "a@example.com", "name": "A", "exp": NOW + timedelta(minutes=15)},
        os.environ["SESSION_SECRET"], algorithm="HS256",
    )
    main.app.dependency_overrides[get_db] = lambda: DB
    try:
        r = client.get("/leads/scores", headers={"Cookie": f"session={token}"})
    finally:
        main.app.dependency_overrides.clear()
    assert r.status_code == 200
    assert r.json()[0]["lead_id"] == 1 and r.json()[0]["label"] == "hot"
