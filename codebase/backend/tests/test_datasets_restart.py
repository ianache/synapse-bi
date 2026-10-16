"""Integration acceptance: app restart, offline connector, persisted source snapshot."""
from fastapi.testclient import TestClient

from conftest import login
from dataset_fixtures import seed_observation, draft_body
from synapse_api.app import create_app


def test_new_app_recovers_dataset_and_saves_with_connector_down(settings):
    with TestClient(create_app(settings), client=("127.0.0.1", 51001)) as first:
        data = draft_body(seed_observation(first.app.state.database))
        headers = login(first, "data-admin") | {"Idempotency-Key": "restart"}
        def offline(*args, **kwargs):
            raise AssertionError("Dataset operations cannot invoke a connector")
        first.app.state.sources.connector = offline
        response = first.post('/api/v1/datasets', json=data, headers=headers)
        assert response.status_code == 201
        original = response.json()
    with TestClient(create_app(settings), client=("127.0.0.1", 51002)) as second:
        headers = login(second, "data-admin")
        second.app.state.sources.connector = offline
        assert second.get(f'/api/v1/datasets/{original["id"]}', headers=headers).json() == original
        changed = second.put(f'/api/v1/datasets/{original["id"]}', json=data | {"description": "After restart"}, headers=headers | {"If-Match": '"1"'})
        assert changed.status_code == 200
        assert changed.json()["description"] == "After restart"
