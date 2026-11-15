import json
import pytest

from synapse_api.auth import Principal
from synapse_api.database import Database
from synapse_api.datasets.schemas import DatasetFilters, SaveDataset
from synapse_api.datasets.service import DatasetService
from synapse_api.errors import ApiError
from synapse_api.datasets.repository import DatasetRepository
from dataset_fixtures import draft_body, seed_observation


USER = Principal("de", "demo-global", "Data Engineering", frozenset({"datasets:read", "datasets:write", "sources:read"}))
PROCESS_ID = "sales-cdc-v1"


def test_prepared_output_is_catalogued_with_source_metadata_and_incomplete_state(tmp_path):
    database = Database(tmp_path / "catalog.db")
    database.initialize()
    origin = seed_observation(database)
    input_dataset = DatasetService(database).create(
        USER, SaveDataset.model_validate(draft_body(origin)), "input", "request-input"
    )

    with database.connect(write=True) as connection:
        output = DatasetRepository(connection, USER).register_prepared_output(
            "prepared-id", input_dataset.id, "Ventas preparadas", PROCESS_ID, "2026-11-02T00:00:00+00:00"
        )

    assert output.id == "prepared-id"
    assert output.kind == "prepared"
    assert (output.registration_status, output.completeness) == ("draft", "incomplete")
    assert output.missing_metadata == ["owner", "classification", "freshnessExpectation"]
    assert (output.origin.schema_name, output.origin.object) == ("prepared", "current_sales_state")
    assert output.lineage.input_origins == [origin]
    assert output.lineage.process_reference == PROCESS_ID
    assert DatasetService(database).get(USER, output.id) == output
    page = DatasetService(database).list(USER, DatasetFilters(kind="prepared"))
    assert [item.id for item in page.items] == [output.id]


def test_catalog_reads_attach_postgres_materialization_without_changing_sqlite_state(tmp_path):
    database = Database(tmp_path / "projection.db")
    database.initialize()
    origin = seed_observation(database)
    input_dataset = DatasetService(database).create(
        USER, SaveDataset.model_validate(draft_body(origin)), "input", "request-input"
    )
    with database.connect(write=True) as connection:
        output = DatasetRepository(connection, USER).register_prepared_output(
            "prepared-projection", input_dataset.id, "Ventas preparadas", PROCESS_ID,
            "2026-11-02T00:00:00+00:00"
        )
    def project(user, dataset_ids):
        assert user == USER
        assert dataset_ids == [output.id]
        return {output.id: {"schema": "prepared", "relation": "current_sales_state",
                            "latestVersionId": "version-1", "latestPublishedAt": "2026-11-14T00:00:00Z"}}

    service = DatasetService(database, project)
    detail = service.get(USER, output.id)
    page = service.list(USER, DatasetFilters(kind="prepared"))

    assert detail.registration_status == "draft"
    assert detail.completeness == "incomplete"
    assert detail.materialization.latest_version_id == "version-1"
    assert page.items[0].materialization.latest_version_id == "version-1"


def test_catalog_read_fails_closed_when_materialization_projection_fails(tmp_path):
    database = Database(tmp_path / "projection-failure.db")
    database.initialize()
    origin = seed_observation(database)
    input_dataset = DatasetService(database).create(
        USER, SaveDataset.model_validate(draft_body(origin)), "input", "request-input"
    )
    with database.connect(write=True) as connection:
        output = DatasetRepository(connection, USER).register_prepared_output(
            "prepared-unavailable", input_dataset.id, "Ventas preparadas", PROCESS_ID,
            "2026-11-02T00:00:00+00:00"
        )

    def unavailable(*_):
        raise ApiError(503, "prepared_writer_unavailable", "El almacén no está disponible.")

    with pytest.raises(ApiError, match="El almacén no está disponible"):
        DatasetService(database, unavailable).get(USER, output.id)
