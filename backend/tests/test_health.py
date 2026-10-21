import pytest
from fastapi.testclient import TestClient

from app.config import get_settings


@pytest.fixture
def client(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "")
    get_settings.cache_clear()
    from app.main import app

    with TestClient(app) as c:
        yield c
    get_settings.cache_clear()


def test_rest_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["database"] == "not_configured"


def test_graphql_health(client):
    res = client.post("/graphql", json={"query": "{ health { status version database } }"})
    assert res.status_code == 200
    body = res.json()
    assert "errors" not in body
    assert body["data"]["health"]["status"] == "ok"


def test_database_url_is_normalised_to_asyncpg(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://u:p@host:5432/postgres")
    get_settings.cache_clear()
    assert get_settings().database_url == "postgresql+asyncpg://u:p@host:5432/postgres"
    get_settings.cache_clear()
