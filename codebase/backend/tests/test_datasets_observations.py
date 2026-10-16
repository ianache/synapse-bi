import json

import pytest

from synapse_api.auth import Principal
from synapse_api.database import Database
from synapse_api.datasets.observations import resolve_origins
from synapse_api.datasets.schemas import SaveDataset, SourceConstraint
from synapse_api.errors import ApiError
from dataset_fixtures import seed_observation, draft_body

USER = Principal("admin", "demo-global", "Admin", frozenset({"datasets:read", "datasets:write", "sources:read"}))


@pytest.fixture
def db(tmp_path):
    database = Database(tmp_path / "observations.db")
    database.initialize()
    return database


def test_resolves_historical_snapshot_without_connector(db, monkeypatch):
    def offline(*args, **kwargs):
        raise AssertionError("Dataset registry must not query PostgreSQL")
    monkeypatch.setattr("synapse_api.source_connector.observe_postgres", offline)
    origin = seed_observation(db)
    with db.connect(write=True) as conn:
        before = conn.execute("SELECT snapshot FROM source_observations").fetchone()[0]
        conn.execute("UPDATE sources SET version=2")
        resolved = resolve_origins(conn, USER, SaveDataset.model_validate(draft_body(origin)))
        assert (resolved.output.source_version, resolved.output.current_source_version) == (1, 2)
        assert resolved.output.metadata["kind"] == "table"
        assert resolved.output.metadata["columns"][2]["name"] == 'revenue "USD"'
        assert conn.execute("SELECT snapshot FROM source_observations").fetchone()[0] == before
        assert resolved.inputs == ()


def test_unknown_or_other_tenant_returns_404(db):
    origin = seed_observation(db, "foreign")
    with db.connect() as conn:
        with pytest.raises(ApiError) as caught:
            resolve_origins(conn, USER, SaveDataset.model_validate(draft_body(origin)))
        assert caught.value.status == 404
        data = draft_body(seed_observation(db))
        data["origin"]["object"] = "absent"
        with pytest.raises(ApiError) as caught:
            resolve_origins(conn, USER, SaveDataset.model_validate(data))
        assert caught.value.status == 404


def test_failed_snapshot_and_invalid_selection_422(db):
    for origin, selection in [(seed_observation(db, failed=True), ["tenant_id"]),
                              (seed_observation(db), ["missing column"] )]:
        with db.connect() as conn, pytest.raises(ApiError) as caught:
            resolve_origins(conn, USER, SaveDataset.model_validate(draft_body(origin) | {"selectedColumns": selection}))
        assert caught.value.status == 422


def test_prepared_inputs_scoped_and_distinct(db):
    origin = seed_observation(db)
    another = origin.model_dump(by_alias=True) | {"object": "sales_view"}
    data = draft_body(origin) | {"kind": "prepared", "preparation": {"inputOrigins": [another]}}
    with db.connect() as conn:
        result = resolve_origins(conn, USER, SaveDataset.model_validate(data))
        assert result.inputs[0].metadata["kind"] == "view"
        for inputs in [[another, another], [origin.model_dump(by_alias=True)]]:
            data["preparation"]["inputOrigins"] = inputs
            with pytest.raises(ApiError) as caught:
                resolve_origins(conn, USER, SaveDataset.model_validate(data))
            assert caught.value.status == 422
        foreign = seed_observation(db, "foreign")
        data["preparation"]["inputOrigins"] = [foreign.model_dump(by_alias=True)]
        with pytest.raises(ApiError) as caught:
            resolve_origins(conn, USER, SaveDataset.model_validate(data))
        assert caught.value.status == 404


def test_partial_primary_key_is_only_source_constraint(db):
    origin = seed_observation(db)
    with db.connect(write=True) as conn:
        row = conn.execute("SELECT snapshot FROM source_observations").fetchone()
        snapshot = json.loads(row[0])
        snapshot["objects"][0]["credentials"] = "must not copy"
        conn.execute("UPDATE source_observations SET snapshot=?", (json.dumps(snapshot),))
        result = resolve_origins(conn, USER, SaveDataset.model_validate(draft_body(origin)))
        constraint = SourceConstraint.model_validate(result.output.metadata["constraints"][0])
        assert constraint.kind == "p"
        assert constraint.columns == ["tenant_id", "sales_line_key"]
        assert "credentials" not in result.output.metadata
        assert "grain" not in result.output.metadata
