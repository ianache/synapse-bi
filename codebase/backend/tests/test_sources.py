import json
from pathlib import Path
import os

from fastapi.testclient import TestClient
import pytest

from conftest import login
from synapse_api.app import create_app
from synapse_api.errors import ApiError


def body():
    return dict(host="127.0.0.1", port=55432, database="bi_analytics", username="bi_reader_global",
                password="test-secret-never-visible", schemas=["gold"], tlsMode="disable", laboratory=True)


@pytest.fixture
def admin(client):
    return login(client, "data-admin")


@pytest.fixture
def fake(client):
    def connect(settings, connection, password, metadata=False):
        assert password == body()["password"]
        result = {"serverVersion": 180006, "schemas": ["gold"]}
        if metadata:
            result["objects"] = [{"schema": "gold", "name": "fact_sales", "kind": "table", "columns": [], "constraints": [], "comment": None}]
        return result
    client.app.state.sources.connector = connect
    return connect


def register(client, admin):
    probe = client.post("/api/v1/sources/test", json=body(), headers=admin)
    assert probe.status_code == 200, probe.text
    response = client.post("/api/v1/sources", json={**body(), "testId": probe.json()["testId"], "name": "Retail Gold"}, headers=admin)
    assert response.status_code == 201, response.text
    return response.json()


def test_requires_admin_and_tenant_isolation(client, admin, analyst, fake):
    assert client.get("/api/v1/sources").status_code == 401
    assert client.get("/api/v1/sources", headers=analyst).status_code == 403
    source = register(client, admin)
    other = login(client, "other-data-admin")
    assert client.get("/api/v1/sources", headers=other).json() == {"items": []}
    for suffix in ["", "/observations"]:
        assert client.get(f'/api/v1/sources/{source["id"]}{suffix}', headers=other).status_code == 404
    assert client.post(f'/api/v1/sources/{source["id"]}/test', headers=other).status_code == 404


def test_server_proof_bound_to_connection_identity_and_expiry(client, admin, fake):
    probe = client.post("/api/v1/sources/test", json=body(), headers=admin).json()
    save = {**body(), "testId": probe["testId"], "name": "Retail Gold"}
    assert client.post("/api/v1/sources", json={**save, "database": "other"}, headers=admin).status_code == 409
    assert client.post("/api/v1/sources", json=save, headers=login(client, "other-data-admin")).status_code == 409
    with client.app.state.database.connect(write=True) as conn:
        conn.execute("UPDATE source_probes SET expires_at='2000-01-01'")
    assert client.post("/api/v1/sources", json=save, headers=admin).status_code == 409


def test_secrets_encrypted_persistent_and_never_returned(client, admin, fake, settings):
    source = register(client, admin)
    assert "password" not in json.dumps(source).lower()
    assert source["credentialConfigured"]
    with client.app.state.database.connect() as conn:
        stored = conn.execute("SELECT secret FROM sources").fetchone()[0]
        assert body()["password"].encode() not in stored
    assert body()["password"].encode() not in settings.database_path.read_bytes()
    with TestClient(create_app(settings), client=("127.0.0.1", 50000)) as restarted:
        restarted.app.state.sources.connector = fake
        headers = login(restarted, "data-admin")
        assert restarted.post(f'/api/v1/sources/{source["id"]}/test', headers=headers).status_code == 200


def test_snapshot_history_failure_and_rotation(client, admin, fake):
    source = register(client, admin)
    path = f'/api/v1/sources/{source["id"]}'
    snapshot = client.post(path + "/observations", headers=admin)
    assert snapshot.status_code == 201
    assert snapshot.json()["tables"] == 1
    observation_id = snapshot.json()["id"]
    def failed(*args, **kwargs):
        raise ApiError(422, "connection_failed", "Conexión no disponible.")
    client.app.state.sources.connector = failed
    assert client.post(path + "/observations", headers=admin).status_code == 422
    history = client.get(path + "/observations", headers=admin).json()["items"]
    assert [r["status"] for r in history] == ["failed", "success"]
    assert client.get(path + "/observations/" + observation_id, headers=admin).json()["snapshot"]["objects"]
    client.app.state.sources.connector = fake
    probe = client.post("/api/v1/sources/test", json=body(), headers=admin).json()
    update = {**body(), "name": "Retail Gold nuevo", "testId": probe["testId"]}
    assert client.put(path + "/connection", json=update, headers=admin).status_code == 412
    updated = client.put(path + "/connection", json=update, headers={**admin, "If-Match": '"1"'})
    assert updated.status_code == 200
    assert updated.json()["version"] == 2
    assert client.get(path + "/observations/" + observation_id, headers=admin).json()["sourceVersion"] == 1


def test_denies_unapproved_destinations_and_unsafe_inputs(client, admin):
    for changed in [{"host": "169.254.169.254"}, {"port": 5432}, {"host": "/tmp"}, {"schemas": ["pg_catalog"]}, {"options": "-c log_statement=all"}, {"laboratory": False}]:
        response = client.post("/api/v1/sources/test", json={**body(), **changed}, headers=admin)
        assert response.status_code == 422
        assert body()["password"] not in response.text


@pytest.mark.skipif(os.getenv("BI_TEST_POSTGRES") != "true", reason="Explicit local PostgreSQL integration opt-in")
def test_real_postgres_observation(client, admin):
    password_path = Path(os.getenv("BI_LAB_READER_PASSWORD_FILE", str(Path(__file__).parents[2] / "case-study/.docker-secrets/reader_global_password.txt")))
    data = {**body(), "password": password_path.read_text().strip()}
    tested = client.post("/api/v1/sources/test", json=data, headers=admin)
    assert tested.status_code == 200
    saved = client.post("/api/v1/sources", json={**data, "testId": tested.json()["testId"], "name": "Real PostgreSQL lab"}, headers=admin)
    assert saved.status_code == 201
    observed = client.post(f'/api/v1/sources/{saved.json()["id"]}/observations', headers=admin)
    assert observed.status_code == 201
    snapshot = observed.json()
    assert (snapshot["tables"], snapshot["views"]) == (12, 4)
    fact = next(o for o in snapshot["snapshot"]["objects"] if o["name"] == "fact_sales")
    assert len(fact["columns"]) == 16
    assert len([c for c in fact["constraints"] if c["kind"] == "f"]) == 6
    assert next(c for c in fact["constraints"] if c["kind"] == "p")["columns"] == ["tenant_id", "sales_line_key"]
