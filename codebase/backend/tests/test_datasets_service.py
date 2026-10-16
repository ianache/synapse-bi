"""Catch duplicate writes, stale overwrite, cross-tenant reads and partial commits."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from dataclasses import replace
import json
import sqlite3

import pytest

from synapse_api.auth import Principal
from synapse_api.database import Database
from synapse_api.datasets.schemas import SaveDataset, DatasetFilters
from synapse_api.datasets.service import DatasetService
from synapse_api.errors import ApiError
from dataset_fixtures import seed_observation, draft_body

USER = Principal("admin", "demo-global", "Admin", frozenset({"datasets:read", "datasets:write", "sources:read"}))


@pytest.fixture
def setup(tmp_path):
    db = Database(tmp_path / "service.db")
    db.initialize()
    return db, DatasetService(db), draft_body(seed_observation(db))


def create(service, data, key="k"):
    return service.create(USER, SaveDataset.model_validate(data), key, "request")


def complete(data):
    return data | {"governance": {"owner": "Equipo", "classification": "Interna", "freshnessExpectation": "Diaria"}}


def test_create_draft_reload_and_register(setup, monkeypatch):
    db, service, data = setup
    def offline(*a, **k):
        raise AssertionError("No external connector permitted")
    monkeypatch.setattr("synapse_api.source_connector.observe_postgres", offline)
    dataset = create(service, data)
    assert dataset.version == 1
    assert dataset.registration_status == "draft"
    assert dataset.missing_metadata == ["owner", "classification", "freshnessExpectation"]
    assert dataset.governance_validation == "pending"
    assert dataset.freshness.status == dataset.quality.status == "not_evaluated"
    assert [c.name for c in dataset.selected_columns] == ["tenant_id", 'revenue "USD"']
    assert dataset.source_constraints[0].columns == ["tenant_id", "sales_line_key"]
    db.initialize()
    assert DatasetService(db).get(USER, dataset.id) == dataset
    registered = service.update(USER, dataset.id, SaveDataset.model_validate(complete(data) | {"saveAs": "registered"}), '"1"', "r")
    assert (registered.registration_status, registered.completeness, registered.version) == ("registered", "complete", 2)
    assert registered.created_by == "admin"
    assert registered.created_at == dataset.created_at
    assert registered.governance_validation == "pending"


def test_complete_draft_stays_draft(setup):
    _, service, data = setup
    dataset = create(service, complete(data))
    assert (dataset.registration_status, dataset.completeness) == ("draft", "complete")


def test_explicit_return_to_draft(setup):
    _, service, data = setup
    dataset = create(service, complete(data) | {"saveAs": "registered"})
    with pytest.raises(ApiError) as caught:
        service.update(USER, dataset.id, SaveDataset.model_validate(data | {"saveAs": "registered"}), '"1"', "r")
    assert caught.value.code == "metadata_incomplete"
    assert service.get(USER, dataset.id).registration_status == "registered"
    changed = service.update(USER, dataset.id, SaveDataset.model_validate(data), '"1"', "r")
    assert changed.registration_status == "draft"


def test_replay_and_payload_conflict(setup):
    db, service, data = setup
    created = create(service, data)
    same = deepcopy(data)
    same["selectedColumns"].reverse()
    assert create(service, same) == created
    with pytest.raises(ApiError) as caught:
        create(service, data | {"description": "different"})
    assert (caught.value.status, caught.value.code) == (409, "idempotency_conflict")
    with pytest.raises(ApiError) as caught:
        create(service, data | {"name": " VENTAS "}, "another-key")
    assert caught.value.status == 409
    with db.connect() as conn:
        assert conn.execute("SELECT COUNT(*) FROM dataset_registry").fetchone()[0] == 1
    with pytest.raises(ApiError) as caught:
        service.get(replace(USER, tenant="foreign"), created.id)
    assert caught.value.status == 404
    assert service.list(replace(USER, tenant="foreign"), DatasetFilters()).total == 0
    with pytest.raises(ApiError) as caught:
        service.create(replace(USER, scopes=frozenset()), SaveDataset.model_validate(data), "k", "r")
    assert caught.value.status == 403


def test_replay_original_after_edit(setup):
    db, service, data = setup
    first = create(service, data)
    service.update(USER, first.id, SaveDataset.model_validate(data | {"name": "Actual"}), '"1"', "r")
    with db.connect(write=True) as conn:
        conn.execute("UPDATE sources SET version=3")
    assert create(service, data) == first
    actual = service.get(USER, first.id)
    assert (actual.name, actual.version, actual.origin.current_source_version) == ("Actual", 2, 3)


def test_expired_key(setup):
    db, service, data = setup
    create(service, data)
    with db.connect(write=True) as conn:
        conn.execute("UPDATE dataset_requests SET expires_at='2000-01-01T00:00:00+00:00'")
    with pytest.raises(ApiError) as caught:
        create(service, data)
    assert caught.value.status == 409
    assert create(service, data | {"name": "Nuevo"}).name == "Nuevo"


def test_two_writers_one_version(setup):
    _, service, data = setup
    dataset = create(service, data)
    def update(name):
        try:
            return service.update(USER, dataset.id, SaveDataset.model_validate(data | {"name": name}), '"1"', "r").version
        except ApiError as error:
            return error.status
    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sorted(pool.map(update, ["First", "Second"])) == [2, 412]
    for header, status in [(None, 428), ("1", 422), ('W/"2"', 422)]:
        with pytest.raises(ApiError) as caught:
            service.update(USER, dataset.id, SaveDataset.model_validate(data), header, "r")
        assert caught.value.status == status
    for changed in [data | {"kind": "prepared"}, data | {"origin": data["origin"] | {"object": "sales_view"}}]:
        with pytest.raises(ApiError) as caught:
            service.update(USER, dataset.id, SaveDataset.model_validate(changed), '"2"', "r")
        assert caught.value.code == "origin_immutable"


def test_filters_before_pagination(setup):
    _, service, data = setup
    for n in range(56):
        create(service, (complete(data) if n % 2 else data) | {"name": f"Venta {n:02d}"}, str(n))
    page = service.list(USER, DatasetFilters(completeness="complete", limit=7, offset=21))
    assert (page.total, len(page.items), page.limit, page.offset) == (28, 7, 7, 21)
    assert all(item.completeness == "complete" for item in page.items)
    assert [item.updated_at for item in page.items] == sorted([item.updated_at for item in page.items], reverse=True)
    assert service.list(USER, DatasetFilters(q="Venta 01")).total == 1
    assert service.list(USER, DatasetFilters(registrationStatus="registered")).total == 0


def test_atomic_rollback_and_backup_restore(setup, monkeypatch, tmp_path):
    from synapse_api.datasets.repository import DatasetRepository
    db, service, data = setup
    with db.connect() as conn:
        snapshots = list(conn.execute("SELECT snapshot FROM source_observations"))[0][0]
        kpis = conn.execute("SELECT COUNT(*) FROM kpis").fetchone()[0]
    original = DatasetRepository._save_request
    def unavailable(*args, **kwargs):
        raise sqlite3.OperationalError("injected storage failure")
    monkeypatch.setattr(DatasetRepository, "_save_request", unavailable)
    with pytest.raises(sqlite3.OperationalError):
        create(service, data)
    with db.connect() as conn:
        assert conn.execute("SELECT COUNT(*) FROM dataset_registry").fetchone()[0] == 0
        assert conn.execute("SELECT COUNT(*) FROM audit_events").fetchone()[0] == 0
        assert conn.execute("SELECT COUNT(*) FROM dataset_columns").fetchone()[0] == 0
    monkeypatch.setattr(DatasetRepository, "_save_request", original)
    dataset = create(service, data)
    restore_path = tmp_path / "restored.db"
    with db.connect() as conn, sqlite3.connect(restore_path) as backup:
        conn.backup(backup)
        assert conn.execute("SELECT snapshot FROM source_observations").fetchone()[0] == snapshots
        assert conn.execute("SELECT COUNT(*) FROM kpis").fetchone()[0] == kpis
    restored = Database(restore_path)
    restored.initialize()
    assert DatasetService(restored).get(USER, dataset.id) == dataset
    assert "not-a-real-secret" not in dataset.model_dump_json()


def test_prepared_medallion_and_canonical_inputs(setup):
    db, service, data = setup
    inputs = [seed_observation(db).model_dump(by_alias=True), data["origin"] | {"object": "sales_view"}]
    prepared = complete(data) | {"kind": "prepared", "saveAs": "registered", "preparation": {"inputOrigins": inputs, "processReference": "Job existente"},
                               "medallion": {field: "Declarado" for field in ["schemaDescription", "partitionPolicy", "retentionPolicy", "minimumQuality", "tenantPolicy"]}}
    dataset = create(service, prepared)
    assert dataset.completeness == "complete"
    prepared["preparation"]["inputOrigins"].reverse()
    assert create(service, prepared) == dataset
    assert dataset.lineage.process_reference == "Job existente"
    assert len(dataset.lineage.input_origins) == 2


@pytest.mark.parametrize("operation", ["get", "list"])
def test_reads_one_committed_snapshot_during_concurrent_update(setup, monkeypatch, operation):
    from synapse_api.datasets.repository import DatasetRepository
    _, service, data = setup
    data = complete(data) | {"kind": "prepared", "preparation": {"processReference": "Job", "inputOrigins": []}}
    original = create(service, data)
    changed = data | {"name": "Version two", "selectedColumns": ["sales_line_key"],
                      "preparation": {"processReference": "Job", "inputOrigins": [data["origin"] | {"object": "sales_view"}]}}
    real_dto = DatasetRepository._dto
    fired = False
    def interleave(repository, row):
        nonlocal fired
        if not fired:
            fired = True
            service.update(USER, original.id, SaveDataset.model_validate(changed), '"1"', "concurrent")
        return real_dto(repository, row)
    monkeypatch.setattr(DatasetRepository, "_dto", interleave)
    if operation == "get":
        assert service.get(USER, original.id) == original
    else:
        page = service.list(USER, DatasetFilters(completeness="incomplete"))
        assert page.total == 1
        assert (page.items[0].name, page.items[0].version, page.items[0].completeness) == ("Ventas", 1, "incomplete")
    assert service.get(USER, original.id).version == 2
