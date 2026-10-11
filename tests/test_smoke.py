"""Smoke tests: the app boots and admin-only endpoints require a valid session."""
import os
from datetime import datetime, timedelta, timezone
from unittest import mock

import jwt
import pytest
from fastapi.testclient import TestClient

import main
from app.database import get_db

client = TestClient(main.app)

PROTECTED = [
    "/leads/",
    "/leads/contact-messages",
    "/leads/1/profile",
    "/analytics/dashboard",
]


def make_session(secret=None, **overrides):
    """Build a session cookie the way app/lib/session.ts does."""
    payload = {
        "userId": "1",
        "email": "admin@example.com",
        "name": "Admin",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        **overrides,
    }
    return jwt.encode(payload, secret or os.environ["SESSION_SECRET"], algorithm="HS256")


def test_root():
    assert client.get("/").status_code == 200


@pytest.mark.parametrize("path", PROTECTED)
def test_protected_requires_session(path):
    assert client.get(path).status_code == 401


@pytest.mark.parametrize("path", PROTECTED)
def test_protected_rejects_forged_session(path):
    forged = make_session(secret="x" * 40)
    assert client.get(path, headers={"Cookie": f"session={forged}"}).status_code == 401


def test_protected_rejects_expired_session():
    expired = make_session(exp=datetime.now(timezone.utc) - timedelta(minutes=1))
    assert client.get("/leads/", headers={"Cookie": f"session={expired}"}).status_code == 401


def test_valid_session_is_accepted():
    db = mock.MagicMock()
    db.table.return_value.select.return_value.order.return_value.execute.return_value.data = []
    main.app.dependency_overrides[get_db] = lambda: db
    try:
        r = client.get("/leads/", headers={"Cookie": f"session={make_session()}"})
    finally:
        main.app.dependency_overrides.clear()
    assert r.status_code == 200
    assert r.json() == []
