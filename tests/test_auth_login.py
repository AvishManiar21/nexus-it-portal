"""Admin login: correct/incorrect credentials and bcrypt's 72-byte input limit."""
from unittest import mock

import bcrypt
import pytest
from fastapi.testclient import TestClient

import main
from app.database import get_db

client = TestClient(main.app)
PASSWORD = "correct horse battery staple"


@pytest.fixture(autouse=True)
def db():
    main.app.state.limiter.reset()  # login is rate-limited per IP; isolate tests
    fake = mock.MagicMock()
    fake.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"id": 1, "email": "admin@example.com", "name": "Admin",
         "password_hash": bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt(rounds=4)).decode()}
    ]
    main.app.dependency_overrides[get_db] = lambda: fake
    yield fake
    main.app.dependency_overrides.clear()


def login(email="admin@example.com", password=PASSWORD):
    return client.post("/auth/login", json={"email": email, "password": password})


def test_correct_password_logs_in():
    r = login()
    assert r.status_code == 200
    assert r.json()["user"]["email"] == "admin@example.com"


def test_wrong_password_is_rejected():
    r = login(password="wrong password")
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_unknown_email_gets_the_same_message(db):
    db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    r = login(email="nobody@example.com")
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


@pytest.mark.parametrize("password", ["a" * 73, "é" * 40, "x" * 1000])
def test_password_over_72_bytes_is_rejected_not_500(password):
    # bcrypt>=5 raises ValueError for >72 bytes; login must answer 401, not crash
    r = login(password=password)
    assert r.status_code == 401
