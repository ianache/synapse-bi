import asyncio
import json
from datetime import datetime, timedelta, timezone

import jwt
import pytest

from conftest import login
from dataset_fixtures import seed_observation, draft_body


def headers(client, scopes=None, tenant="demo-global"):
    if scopes is None:
        return login(client, "data-admin") | {"Idempotency-Key": "http-key"}
    now = datetime.now(timezone.utc)
    token = jwt.encode({"sub": "limited", "tenant_id": tenant, "scope": " ".join(scopes),
                        "iss": "synapse-development", "aud": client.app.state.auth.settings.audience,
                        "iat": now, "exp": now + timedelta(hours=1)}, client.app.state.auth.dev_secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}", "Idempotency-Key": "limited-key"}


def test_http_contract_and_headers(client):
    data = draft_body(seed_observation(client.app.state.database))
    auth = headers(client)
    response = client.post("/api/v1/datasets", json=data, headers=auth)
    assert response.status_code == 201
    dataset = response.json()
    path = f'/api/v1/datasets/{dataset["id"]}'
    assert response.headers["location"] == path
    assert response.headers["etag"] == '"1"'
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-request-id"]
    assert client.post("/api/v1/datasets", json=data, headers=auth).json() == dataset
    assert client.get(path, headers=auth).json() == dataset
    assert client.get(path, headers=auth).headers["etag"] == '"1"'
    changed = client.put(path, json=data | {"name": "Nuevo nombre"}, headers=auth | {"If-Match": '"1"'})
    assert changed.status_code == 200
    assert changed.headers["etag"] == '"2"'
    assert client.post("/api/v1/datasets", json=data, headers=auth).json() == dataset
    assert client.get("/api/v1/datasets", headers=auth).json()["items"][0]["name"] == "Nuevo nombre"
    for method in ["get", "post"]:
        assert method in client.get("/openapi.json").json()["paths"]["/api/v1/datasets"]
    for method in ["get", "put"]:
        assert method in client.get("/openapi.json").json()["paths"]["/api/v1/datasets/{dataset_id}"]


def test_all_scopes_required(client):
    data = draft_body(seed_observation(client.app.state.database))
    assert client.get("/api/v1/datasets").status_code == 401
    analyst = login(client)
    assert "datasets:read" not in client.get("/api/v1/me", headers=analyst).json()["scopes"]
    assert client.get("/api/v1/datasets", headers=analyst).status_code == 403
    created = client.post("/api/v1/datasets", json=data, headers=headers(client)).json()
    path = f'/api/v1/datasets/{created["id"]}'
    for missing in ["datasets:read", "datasets:write", "sources:read"]:
        auth = headers(client, {"datasets:read", "datasets:write", "sources:read"} - {missing})
        assert client.post("/api/v1/datasets", json=data, headers=auth).status_code == 403
        assert client.put(path, json=data, headers=auth | {"If-Match": '"1"'}).status_code == 403
    readonly = headers(client, {"datasets:read"})
    assert client.get(path, headers=readonly).status_code == 200
    assert client.get("/api/v1/datasets", headers=readonly).status_code == 200


def test_cross_tenant_no_disclosure(client):
    data = draft_body(seed_observation(client.app.state.database))
    created = client.post("/api/v1/datasets", json=data, headers=headers(client)).json()
    foreign = login(client, "other-data-admin") | {"Idempotency-Key": "http-key"}
    path = f'/api/v1/datasets/{created["id"]}'
    assert client.get(path, headers=foreign).status_code == 404
    assert client.put(path, json=data, headers=foreign | {"If-Match": '"1"'}).status_code == 404
    assert client.post("/api/v1/datasets", json=data, headers=foreign).status_code == 404
    assert client.get("/api/v1/datasets", headers=foreign).json()["total"] == 0


def test_headers_and_limits(client):
    data = draft_body(seed_observation(client.app.state.database))
    auth = headers(client)
    for key in [None, "", "x" * 101, "bad\tkey"]:
        h = {k: v for k, v in auth.items() if k != "Idempotency-Key"}
        if key is not None:
            h["Idempotency-Key"] = key
        assert client.post("/api/v1/datasets", json=data, headers=h).status_code == 422
    created = client.post("/api/v1/datasets", json=data, headers=auth).json()
    path = f'/api/v1/datasets/{created["id"]}'
    for value, status in [(None, 428), ("1", 422), ('"9"', 412)]:
        assert client.put(path, json=data, headers=auth | ({"If-Match": value} if value else {})).status_code == status
    for query in ["limit=0", "limit=101", "offset=10001", "q=" + "x" * 201]:
        assert client.get("/api/v1/datasets?" + query, headers=auth).status_code == 422
    payload = json.dumps(data | {"name": "Boundary"}).encode()
    response = client.post("/api/v1/datasets", content=payload + b" " * (262144-len(payload)), headers=auth | {"Idempotency-Key": "boundary", "Content-Type": "application/json"})
    assert response.status_code == 201
    for declared in [None, "1"]:
        h = auth | {"Content-Type": "application/json", "Idempotency-Key": "too-large"}
        if declared:
            h["Content-Length"] = declared
        response = client.post("/api/v1/datasets", content=payload+b" " * (262145-len(payload)), headers=h)
        assert response.status_code == 413
        assert response.headers["x-request-id"] == response.json()["error"]["requestId"]


def test_chunked_body_limit():
    from synapse_api.datasets.body_limit import DatasetBodyLimitMiddleware
    sent, called = [], []
    async def app(scope, receive, send):
        called.append(True)
    async def run():
        messages = iter([{"type": "http.request", "body": b"x" * 131072, "more_body": True},
                         {"type": "http.request", "body": b"y" * 131073, "more_body": False}])
        async def receive():
            return next(messages)
        async def send(message):
            sent.append(message)
        await DatasetBodyLimitMiddleware(app)({"type": "http", "path": "/api/v1/datasets", "method": "POST", "headers": [], "state": {"request_id": "chunked-id"}}, receive, send)
    asyncio.run(run())
    assert called == []
    assert sent[0]["status"] == 413
    assert json.loads(sent[1]["body"])["error"]["requestId"] == "chunked-id"


def test_error_redaction(client, monkeypatch):
    import sqlite3
    from synapse_api.errors import ApiError
    data = draft_body(seed_observation(client.app.state.database))
    auth = headers(client)
    response = client.post("/api/v1/datasets", json=data | {"saveAs": "registered", "governance": {"owner": "sensitive-owner"}}, headers=auth)
    assert response.status_code == 422
    assert response.json()["error"]["details"] == {"missingMetadata": ["classification", "freshnessExpectation"]}
    assert "sensitive-owner" not in response.text
    response = client.post("/api/v1/datasets", json=data | {"sql": "secret SQL"}, headers=auth)
    assert "secret SQL" not in response.text
    def unavailable(*args):
        raise sqlite3.OperationalError("secret SQL ciphertext")
    monkeypatch.setattr(client.app.state.datasets, "list", unavailable)
    response = client.get("/api/v1/datasets", headers=auth)
    assert response.status_code == 503
    assert "ciphertext" not in response.text
    def invalid(*args):
        raise ApiError(422, "metadata_incomplete", "Completa metadatos.", details={"missingMetadata": ["owner", "injected-secret"], "secret": "ciphertext"})
    monkeypatch.setattr(client.app.state.datasets, "list", invalid)
    assert client.get("/api/v1/datasets", headers=auth).json()["error"]["details"] == {"missingMetadata": ["owner"]}
