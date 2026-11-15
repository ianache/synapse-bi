from dataclasses import replace

import pytest

from synapse_api.auth import Principal
from synapse_api.database import Database
from synapse_api.errors import ApiError
from synapse_api.datasets.schemas import SaveDataset
from synapse_api.datasets.service import DatasetService
from synapse_api.preparation.repository import PreparationRepository
from dataset_fixtures import draft_body, seed_observation


USER = Principal("de", "demo-global", "Data Engineering", frozenset({"datasets:read", "datasets:write", "sources:read"}))


def create_input(database):
    origin = seed_observation(database)
    dataset = DatasetService(database).create(
        USER, SaveDataset.model_validate(draft_body(origin)), "input", "request-input"
    )
    return origin, dataset


def test_create_pipeline_registers_output_and_scopes_list_by_tenant(tmp_path):
    database = Database(tmp_path / "pipeline.db")
    database.initialize()
    origin, input_dataset = create_input(database)
    with database.connect(write=True) as connection:
        connection.execute("UPDATE sources SET connection=? WHERE tenant_id=? AND id=?",
                           ('{"host":"127.0.0.1","port":55432,"database":"bi_analytics","username":"reader","tls_mode":"disable","laboratory":true,"schemas":["gold"]}',
                            USER.tenant, origin.source_id))
        repository = PreparationRepository(connection, USER)
        pipeline = repository.create_pipeline(
            source_id=origin.source_id,
            input_dataset_id=input_dataset.id,
            prepared_dataset_name="Ventas preparadas",
            enabled=True,
            timestamp="2026-11-02T00:00:00+00:00",
        )
        fetched = repository.get(pipeline.id)
        listed = repository.list()
        other_tenant_list = PreparationRepository(connection, replace(USER, tenant="demo-other")).list()

    assert pipeline.enabled is True
    assert pipeline.source_id == origin.source_id
    assert pipeline.input_dataset_id == input_dataset.id
    assert pipeline.prepared_dataset_id
    assert pipeline.process_id == "sales-cdc-v1"
    assert pipeline.process_config == {"contractVersion": 1, "relation": "gold.cdc_sales_events"}
    assert fetched.id == pipeline.id
    assert [item.id for item in listed] == [pipeline.id]
    assert other_tenant_list == []

    output = DatasetService(database).get(USER, pipeline.prepared_dataset_id)
    assert output.kind == "prepared"
    assert output.registration_status == "draft"
    assert output.origin.schema_name == "prepared"


def test_pipeline_rejects_input_from_different_source(tmp_path):
    database = Database(tmp_path / "wrong-source.db")
    database.initialize()
    origin, input_dataset = create_input(database)
    with database.connect(write=True) as connection:
        repository = PreparationRepository(connection, USER)
        with pytest.raises(ApiError) as caught:
            repository.create_pipeline(
                source_id="another-source", input_dataset_id=input_dataset.id,
                prepared_dataset_name="Ventas preparadas", enabled=False,
                timestamp="2026-11-02T00:00:00+00:00",
            )
    assert caught.value.code == "source_not_found"
