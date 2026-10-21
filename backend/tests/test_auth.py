"""The password gate and guest passes over GraphQL against a real Postgres.

Skipped unless TEST_DATABASE_URL is set.
"""

import asyncio
import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.auth.guest import issue_pass
from app.config import get_settings
from app.db.models import Guest

TEST_DB = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not TEST_DB, reason="TEST_DATABASE_URL not set")

ME = "{ me { name roles { role entitlements } } }"
START = """mutation($name: String!, $pw: String!) {
  startVisit(name: $name, password: $pw) { token viewer { name } }
}"""


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DB)
    monkeypatch.setenv("GUEST_PASSWORD", "let-me-in")
    get_settings.cache_clear()
    from app.main import app

    with TestClient(app) as c:
        yield c
    get_settings.cache_clear()


def gql(client, query, tok=None, **variables):
    headers = {"Authorization": f"Bearer {tok}", "User-Agent": "pytest"} if tok else {}
    return client.post("/graphql", json={"query": query, "variables": variables}, headers=headers)


def guests_named(name):
    # A separate engine: the app's engine belongs to the test client's event loop.
    async def run():
        engine = create_async_engine(TEST_DB, poolclass=NullPool)
        try:
            async with AsyncSession(engine) as session:
                return list(await session.scalars(select(Guest).where(Guest.name == name)))
        finally:
            await engine.dispose()

    return asyncio.run(run())


def test_without_a_pass_there_is_no_guest(client):
    assert gql(client, ME).json()["data"]["me"] is None
    assert gql(client, ME, "not-a-token").json()["data"]["me"] is None
    assert gql(client, ME, issue_pass(uuid.uuid4())).json()["data"]["me"] is None


def test_wrong_password_is_refused_and_not_logged(client):
    name = f"Wrong {uuid.uuid4()}"
    res = gql(client, START, name=name, pw="nope").json()
    assert res["data"] is None
    assert res["errors"][0]["message"] == "That password isn't right."
    assert guests_named(name) == []


def test_visit_is_logged_and_pass_works(client):
    name = f"Ana {uuid.uuid4()}"
    res = gql(client, START, name=f"  {name} ", pw="let-me-in").json()["data"]["startVisit"]
    assert res["viewer"]["name"] == name
    [guest] = guests_named(name)
    assert guest.created_at is not None

    me = gql(client, ME, res["token"]).json()["data"]["me"]
    roles = {r["role"]: r["entitlements"] for r in me["roles"]}
    assert set(roles) == {"PATRON", "ARTIST"}
    assert "VIEW_DASHBOARD" in roles["ARTIST"]
    assert "VIEW_DASHBOARD" not in roles["PATRON"]
    assert "MANAGE_ANY_STUDIO" not in roles["ARTIST"]


def test_name_is_required(client):
    res = gql(client, START, name="   ", pw="let-me-in").json()
    assert res["errors"][0]["message"] == "Please tell us your name."
