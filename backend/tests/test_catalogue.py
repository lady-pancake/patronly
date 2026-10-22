"""Seed and GraphQL tests against a real Postgres.

They run when TEST_DATABASE_URL points at a database already migrated to head
(CI does this); otherwise they are skipped.
"""

import asyncio
import os

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db import session as db
from app.seed import load_catalogue, load_studio_template, seed_catalogue, seed_studio_template

TEST_DB = os.environ.get("TEST_DATABASE_URL")
pytestmark = pytest.mark.skipif(not TEST_DB, reason="TEST_DATABASE_URL not set")


def _seed() -> tuple[int, int]:
    async def run():
        try:
            async for session in db.get_session():
                await seed_studio_template(session, load_studio_template())
                return await seed_catalogue(session, load_catalogue())
        finally:
            await db.dispose_engine()

    return asyncio.run(run())


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DB)
    get_settings.cache_clear()
    _seed()
    from app.main import app

    with TestClient(app) as c:
        yield c
    get_settings.cache_clear()


def gql(client, query: str, **variables):
    res = client.post("/graphql", json={"query": query, "variables": variables})
    assert res.status_code == 200
    body = res.json()
    assert "errors" not in body, body.get("errors")
    return body["data"]


def test_seed_is_idempotent(client):
    total = len(load_catalogue())
    assert _seed() == (0, total)
    data = gql(client, "{ artists(limit: 200) { slug works { title } } }")
    slugs = [a["slug"] for a in data["artists"]]
    assert len(slugs) == len(set(slugs)) >= total
    june = next(a for a in data["artists"] if a["slug"] == "june")
    assert len(june["works"]) == 4


def test_artist_by_slug(client):
    data = gql(
        client,
        """query ($slug: String!) {
          artist(slug: $slug) {
            displayName medium priceMin priceMax availability bio tags
            works { title material imageUrl }
            reviews { quote author }
          }
        }""",
        slug="june",
    )
    a = data["artist"]
    assert a["displayName"] == "June Abernethy"
    assert a["medium"] == "Painting"
    assert (a["priceMin"], a["priceMax"]) == (250, 1800)
    assert a["availability"] == "OPEN"
    assert a["works"][0]["imageUrl"] == "/images/works/june-1.jpg"
    assert len(a["reviews"]) == 3
    assert "\n\n" in a["bio"]


def test_unknown_slug_is_null(client):
    assert gql(client, '{ artist(slug: "nobody") { slug } }')["artist"] is None


def test_filter_by_medium(client):
    data = gql(client, '{ artists(limit: 200, medium: "Jewelry") { medium } }')
    assert data["artists"] and {a["medium"] for a in data["artists"]} == {"Jewelry"}


def test_studio_template_has_sample_prices(client):
    data = gql(client, "{ studioTemplate { draft account } }")["studioTemplate"]
    draft = data["draft"]
    assert draft["name"] == "Alex Ward"
    assert [(t["name"], t["from"], t["to"]) for t in draft["types"]] == [
        ("Small", "500", "900"),
        ("Medium", "3500", "5500"),
        ("Large", "12000", "20000"),
    ]
    assert data["account"]["holder"] == "Alex Ward"
    assert gql(client, '{ studioTemplate(slug: "nope") { draft } }')["studioTemplate"] is None


def test_prune_removes_studios_not_in_the_file(client):
    from app.db.models import Artist
    from app.seed import prune_catalogue

    async def run():
        try:
            async for session in db.get_session():
                session.add(Artist(slug="gone", display_name="Gone"))
                await session.commit()
                return await prune_catalogue(session, load_catalogue())
        finally:
            await db.dispose_engine()

    assert asyncio.run(run()) == ["gone"]
    assert gql(client, '{ artist(slug: "gone") { slug } }')["artist"] is None
