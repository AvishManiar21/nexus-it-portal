"""Tests for AI lead insights: scoring rules, prompt privacy, model handling and endpoints."""
import asyncio
import json
import os
from collections import Counter
from datetime import datetime, timedelta, timezone
from unittest import mock

import httpx
import jwt
import pytest
from fastapi.testclient import TestClient

import main
from app.database import get_db
from app.services import lead_insights as li

NOW = datetime(2026, 10, 11, 12, 0, tzinfo=timezone.utc)


# --- budget parsing ---------------------------------------------------------

@pytest.mark.parametrize("budget,expected", [
    ("Under $10,000", 0),
    ("$10,000 - $50,000", 10_000),
    ("$50,000 - $100,000", 50_000),
    ("Over $100,000", 100_000),
    ("$1,000 - $5,000", 1_000),
    ("$25,000+", 25_000),
    ("", None),
    (None, None),
    ("flexible", None),
])
def test_budget_lower_bound_handles_both_form_scales(budget, expected):
    assert li.budget_lower_bound(budget) == expected


# --- scoring ----------------------------------------------------------------

def hot_signals():
    return li.LeadSignals(
        demo_requests=[{"product": "Cybersecurity Shield", "message": "Audit in Q1"}],
        page_views=Counter({"Cybersecurity Shield": 4, "Cloud Infrastructure Suite": 2}),
        videos_completed=["Cybersecurity Shield"],
        watch_seconds=412,
        last_activity=NOW - timedelta(days=2),
    )


def test_engaged_lead_with_budget_scores_hot():
    # The case the small local models rated "warm"
    score = li.score_lead("$10,000 - $50,000", hot_signals(), now=NOW)
    assert score.label == "hot"
    assert score.points == 30 + 15 + 10 + 15 + 10
    assert ("Requested a demo", 30) in score.breakdown


def test_lead_with_no_activity_scores_cold():
    score = li.score_lead(None, li.LeadSignals(last_activity=NOW - timedelta(days=90)), now=NOW)
    assert score.label == "cold"
    assert score.points == 0
    assert score.breakdown == []


def test_contact_only_lead_scores_warm_with_budget():
    signals = li.LeadSignals(contact_messages=[{"subject": "Pricing", "message": "Hi"}], last_activity=NOW)
    score = li.score_lead("$25,000+", signals, now=NOW)
    assert score.points == 15 + 20 + 10
    assert score.label == "warm"


def test_page_view_points_are_capped():
    signals = li.LeadSignals(page_views=Counter({"A": 50}))
    score = li.score_lead(None, signals, now=NOW)
    assert ("Viewed solution pages 50 times", 10) in score.breakdown


def test_recency_tiers():
    recent = li.score_lead(None, li.LeadSignals(last_activity=NOW - timedelta(days=20)), now=NOW)
    assert ("Active in the last 30 days", 5) in recent.breakdown


# --- prompt privacy -----------------------------------------------------------

def test_prompt_excludes_email_and_phone():
    lead = {"name": "Pat Jones", "company": "Acme", "email": "pat@acme.example", "phone": "+1 555 0100", "budget": "$25,000+"}
    signals = hot_signals()
    messages = li.build_messages(lead, signals, li.score_lead(lead["budget"], signals, now=NOW))
    prompt = json.dumps(messages)
    assert "pat@acme.example" not in prompt
    assert "555 0100" not in prompt
    assert "Contact first name: Pat" in prompt
    assert "HOT" in prompt  # the rules-based score is passed to the model as fixed


# --- model call ---------------------------------------------------------------

def run_generate(handler):
    transport = httpx.MockTransport(handler)
    real = httpx.AsyncClient
    with mock.patch.object(li.httpx, "AsyncClient", lambda **kw: real(transport=transport, **kw)):
        return asyncio.run(li.generate([{"role": "user", "content": "x"}]))


def chat_response(content: str):
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


def test_generate_parses_valid_json():
    good = {"summary": "S", "next_step": "N", "email_subject": "Subj", "email_body": "Body"}
    result = run_generate(lambda req: chat_response(json.dumps(good)))
    assert result.summary == "S" and result.email_subject == "Subj"


def test_generate_sends_json_schema():
    seen = {}

    def handler(req):
        seen.update(json.loads(req.content))
        return chat_response(json.dumps({"summary": "S", "next_step": "N", "email_subject": "Subj", "email_body": "B"}))

    run_generate(handler)
    assert seen["response_format"]["type"] == "json_schema"
    assert seen["model"] == li.AI_MODEL


@pytest.mark.parametrize("handler", [
    lambda req: chat_response("not json"),
    lambda req: chat_response(json.dumps({"summary": "missing fields"})),
    lambda req: httpx.Response(500, json={"error": "boom"}),
    lambda req: (_ for _ in ()).throw(httpx.ConnectError("refused")),
])
def test_generate_failures_raise_insight_unavailable(handler):
    with pytest.raises(li.InsightUnavailable):
        run_generate(handler)


# --- endpoints ----------------------------------------------------------------

client = TestClient(main.app)


def admin_cookie():
    token = jwt.encode(
        {"userId": "1", "email": "admin@example.com", "name": "Admin", "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
        os.environ["SESSION_SECRET"],
        algorithm="HS256",
    )
    return {"Cookie": f"session={token}"}


LEAD = {"id": 7, "name": "Pat Jones", "company": "Acme", "budget": "$25,000+", "source": "RFD Form", "status": "new"}


@pytest.fixture
def db():
    fake = mock.MagicMock()
    fake.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    main.app.dependency_overrides[get_db] = lambda: fake
    yield fake
    main.app.dependency_overrides.clear()


def test_insights_require_admin():
    assert client.get("/leads/7/insights").status_code == 401
    assert client.post("/leads/7/insights").status_code == 401


def test_get_returns_live_score_without_cached_insight(db):
    with mock.patch.object(li, "gather", return_value=(LEAD, hot_signals())):
        r = client.get("/leads/7/insights", headers=admin_cookie())
    assert r.status_code == 200
    body = r.json()
    assert body["score"]["label"] == "hot"
    assert body["insight"] is None


def test_post_generates_and_caches(db):
    text = li.InsightText(summary="S", next_step="N", email_subject="Subj", email_body="B")
    with mock.patch.object(li, "gather", return_value=(LEAD, hot_signals())), \
         mock.patch.object(li, "generate", mock.AsyncMock(return_value=text)):
        r = client.post("/leads/7/insights", headers=admin_cookie())
    assert r.status_code == 200
    assert r.json()["insight"]["summary"] == "S"
    upsert_row = db.table.return_value.upsert.call_args[0][0]
    assert upsert_row["lead_id"] == 7 and upsert_row["model"] == li.AI_MODEL


def test_post_returns_503_when_model_unavailable(db):
    with mock.patch.object(li, "gather", return_value=(LEAD, hot_signals())), \
         mock.patch.object(li, "generate", mock.AsyncMock(side_effect=li.InsightUnavailable("down"))):
        r = client.post("/leads/7/insights", headers=admin_cookie())
    assert r.status_code == 503
    db.table.return_value.upsert.assert_not_called()


def test_missing_lead_returns_404(db):
    with mock.patch.object(li, "gather", return_value=(None, li.LeadSignals())):
        assert client.get("/leads/999/insights", headers=admin_cookie()).status_code == 404
