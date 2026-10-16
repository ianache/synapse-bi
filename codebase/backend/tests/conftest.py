from pathlib import Path

from fastapi.testclient import TestClient
import pytest

from synapse_api.app import create_app
from synapse_api.config import Settings


@pytest.fixture
def settings(tmp_path: Path):
    return Settings(database_path=tmp_path / "test.db", environment="test", auth_mode="development", seed_demo=True)


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings), client=("127.0.0.1", 50001)) as client:
        yield client


def login(client, persona="analyst"):
    response = client.post("/api/v1/auth/dev-session", json={"persona": persona})
    assert response.status_code == 200
    return {"Authorization": f'Bearer {response.json()["accessToken"]}'}


@pytest.fixture
def analyst(client):
    return login(client)
