import json

from synapse_api.auth import Principal
from synapse_api.database import Database
from synapse_api.datasets.schemas import DatasetFilters, SaveDataset
from synapse_api.datasets.service import DatasetService
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
