import json
import time

import jwt
import pytest

from test_api import REVENUE, query


def update_document(client, change):
    with client.app.state.database.connect(write=True) as db:
        row = db.execute("SELECT document FROM kpis WHERE tenant_id=? AND id=?", ("demo-global", REVENUE)).fetchone()
        document = json.loads(row["document"])
        change(document)
        db.execute("UPDATE kpis SET document=? WHERE tenant_id=? AND id=?", (json.dumps(document), "demo-global", REVENUE))


@pytest.mark.parametrize("lineage", ["omitted", None, []])
def test_missing_lineage_does_not_block_lab_query_or_invent_provenance(client, analyst, lineage):
    def change(document):
        if lineage == "omitted":
            document.pop("lineage")
        else:
            document["lineage"] = lineage
    update_document(client, change)
    response = client.post("/api/v1/queries", headers=analyst, json=query())
    assert response.status_code == 200
    result = response.json()
    assert result["rows"] == [{"dimension": None, "value": "3100.00"}]
    assert result["metadata"]["lineage"] == []
    assert result["metadata"]["lineageStatus"] == "unavailable"
    assert result["metadata"]["quality"] == {"status": "not_evaluated", "score": None}
    assert result["metadata"]["freshness"] == {"status": "not_evaluated", "policy": None}


@pytest.mark.parametrize("value", ["omitted", None, ""])
def test_missing_catalog_confidence_metadata_is_explicit_and_query_still_runs(client, analyst, value):
    def change(document):
        for field in ("quality", "freshness"):
            if value == "omitted":
                document.pop(field)
            else:
                document[field] = value
    update_document(client, change)
    response = client.get(f"/api/v1/kpis/{REVENUE}", headers=analyst)
    assert response.status_code == 200
    assert response.json()["quality"] == "No disponible"
    assert response.json()["freshness"] == "No disponible"
    result = client.post("/api/v1/queries", headers=analyst, json=query())
    assert result.status_code == 200
    assert result.json()["metadata"]["dataMode"] == "synthetic"


def restricted_identity(client, tenant="demo-global"):
    now = int(time.time())
    token = jwt.encode({"sub": "restricted-reader", "tenant_id": tenant, "scope": "catalog:read",
                        "iss": "synapse-development", "aud": "synapse-bi-api", "iat": now, "exp": now + 60},
                       client.app.state.auth.dev_secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_visible_kpi_without_query_scope_is_denied_before_execution(client):
    response = client.post("/api/v1/queries", headers=restricted_identity(client), json=query())
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "permission_denied"
    assert "rows" not in response.json()
    with client.app.state.database.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM audit_events WHERE action='semantic.query'").fetchone()[0] == 0


def test_hidden_kpi_returns_generic_404_even_without_query_scope(client):
    # The same identifier exists in the seeded tenants, but not in this tenant.
    response = client.post("/api/v1/queries", headers=restricted_identity(client, "unseeded"), json=query())
    missing = client.post("/api/v1/queries", headers=restricted_identity(client), json=query(kpi="does-not-exist"))
    assert response.status_code == missing.status_code == 404
    for key in ("code", "message"):
        assert response.json()["error"][key] == missing.json()["error"][key]
    assert "rows" not in response.json()
    assert REVENUE not in response.text
    with client.app.state.database.connect() as db:
        assert db.execute("SELECT COUNT(*) FROM audit_events WHERE action='semantic.query'").fetchone()[0] == 0


def test_available_lineage_is_preserved_without_being_certified(client, analyst):
    result = client.post("/api/v1/queries", headers=analyst, json=query()).json()
    assert result["metadata"]["lineageStatus"] == "available"
    assert result["metadata"]["lineage"]
    assert result["metadata"]["quality"]["status"] == "not_evaluated"


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer invalid"}])
def test_query_without_resolved_identity_returns_no_data(client, headers):
    response = client.post("/api/v1/queries", headers=headers, json=query())
    assert response.status_code == 401
    assert "rows" not in response.json()
