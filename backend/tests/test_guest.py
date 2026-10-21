import uuid

import pytest

from app.auth import guest
from app.config import get_settings


@pytest.fixture(autouse=True)
def settings(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@localhost/db")
    monkeypatch.delenv("GUEST_PASSWORD", raising=False)
    monkeypatch.delenv("GUEST_TOKEN_SECRET", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_built_in_password():
    assert guest.check_password("hireJulietteGarvey!")
    assert not guest.check_password("hirejuliettegarvey!")
    assert not guest.check_password("")


def test_password_override(monkeypatch):
    monkeypatch.setenv("GUEST_PASSWORD", "other")
    get_settings.cache_clear()
    assert guest.check_password("other")
    assert not guest.check_password("hireJulietteGarvey!")


def test_pass_round_trip_and_forgery():
    gid = uuid.uuid4()
    token = guest.issue_pass(gid)
    assert guest.read_pass(token) == gid
    assert guest.read_pass(token[:-2] + "xx") is None
    assert guest.read_pass("garbage") is None


def test_pass_from_another_database_is_rejected(monkeypatch):
    token = guest.issue_pass(uuid.uuid4())
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:other@localhost/db")
    get_settings.cache_clear()
    assert guest.read_pass(token) is None
