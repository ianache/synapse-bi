from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace

from fastapi.testclient import TestClient
import pytest

from synapse_api.app import create_app
from synapse_api.config import Settings
from conftest import login

REVENUE = "kpi_fin_net_revenue"


def query(kpi=REVENUE, **kwargs):
    return {"kpiId": kpi, "modelVersion": 1, "startDate": "2026-10-01", "endDate": "2026-10-03", **kwargs}


def test_health_schema_and_request_id(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/ready").status_code == 200
    schema = client.get("/openapi.json").json()
    assert "/api/v1/queries" in schema["paths"]
    response = client.get("/api/v1/kpis")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json()["error"]["requestId"] == response.headers["x-request-id"]
    assert response.headers["cache-control"] == "no-store"


def test_untrusted_identity_headers_are_ignored(client):
    assert client.get("/api/v1/kpis", headers={"X-Tenant-ID": "demo-global", "X-User-ID": "ana"}).status_code == 401
    assert client.get("/api/v1/kpis", headers={"Authorization": "Bearer invalid"}).status_code == 401


def test_catalog_search_pagination_and_version(client, analyst):
    page = client.get("/api/v1/kpis?q=facturacion&limit=1", headers=analyst).json()
    assert page["total"] == 1
    assert page["items"][0]["id"] == REVENUE
    assert page["items"][0]["dataMode"] == "synthetic"
    assert page["items"][0]["quality"] == "Sin evaluar"
    assert client.get("/api/v1/kpis?limit=1&offset=1", headers=analyst).json()["total"] == 3
    assert client.get(f"/api/v1/kpis/{REVENUE}?version=2", headers=analyst).status_code == 404
    assert client.get("/api/v1/kpis?q=unknown", headers=analyst).json()["items"] == []


@pytest.mark.parametrize("id_, expected", [(REVENUE, "3100.00"), ("kpi_op_gross_margin", "43.55"), ("kpi_sls_conversion_rate", "18.00")])
def test_queries_compute_components_not_prebaked_values(client, analyst, id_, expected):
    response = client.post("/api/v1/queries", headers=analyst, json=query(id_))
    assert response.status_code == 200
    result = response.json()
    assert result["rows"] == [{"dimension": None, "value": expected}]
    assert result["modelVersion"] == 1
    assert result["metadata"]["dataMode"] == "synthetic"
    assert result["metadata"]["quality"]["status"] == "not_evaluated"
    assert result["metadata"]["sourceUpdatedAt"] == "2026-10-03"
    assert result["metadata"]["lineage"]


def test_query_grouping_filtering_and_empty(client, analyst):
    result = client.post("/api/v1/queries", headers=analyst, json=query(groupBy="channel")).json()
    assert result["rows"] == [{"dimension": "Digital", "value": "1400.00"}, {"dimension": "Tienda", "value": "1700.00"}]
    assert client.post("/api/v1/queries", headers=analyst, json=query(channel="Digital")).json()["rows"][0]["value"] == "1400.00"
    empty = client.post("/api/v1/queries", headers=analyst, json=query(startDate="2020-01-01", endDate="2020-01-02")).json()
    assert empty["status"] == "empty" and empty["rows"] == []


@pytest.mark.parametrize("overrides", [{"groupBy": "channel; DROP TABLE sales"}, {"sql": "SELECT * FROM sales"}, {"tenantId": "demo-other"}, {"modelVersion": 0}, {"startDate": "2026-11-01"}, {"startDate": "2020-01-01"}])
def test_query_validation_rejects_extra_input_and_invalid_ranges(client, analyst, overrides):
    response = client.post("/api/v1/queries", headers=analyst, json=query(**overrides))
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"


def test_query_rejects_disallowed_dimension_and_version(client, analyst):
    assert client.post("/api/v1/queries", headers=analyst, json=query("kpi_sls_conversion_rate", groupBy="product")).status_code == 422
    assert client.post("/api/v1/queries", headers=analyst, json=query(modelVersion=2)).status_code == 404


def test_undefined_denominator_is_null_not_a_fabricated_percentage(client, analyst):
    with client.app.state.database.connect(write=True) as db:
        db.execute("UPDATE sessions SET eligible=0,converted=0 WHERE tenant_id=?", ("demo-global",))
    result = client.post("/api/v1/queries", headers=analyst, json=query("kpi_sls_conversion_rate")).json()
    assert result["rows"] == [{"dimension": None, "value": None}]
    assert result["metadata"]["nullReason"] == "undefined_denominator"


def test_tenant_queries_are_isolated_even_with_forged_header(client, analyst):
    other = login(client, "other-tenant")
    result = client.post("/api/v1/queries", headers={**analyst, "X-Tenant-ID": "demo-other"}, json=query()).json()
    assert result["rows"][0]["value"] == "3100.00"
    assert client.post("/api/v1/queries", headers=other, json=query()).json()["rows"][0]["value"] == "31000.00"


def test_dashboard_persistence_idempotency_and_name_conflict(client, analyst, settings):
    headers = {**analyst, "Idempotency-Key": "create-001"}
    created = client.post("/api/v1/dashboards", headers=headers, json={"name": "  Mi informe  "})
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Mi informe" and body["version"] == 1 and body["editable"]
    assert client.post("/api/v1/dashboards", headers=headers, json={"name": "Mi informe"}).json()["id"] == body["id"]
    assert client.post("/api/v1/dashboards", headers=headers, json={"name": "Otro"}).status_code == 409
    assert client.post("/api/v1/dashboards", headers=analyst, json={"name": "mi INFORME"}).status_code == 409
    with TestClient(create_app(settings), client=("127.0.0.1", 50002)) as fresh:
        assert fresh.get(f'/api/v1/dashboards/{body["id"]}', headers=login(fresh)).json()["name"] == "Mi informe"


def test_widgets_pin_version_prevent_duplicates_and_remove(client, analyst):
    path = f"/api/v1/dashboards/ventas-q3/widgets/{REVENUE}"
    body = {"kpiId": REVENUE, "modelVersion": 1}
    assert client.put(path, headers=analyst, json=body).status_code == 428
    added = client.put(path, headers={**analyst, "If-Match": '"1"'}, json=body)
    assert added.status_code == 200 and added.headers["etag"] == '"2"'
    assert added.json()["modelVersions"] == {REVENUE: 1}
    assert client.put(path, headers={**analyst, "If-Match": '"1"'}, json=body).status_code == 412
    duplicate = client.put(path, headers={**analyst, "If-Match": '"2"'}, json=body).json()
    assert duplicate["visualizations"] == 1 and duplicate["version"] == 2
    removed = client.delete(path, headers={**analyst, "If-Match": '"2"'}).json()
    assert removed["kpiIds"] == [] and removed["version"] == 3


def test_concurrent_edits_do_not_lose_changes(client, analyst):
    def add(id_):
        return client.put(f"/api/v1/dashboards/ventas-q3/widgets/{id_}", headers={**analyst, "If-Match": '"1"'}, json={"kpiId": id_, "modelVersion": 1}).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(add, [REVENUE, "kpi_op_gross_margin"]))
    assert sorted(statuses) == [200, 412]


def test_private_dashboards_and_cross_tenant_resources(client, analyst):
    created = client.post("/api/v1/dashboards", headers=analyst, json={"name": "Privado"}).json()
    other = login(client, "other-tenant")
    viewer = login(client, "viewer")
    for headers in [other, viewer]:
        assert client.get(f'/api/v1/dashboards/{created["id"]}', headers=headers).status_code == 404
        assert all(d["id"] != created["id"] for d in client.get("/api/v1/dashboards", headers=headers).json()["items"])
    assert client.get("/api/v1/dashboards/ventas-q3", headers=viewer).json()["editable"] is False
    assert client.post("/api/v1/dashboards", headers=viewer, json={"name": "Denied"}).status_code == 403
    assert client.put(f'/api/v1/dashboards/{created["id"]}/widgets/{REVENUE}', headers={**other, "If-Match": '"1"'}, json={"kpiId": REVENUE, "modelVersion": 1}).status_code == 404


def test_audit_tracks_tenant_and_no_tokens(client, analyst):
    client.post("/api/v1/queries", headers=analyst, json=query())
    client.post("/api/v1/dashboards", headers=analyst, json={"name": "Audit"})
    with client.app.state.database.connect() as db:
        records = db.execute("SELECT * FROM audit_events").fetchall()
    assert {r["action"] for r in records} == {"semantic.query", "dashboard.created"}
    assert all(r["tenant_id"] == "demo-global" and r["request_id"] for r in records)
    assert analyst["Authorization"] not in str([dict(r) for r in records])


def test_development_auth_is_local_and_never_production(settings, client):
    with pytest.raises(ValueError):
        create_app(replace(settings, environment="production"))
    with pytest.raises(ValueError):
        create_app(Settings())
    assert client.post("/api/v1/auth/dev-session", headers={"Origin": "https://untrusted.example"}, json={}).status_code == 403
    with TestClient(create_app(settings), client=("192.0.2.1", 50001)) as remote:
        assert remote.post("/api/v1/auth/dev-session", json={}).status_code == 403


def test_new_tenant_has_no_catalog_or_foreign_names(client):
    # Test an authenticated but unseeded tenant without overriding authorization.
    import jwt
    import time
    token = jwt.encode({"sub": "new-user", "tenant_id": "unseeded", "iss": "synapse-development", "aud": "synapse-bi-api", "iat": int(time.time()), "exp": int(time.time()) + 60, "scope": "catalog:read dashboards:read queries:execute"}, client.app.state.auth.dev_secret, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v1/kpis", headers=headers).json()["items"] == []
    assert client.post("/api/v1/queries", headers=headers, json=query()).status_code == 404
