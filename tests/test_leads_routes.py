"""Lead routes: public form submissions and admin lead management."""
from unittest import mock

import pytest
from fastapi.testclient import TestClient

import main
import app.routers.leads as L
from app.database import get_db
from tests.fakes import FakeSupabase

client = TestClient(main.app)

PRODUCTS = [{"id": 1, "name": "Cloud Infrastructure Suite"}, {"id": 2, "name": "Cybersecurity Shield"}]
RFD = {
    "company": "Acme", "contactPerson": "Pat Jones", "email": "pat@acme.example", "phone": "555-0100",
    "budget": "$10,000 - $50,000", "products": ["Cybersecurity Shield"], "message": "Audit soon",
    "session_id": "11111111-2222-3333-4444-555555555555",
}
CONTACT = {
    "name": "Sam Lee", "email": "sam@example.com", "company": "Globex", "phone": "555-0101",
    "budget": "$25,000+", "subject": "Pricing", "message": "Hello",
}


@pytest.fixture
def db():
    fake = FakeSupabase({
        "products": PRODUCTS,
        "visitor_page_views": [{"id": 1, "session_id": RFD["session_id"], "lead_id": None}],
        "video_engagement_events": [{"id": 1, "session_id": RFD["session_id"], "lead_id": None}],
    })
    main.app.dependency_overrides[get_db] = lambda: fake
    with mock.patch.object(L, "supabase", fake), \
         mock.patch.object(L, "send_visitor_rfd_confirmation") as rfd_mail, \
         mock.patch.object(L, "send_admin_rfd_alert") as admin_mail, \
         mock.patch.object(L, "send_visitor_contact_confirmation") as contact_mail:
        fake.mails = {"rfd": rfd_mail, "admin": admin_mail, "contact": contact_mail}
        yield fake
    main.app.dependency_overrides.clear()


# --- public: demo request -------------------------------------------------------

def test_rfd_creates_lead_submission_log_links_activity_and_emails(db):
    r = client.post("/leads/submit-rfd", json=RFD)
    assert r.status_code == 200 and r.json()["success"] is True

    lead = db.writes("upsert", "leads")[0]
    assert lead["email"] == RFD["email"] and lead["source"] == "RFD Form" and lead["session_id"] == RFD["session_id"]
    assert db.writes("insert", "rfd_submissions") == [
        {"lead_id": r.json()["lead_id"], "product_id": 2, "message": "Audit soon", "status": "pending"}
    ]
    # anonymous activity from this session is linked to the new lead
    assert db.tables["visitor_page_views"][0]["lead_id"] == r.json()["lead_id"]
    assert db.tables["video_engagement_events"][0]["lead_id"] == r.json()["lead_id"]
    assert db.writes("insert", "engagement_logs")[0]["action"] == "RFD Submission"
    db.mails["rfd"].assert_called_once()
    db.mails["admin"].assert_called_once()


def test_rfd_unknown_product_is_rejected(db):
    r = client.post("/leads/submit-rfd", json={**RFD, "products": ["Not A Product"]})
    assert r.status_code == 400
    assert db.writes("insert", "rfd_submissions") == []


@pytest.mark.parametrize("field,value", [("company", " "), ("phone", ""), ("products", []), ("email", "not-an-email")])
def test_rfd_validation_errors(db, field, value):
    assert client.post("/leads/submit-rfd", json={**RFD, field: value}).status_code == 422


def test_rfd_honeypot_stores_nothing(db):
    r = client.post("/leads/submit-rfd", json={**RFD, "website": "http://spam.example"})
    assert r.status_code == 200 and r.json()["success"] is True
    assert db.calls == []
    db.mails["rfd"].assert_not_called()


def test_rfd_database_failure_returns_generic_500(db):
    db.fail_on["leads"] = True
    r = client.post("/leads/submit-rfd", json=RFD)
    assert r.status_code == 500
    assert r.json()["detail"] == "Error processing RFD submission"


def test_rfd_is_rate_limited(db):
    codes = [client.post("/leads/submit-rfd", json=RFD).status_code for _ in range(6)]
    assert codes[:5] == [200] * 5 and codes[5] == 429


# --- public: contact form --------------------------------------------------------

def test_contact_creates_lead_and_message_and_emails(db):
    r = client.post("/leads/submit-contact", json=CONTACT)
    assert r.status_code == 200
    assert db.writes("upsert", "leads")[0]["source"] == "contact-form"
    msg = db.writes("insert", "contact_messages")[0]
    assert msg["subject"] == "Pricing" and msg["status"] == "new"
    db.mails["contact"].assert_called_once()


def test_contact_honeypot_and_failure(db):
    assert client.post("/leads/submit-contact", json={**CONTACT, "website": "x"}).status_code == 200
    assert db.calls == []
    db.fail_on["contact_messages"] = True
    r = client.post("/leads/submit-contact", json=CONTACT)
    assert r.status_code == 500 and r.json()["detail"] == "Failed to process contact submission"


# --- admin: lead listing and details ------------------------------------------------

LEADS = [
    {"id": 1, "name": "Pat", "email": "pat@acme.example", "company": "Acme", "status": "new", "source": "RFD Form", "created_at": "2026-10-01"},
    {"id": 2, "name": "Sam", "email": "sam@globex.example", "company": "Globex", "status": "contacted", "source": "contact-form", "created_at": "2026-10-05"},
]


@pytest.mark.parametrize("path", ["/leads/", "/leads/contact-messages", "/leads/1", "/leads/1/profile"])
def test_admin_reads_require_session(db, path):
    assert client.get(path).status_code == 401


def test_list_leads_filters_sorts_and_sanitizes_search(db, admin_headers):
    db.tables["leads"] = [dict(x) for x in LEADS]
    r = client.get("/leads/", params={"status_filter": "contacted"}, headers=admin_headers)
    assert [x["id"] for x in r.json()] == [2]

    r = client.get("/leads/", params={"sort_by": "created_at", "sort_order": "asc"}, headers=admin_headers)
    assert [x["id"] for x in r.json()] == [1, 2]

    client.get("/leads/", params={"search": "acme,status.eq.converted"}, headers=admin_headers)
    expression = [c for c in db.calls if c[0] == "or_"][-1][2]
    assert expression.count(",") == 2  # exactly the 3 intended ilike conditions


def test_list_leads_rejects_invalid_status_and_ignores_bad_sort(db, admin_headers):
    assert client.get("/leads/", params={"status_filter": "bogus"}, headers=admin_headers).status_code == 400
    assert client.get("/leads/", params={"sort_by": "password_hash", "sort_order": "sideways"}, headers=admin_headers).status_code == 200


def test_get_lead_found_missing_and_error(db, admin_headers):
    db.tables["leads"] = [{**LEADS[0], "phone": "1"}]
    assert client.get("/leads/1", headers=admin_headers).json()["email"] == "pat@acme.example"
    assert client.get("/leads/99", headers=admin_headers).status_code == 404
    db.fail_on["leads"] = True
    r = client.get("/leads/1", headers=admin_headers)
    assert r.status_code == 500 and "Traceback" not in r.text


def test_contact_messages_list_and_error_fallback(db, admin_headers):
    db.tables["contact_messages"] = [{"id": 1, "subject": "Hi"}]
    assert client.get("/leads/contact-messages", headers=admin_headers).json() == [{"id": 1, "subject": "Hi"}]
    db.fail_on["contact_messages"] = True
    assert client.get("/leads/contact-messages", headers=admin_headers).json() == []


def test_profile_builds_chronological_timeline(db, admin_headers):
    sid = "s-1"
    db.tables.update({
        "leads": [{**LEADS[0], "session_id": sid}],
        "engagement_logs": [{"id": 1, "lead_id": 1, "action": "RFD Submission", "details": "x", "created_at": "2026-10-03"}],
        "visitor_page_views": [{"session_id": sid, "product_id": 2, "viewed_at": "2026-10-01", "products": {"name": "Cybersecurity Shield"}}],
        "video_engagement_events": [{"session_id": sid, "product_id": 2, "event_type": "complete", "watch_duration_seconds": 30,
                                     "created_at": "2026-10-02", "products": {"name": "Cybersecurity Shield"}}],
        "lead_notes": [{"id": 1, "lead_id": 1, "note": "Called", "created_at": "2026-10-04", "admin_users": {"name": "Admin"}}],
    })
    body = client.get("/leads/1/profile", headers=admin_headers).json()
    assert [e["type"] for e in body["timeline"]] == ["Page View", "Demo Video", "RFD Submission"]
    assert "30s watched" in body["timeline"][1]["details"]
    assert body["notes"][0]["author"] == "Admin"
    assert client.get("/leads/99/profile", headers=admin_headers).status_code == 404


# --- admin: notes and status ------------------------------------------------------------

def test_create_note(db, admin_headers):
    db.tables["leads"] = [dict(LEADS[0])]
    r = client.post("/leads/1/notes", json={"note": "  Follow up Monday  "}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["note"] == "Follow up Monday"
    assert client.post("/leads/99/notes", json={"note": "x"}, headers=admin_headers).status_code == 404
    assert client.post("/leads/1/notes", json={"note": "   "}, headers=admin_headers).status_code == 422


def test_status_change_updates_lead_syncs_rfd_and_audits(db, admin_headers):
    db.tables["leads"] = [dict(LEADS[0])]
    db.tables["rfd_submissions"] = [{"id": 5, "lead_id": 1, "status": "pending"}]
    r = client.patch("/leads/1/status", json={"status": "Contacted"}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["old_status"] == "new" and r.json()["status"] == "contacted"
    assert db.tables["rfd_submissions"][0]["status"] == "contacted"
    assert db.writes("insert", "lead_status_audit")[0]["new_status"] == "contacted"


def test_status_unchanged_invalid_and_missing(db, admin_headers):
    db.tables["leads"] = [dict(LEADS[0])]
    assert client.patch("/leads/1/status", json={"status": "new"}, headers=admin_headers).json()["message"] == "Status unchanged"
    assert db.writes("insert", "lead_status_audit") == []
    assert client.patch("/leads/1/status", json={"status": "won"}, headers=admin_headers).status_code == 422
    assert client.patch("/leads/99/status", json={"status": "contacted"}, headers=admin_headers).status_code == 404
