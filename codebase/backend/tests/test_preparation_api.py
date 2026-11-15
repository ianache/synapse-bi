from datetime import datetime, timedelta, timezone

import jwt
import json

from conftest import login
from dataset_fixtures import draft_body, seed_observation


def scoped(client, scopes, tenant="demo-global"):
    now = datetime.now(timezone.utc)
    token = jwt.encode({"sub": "de", "tenant_id": tenant, "scope": " ".join(scopes),
                        "iss": "synapse-development", "aud": client.app.state.auth.settings.audience,
                        "iat": now, "exp": now + timedelta(hours=1)}, client.app.state.auth.dev_secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_pipeline_creation_registers_prepared_catalog_entry_and_enforces_scopes(client, monkeypatch):
    origin = seed_observation(client.app.state.database)
    with client.app.state.database.connect(write=True) as connection:
        connection.execute("UPDATE sources SET connection=? WHERE tenant_id=? AND id=?",
                           (json.dumps({"host": "127.0.0.1", "port": 5432, "database": "bi_analytics",
                                        "username": "reader", "tlsMode": "disable", "laboratory": True,
                                        "schemas": ["gold"]}), "demo-global", origin.source_id))
    data = draft_body(origin) | {"name": "Ventas entrada"}
    response = client.post("/api/v1/datasets", json=data, headers=login(client, "data-admin") | {"Idempotency-Key": "input"})
    assert response.status_code == 201
    payload = {"sourceId": origin.source_id, "inputDatasetId": response.json()["id"],
               "preparedDatasetName": "Ventas preparadas", "enabled": False}
    assert client.post("/api/v1/preparation-pipelines", json=payload, headers=login(client)).status_code == 403
    for scopes in ({"datasets:write"}, {"sources:read"}):
        assert client.post("/api/v1/preparation-pipelines", json=payload, headers=scoped(client, scopes)).status_code == 403
    admin = login(client, "data-admin")
    created = client.post("/api/v1/preparation-pipelines", json=payload, headers=admin)
    assert created.status_code == 201, created.text
    pipeline = created.json()
    assert client.post("/api/v1/preparation-pipelines", json=payload, headers=admin).status_code == 409
    second = client.post("/api/v1/preparation-pipelines",
                         json=payload | {"preparedDatasetName": "Ventas preparadas auditoría"}, headers=admin)
    assert second.status_code == 201, second.text
    assert second.json()["preparedDatasetId"] != pipeline["preparedDatasetId"]
    monkeypatch.setattr(client.app.state.datasets, "materialization_projector", lambda user, ids: {
        dataset_id: {"schema": "prepared", "relation": "current_sales_state"} for dataset_id in ids
    })
    catalog = client.get("/api/v1/datasets/" + pipeline["preparedDatasetId"], headers=admin)
    assert catalog.status_code == 200
    assert catalog.json()["kind"] == "prepared"
    assert catalog.json()["registrationStatus"] == "draft"
    assert catalog.json()["materialization"]["latestVersionId"] is None
    assert client.get("/api/v1/preparation-pipelines", headers=login(client)).status_code == 403
    listed_ids = {item["id"] for item in client.get("/api/v1/preparation-pipelines", headers=admin).json()["items"]}
    assert listed_ids == {pipeline["id"], second.json()["id"]}
    foreign = login(client, "other-data-admin")
    assert client.get("/api/v1/preparation-pipelines", headers=foreign).json()["items"] == []


def test_run_routes_enforce_scopes_and_sanitize_through_service_boundary(client, monkeypatch):
    service = client.app.state.preparation
    sentinel = {"id": "run-1", "status": "quality_rejected", "errorCode": "cdc_quality_rejected",
                "sanitizedError": "Lote rechazado.", "qualityResults": {"rejectedCount": 1}}
    monkeypatch.setattr(service, "execute_manual", lambda *args, **kwargs: sentinel)
    monkeypatch.setattr(service, "list_runs", lambda *args, **kwargs: {"items": [sentinel], "total": 1, "limit": 50, "offset": 0})
    monkeypatch.setattr(service, "get_run", lambda *args, **kwargs: sentinel)
    monkeypatch.setattr(service, "retry_run", lambda *args, **kwargs: sentinel)
    body = {"pipelineId": "pipeline-1", "events": [{"sourceEventId": "ev-1"}]}
    read_only = scoped(client, {"datasets:read"})
    write = scoped(client, {"datasets:write", "sources:read"})
    assert client.post("/api/v1/preparation-runs", json=body, headers=read_only).status_code == 403
    assert client.post("/api/v1/preparation-runs", json=body, headers=write).status_code == 201
    assert client.get("/api/v1/preparation-runs", headers=write).status_code == 403
    assert "errorCode" not in client.get("/api/v1/preparation-runs", headers=read_only).json()["items"][0]
    assert "sanitizedError" not in client.get("/api/v1/preparation-runs/run-1", headers=read_only).json()
    assert client.post("/api/v1/preparation-runs/run-1/retry", headers=read_only).status_code == 403
    assert client.post("/api/v1/preparation-runs/run-1/retry", headers=write).status_code == 201


def test_preparation_batch_body_is_bounded(client):
    response = client.post("/api/v1/preparation-runs", content=b" " * (1_048_577),
                           headers=login(client, "data-admin") | {"Content-Type": "application/json"})
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "body_too_large"
