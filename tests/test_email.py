"""Tests for app/services/email.py: recipients, escaping, and failure handling."""
import email
from unittest import mock

import pytest

from app.services import email as mail


class FakeSMTP:
    """Records what would have been sent instead of talking to a server."""

    sent = []

    def __init__(self, *args):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def starttls(self):
        pass

    def login(self, *args):
        pass

    def sendmail(self, envelope_sender, recipients, raw):
        FakeSMTP.sent.append((envelope_sender, recipients, email.message_from_string(raw)))


@pytest.fixture(autouse=True)
def smtp(monkeypatch):
    FakeSMTP.sent = []
    monkeypatch.setattr(mail, "SMTP_USERNAME", "portal@example.com")
    monkeypatch.setattr(mail, "SMTP_PASSWORD", "app-password")
    monkeypatch.setattr(mail, "FROM_EMAIL", "portal@example.com")
    monkeypatch.setattr(mail.smtplib, "SMTP", FakeSMTP)


def html_part(msg):
    return next(p for p in msg.walk() if p.get_content_type() == "text/html").get_payload(decode=True).decode()


def test_admin_alert_bccs_admins_and_escapes_visitor_input():
    db = mock.MagicMock()
    db.table.return_value.select.return_value.execute.return_value.data = [
        {"email": "a1@example.com"}, {"email": "a2@example.com"}, {"email": None},
    ]
    with mock.patch.object(mail, "get_db", return_value=db):
        mail.send_admin_rfd_alert(
            company='<a href="https://evil.example">Verify login</a>',
            contact_person="Eve\r\nBcc: victim@example.com",
            contact_email="eve@example.com",
            phone="<b>1</b>",
            products=["<img src=x>"],
            lead_id=7,
        )

    assert len(FakeSMTP.sent) == 1
    envelope, recipients, msg = FakeSMTP.sent[0]
    assert envelope == "portal@example.com"
    assert recipients == ["a1@example.com", "a2@example.com"]
    assert "victim" not in (msg["Bcc"] or "")
    assert "\n" not in msg["Subject"]
    body = html_part(msg)
    assert "<a href" not in body and "<img" not in body and "<b>1" not in body
    assert "&lt;a href=&quot;https://evil.example&quot;&gt;" in body


def test_visitor_rfd_confirmation_goes_only_to_visitor_and_escapes():
    mail.send_visitor_rfd_confirmation(
        visitor_name="<script>x</script>", visitor_email="v@example.com",
        company="Acme", products=["Cloud"],
    )
    _, recipients, msg = FakeSMTP.sent[0]
    assert recipients == ["v@example.com"]
    assert msg["To"] == "v@example.com"
    assert "<script>" not in html_part(msg)


def test_contact_confirmation_escapes_subject():
    mail.send_visitor_contact_confirmation(
        visitor_name="Vic", visitor_email="v@example.com", subject_line="<i>hi</i>",
    )
    _, recipients, msg = FakeSMTP.sent[0]
    assert recipients == ["v@example.com"]
    assert "&lt;i&gt;hi&lt;/i&gt;" in html_part(msg)


def test_no_smtp_credentials_sends_nothing(monkeypatch):
    monkeypatch.setattr(mail, "SMTP_PASSWORD", None)
    mail.send_visitor_contact_confirmation("Vic", "v@example.com", "hi")
    assert FakeSMTP.sent == []


def test_smtp_failure_is_swallowed(monkeypatch):
    def boom(*args):
        raise OSError("connection refused")

    monkeypatch.setattr(mail.smtplib, "SMTP", boom)
    # Must not raise: these run as background tasks
    mail.send_visitor_rfd_confirmation("Vic", "v@example.com", "Acme", [])
