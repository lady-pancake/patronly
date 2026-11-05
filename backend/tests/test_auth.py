"""Guest visits and passes over GraphQL against a real Postgres.

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
from app.config import Settings, get_settings
from app.db.models import Guest

TEST_DB = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not TEST_DB, reason="TEST_DATABASE_URL not set")

ME = "{ me { name roles { role entitlements } } }"
START = """mutation($name: String!) {
  startVisit(name: $name) { token viewer { name } }
}"""
START_ANON = "mutation { startVisit { token viewer { name } } }"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DB)
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
        # Same driver the app uses: CI passes a plain postgresql:// URL.
        url = Settings.use_asyncpg_driver(TEST_DB)
        engine = create_async_engine(url, poolclass=NullPool)
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


def test_visit_is_logged_and_pass_works(client):
    name = f"Ana {uuid.uuid4()}"
    res = gql(client, START, name=f"  {name} ").json()["data"]["startVisit"]
    assert res["viewer"]["name"] == name
    [guest] = guests_named(name)
    assert guest.created_at is not None

    me = gql(client, ME, res["token"]).json()["data"]["me"]
    roles = {r["role"]: r["entitlements"] for r in me["roles"]}
    assert set(roles) == {"PATRON", "ARTIST"}
    assert "VIEW_DASHBOARD" in roles["ARTIST"]
    assert "VIEW_DASHBOARD" not in roles["PATRON"]
    assert "MANAGE_ANY_STUDIO" not in roles["ARTIST"]


def test_no_name_or_password_is_needed(client):
    res = gql(client, START_ANON).json()["data"]["startVisit"]
    assert res["viewer"]["name"] == "Guest"
    assert gql(client, ME, res["token"]).json()["data"]["me"]["name"] == "Guest"
    blank = gql(client, START, name="   ").json()["data"]["startVisit"]
    assert blank["viewer"]["name"] == "Guest"
