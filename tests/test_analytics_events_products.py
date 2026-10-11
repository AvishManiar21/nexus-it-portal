"""Analytics dashboard, tracking events and product catalog."""
from unittest import mock

import asyncpg
import pytest
from fastapi.testclient import TestClient

import main
import app.routers.analytics as A
import app.routers.events as E
from app.database import get_db
from tests.fakes import FakePool, FakeSupabase

client = TestClient(main.app)
SESSION = "11111111-2222-3333-4444-555555555555"


def analytics_handler(views=12, starts=4, completes=3, total=10, converted=6):
    def handle(sql, _args):
        s = " ".join(sql.split())
        if "FROM leads WHERE created_at" in s:
            return 2
        if "source = 'RFD Form'" in s:
            return 9
        if s.startswith("SELECT COUNT(*) FROM leads"):
            return total
        if "FROM contact_messages" in s:
            return 3
        if "SUM(CASE WHEN status" in s:
            return {"total": total, "converted": converted}
        if "GROUP BY source" in s:
            return [{"source": "RFD Form", "count": 9}, {"source": "contact-form", "count": 1}]
        if "visitor_page_views" in s:
            return {"product_id": 1, "name": "Cloud Infrastructure Suite", "view_count": views}
        if "video_engagement_events" in s:
            return [{"product_id": 1, "name": "Cloud Infrastructure Suite", "starts": starts, "completes": completes},
                    {"product_id": 2, "name": "AI Analytics Dashboard", "starts": 0, "completes": 0}]
        raise AssertionError(f"unexpected query: {s}")
    return handle


def with_pool(handler):
    async def get_pool():
        return FakePool(handler)
    return get_pool


# --- analytics -----------------------------------------------------------------

def test_dashboard_requires_session():
    assert client.get("/analytics/dashboard").status_code == 401


def test_dashboard_metrics(admin_headers):
    with mock.patch.object(A, "get_pool", with_pool(analytics_handler())):
        body = client.get("/analytics/dashboard", headers=admin_headers).json()
    assert body["total_leads"] == 10 and body["new_leads_this_week"] == 2
    assert body["total_rfd_submissions"] == 9 and body["total_contact_messages"] == 3
    assert body["conversion_rate"] == pytest.approx(0.6)
    assert body["most_viewed_product"] == {"product_id": 1, "name": "Cloud Infrastructure Suite", "view_count": 12}
    rates = {r["name"]: r["completion_rate"] for r in body["completion_rates_by_product"]}
    assert rates == {"Cloud Infrastructure Suite": pytest.approx(0.75), "AI Analytics Dashboard": 0.0}  # no divide-by-zero
    assert body["leads_by_source"][0] == {"source": "RFD Form", "count": 9}


def test_dashboard_with_no_data(admin_headers):
    with mock.patch.object(A, "get_pool", with_pool(analytics_handler(views=0, total=0, converted=0))):
        body = client.get("/analytics/dashboard", headers=admin_headers).json()
    assert body["most_viewed_product"] == {"product_id": None, "name": None, "view_count": 0}
    assert body["conversion_rate"] == 0.0


def test_dashboard_database_error_is_generic_500(admin_headers):
    def boom(sql, args):
        raise asyncpg.PostgresError("SECRET-DETAIL")
    with mock.patch.object(A, "get_pool", with_pool(boom)):
        r = client.get("/analytics/dashboard", headers=admin_headers)
    assert r.status_code == 500 and "SECRET-DETAIL" not in r.text


# --- tracking events ---------------------------------------------------------------

def insert_handler(captured):
    def handle(sql, args):
        captured.append((" ".join(sql.split()), args))
        return {"id": 42}
    return handle


def test_product_view_is_recorded():
    captured = []
    with mock.patch.object(E, "get_pool", with_pool(insert_handler(captured))):
        r = client.post("/events/product-view", json={"session_id": SESSION, "product_id": 2})
    assert r.json() == {"status": "ok", "id": 42}
    assert "INSERT INTO visitor_page_views" in captured[0][0] and captured[0][1] == (SESSION, 2)


def test_video_event_is_recorded_and_validated():
    captured = []
    with mock.patch.object(E, "get_pool", with_pool(insert_handler(captured))):
        ok = client.post("/events/video-engagement", json={"session_id": SESSION, "product_id": 1, "event_type": "complete", "watch_duration_seconds": 30})
        bad = client.post("/events/video-engagement", json={"session_id": SESSION, "product_id": 1, "event_type": "pause"})
    assert ok.json()["id"] == 42 and captured[0][1] == (SESSION, 1, "complete", 30)
    assert bad.status_code == 400 and len(captured) == 1


@pytest.mark.parametrize("path,payload", [
    ("/events/product-view", {"session_id": SESSION, "product_id": 2}),
    ("/events/video-engagement", {"session_id": SESSION, "product_id": 1, "event_type": "start"}),
])
def test_event_database_error_is_generic_500(path, payload):
    def boom(sql, args):
        raise asyncpg.PostgresError("SECRET-DETAIL")
    with mock.patch.object(E, "get_pool", with_pool(boom)):
        r = client.post(path, json=payload)
    assert r.status_code == 500 and "SECRET-DETAIL" not in r.text


def test_events_are_rate_limited():
    with mock.patch.object(E, "get_pool", with_pool(insert_handler([]))):
        codes = [client.post("/events/product-view", json={"session_id": SESSION, "product_id": 1}).status_code for _ in range(121)]
    assert codes[:120] == [200] * 120 and codes[120] == 429


# --- products -----------------------------------------------------------------------

@pytest.fixture
def products_db():
    fake = FakeSupabase({"products": [{"id": 1, "name": "Cloud Infrastructure Suite"}, {"id": 2, "name": "Cybersecurity Shield"}]})
    main.app.dependency_overrides[get_db] = lambda: fake
    yield fake
    main.app.dependency_overrides.clear()


def test_products_list_and_detail(products_db):
    assert [p["id"] for p in client.get("/products/").json()] == [1, 2]
    assert client.get("/products/2").json()["name"] == "Cybersecurity Shield"
    assert client.get("/products/99").status_code == 404
