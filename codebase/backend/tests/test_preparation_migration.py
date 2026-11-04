import sqlite3

import pytest

from synapse_api.database import Database


def _insert_dataset(connection, tenant, source_id, observation_id, dataset_id, name):
    connection.execute(
        "INSERT INTO dataset_registry(tenant_id,id,name,normalized_name,description,kind,registration_status,"
        "source_id,observation_id,schema_name,object_name,source_metadata_document,created_by,created_at,updated_at,version) "
        "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (tenant, dataset_id, name, name.casefold(), "", "direct", "draft", source_id, observation_id,
         "gold", "fact_sales", '{"columns":[],"constraints":[]}', "actor", "now", "now", 1),
    )


def test_schema_v8_allows_multiple_outputs_and_preserves_dataset_rows(tmp_path):
    database = Database(tmp_path / "registry.db")
    database.initialize()
    with database.connect(write=True) as connection:
        connection.execute(
            "INSERT INTO sources VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            ("tenant-a", "source-a", "Source", "source", "", "{}", b"cipher", "connected", None, "now", 1),
        )
        connection.execute(
            "INSERT INTO source_observations VALUES(?,?,?,?,?,?,?,?,?)",
            ("tenant-a", "source-a", "obs-a", 1, 1, "now", "success", '{"objects":[]}', None),
        )
        _insert_dataset(connection,"tenant-a","source-a","obs-a","dataset-a","Sales")

    database.initialize()

    with database.connect() as connection:
        version = connection.execute("SELECT MAX(version) FROM schema_migrations").fetchone()[0]
        dataset = connection.execute("SELECT name FROM dataset_registry WHERE tenant_id='tenant-a' AND id='dataset-a'").fetchone()
        table = connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='preparation_pipelines'").fetchone()
    assert version == 8
    assert dataset[0] == "Sales"
    assert table[0] == "preparation_pipelines"


def test_preparation_pipeline_is_tenant_scoped_and_unique_per_prepared_dataset(tmp_path):
    database = Database(tmp_path / "constraints.db")
    database.initialize()
    with database.connect(write=True) as connection:
        connection.execute(
            "INSERT INTO sources VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            ("tenant-a", "source-a", "Source", "source", "", "{}", b"cipher", "connected", None, "now", 1),
        )
        connection.execute(
            "INSERT INTO source_observations VALUES(?,?,?,?,?,?,?,?,?)",
            ("tenant-a", "source-a", "obs-a", 1, 1, "now", "success", '{"objects":[]}', None),
        )
        _insert_dataset(connection,"tenant-a","source-a","obs-a","input-a","Input")
        _insert_dataset(connection,"tenant-a","source-a","obs-a","prepared-a","Prepared")
        _insert_dataset(connection,"tenant-a","source-a","obs-a","prepared-b","Prepared B")
        connection.execute(
            "INSERT INTO preparation_pipelines(tenant_id,id,source_id,input_dataset_id,prepared_dataset_id,process_id,process_config,enabled,created_by,created_at,updated_at) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            ("tenant-a", "pipeline-a", "source-a", "input-a", "prepared-a", "sales-cdc-v1", "{}", 0, "actor", "now", "now"),
        )
        connection.execute(
            "INSERT INTO preparation_pipelines(tenant_id,id,source_id,input_dataset_id,prepared_dataset_id,process_id,process_config,enabled,created_by,created_at,updated_at) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            ("tenant-a", "pipeline-b", "source-a", "input-a", "prepared-b", "sales-cdc-v1", "{}", 0, "actor", "now", "now"),
        )
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO preparation_pipelines(tenant_id,id,source_id,input_dataset_id,prepared_dataset_id,process_id,process_config,enabled,created_by,created_at,updated_at) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                ("tenant-a", "pipeline-b", "source-a", "input-a", "prepared-a", "sales-cdc-v1", "{}", 0, "actor", "now", "now"),
            )
        with pytest.raises(sqlite3.IntegrityError):
            connection.execute(
                "INSERT INTO preparation_pipelines(tenant_id,id,source_id,input_dataset_id,prepared_dataset_id,process_id,process_config,enabled,created_by,created_at,updated_at) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                ("tenant-b", "pipeline-a", "source-a", "input-a", "prepared-a", "sales-cdc-v1", "{}", 0, "actor", "now", "now"),
            )
