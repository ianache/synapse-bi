from cryptography.fernet import Fernet
import json
import os
from pathlib import Path
from uuid import uuid4

import psycopg
import pytest

from synapse_api.auth import Principal
from synapse_api.config import Settings
from synapse_api.database import Database
from synapse_api.datasets.schemas import SaveDataset
from synapse_api.datasets.service import DatasetService
from synapse_api.preparation.repository import PreparationRepository
from synapse_api.preparation.service import PreparationService
from synapse_api.sources import SourceService
from dataset_fixtures import draft_body, seed_observation


PORT = os.getenv("US007_TEST_POSTGRES_PORT")
pytestmark = pytest.mark.skipif(not PORT, reason="Set US007_TEST_POSTGRES_PORT and lab secret paths for CDC integration.")
USER = Principal("de", "demo-global", "Data Engineering", frozenset({"datasets:read", "datasets:write", "sources:read"}))


def sales_image(tenant, key, quantity):
    return {
        "tenant_id": tenant, "sales_line_key": key, "order_number": f"ORD-{key}", "line_number": 1,
        "sale_date_key": 20260901, "product_key": 1, "customer_key": 1, "store_key": 1,
        "channel_key": 1, "quantity": quantity, "unit_price": 10.0, "gross_amount": quantity * 10.0,
        "discount_amount": 0.0, "sale_amount": quantity * 10.0, "cost_amount": quantity * 6.0,
        "loaded_at": "2026-09-01T00:00:00+00:00",
    }


def test_manual_publish_quality_rejection_and_delete_preserve_version_history(tmp_path):
    database = Database(tmp_path / "integration.db")
    database.initialize()
    origin = seed_observation(database)
    source_secret = Path(os.environ["US007_TEST_READER_SECRET_FILE"]).read_text(encoding="utf-8").strip()
    settings = Settings(
        database_path=database.path, environment="development", auth_mode="development",
        source_targets=({"host": "127.0.0.1", "port": int(PORT), "address": "127.0.0.1"},),
        prepared_writer_secret_file=os.environ["US007_TEST_WRITER_SECRET_FILE"],
    )
    settings.validate()
    sources = SourceService(database, settings)
    encrypted = Fernet(sources.key()).encrypt(source_secret.encode())
    source_connection = {
        "host": "127.0.0.1", "port": int(PORT), "database": "bi_analytics", "username": "bi_reader_global",
        "tls_mode": "disable", "laboratory": True, "schemas": ["gold"],
    }
    with database.connect(write=True) as connection:
        connection.execute("UPDATE sources SET connection=?,secret=? WHERE tenant_id=? AND id=?",
                           (json.dumps(source_connection), encrypted, USER.tenant, origin.source_id))
    input_dataset = DatasetService(database).create(
        USER, SaveDataset.model_validate(draft_body(origin)), "input", "request-input"
    )
    with database.connect(write=True) as connection:
        pipeline = PreparationRepository(connection, USER).create_pipeline(
            source_id=origin.source_id, input_dataset_id=input_dataset.id,
            prepared_dataset_name=f"Ventas CDC {uuid4()}", enabled=False,
            timestamp="2026-11-02T00:00:00+00:00",
        )
    service = PreparationService(database, settings, sources)
    key = int(uuid4().int % 10_000_000) + 9_000_000
    timestamp = "2026-09-01T00:00:00+00:00"
    first = service.execute_manual(USER, pipeline.id, [
        {"sourceEventId": f"it-{key}-1", "businessKey": key, "operation": "insert", "eventTimestamp": timestamp,
         "sourcePosition": 1, "afterImage": sales_image(USER.tenant, key, 2)},
        {"sourceEventId": f"it-{key}-2", "businessKey": key, "operation": "update", "eventTimestamp": timestamp,
         "sourcePosition": 2, "afterImage": sales_image(USER.tenant, key, 3)},
    ], "request-first")
    assert first.status == "published"
    assert first.published_version.version_number == 1

    rejected = service.execute_manual(USER, pipeline.id, [
        {"sourceEventId": f"it-{key}-bad", "businessKey": key, "operation": "insert",
         "eventTimestamp": timestamp, "afterImage": {"sales_line_key": key}},
    ], "request-rejected")
    assert rejected.status == "quality_rejected"
    assert rejected.latest_successful_version.version_id == first.published_version.version_id

    retried = service.retry_run(USER, rejected.id, "request-retry", [{
        "sourceEventId": f"it-{key}-retry", "businessKey": key, "operation": "insert",
        "eventTimestamp": timestamp, "sourcePosition": 2, "afterImage": sales_image(USER.tenant, key, 4),
    }])
    assert retried.status == "published"
    assert retried.retry_of_run_id == rejected.id

    deleted = service.execute_manual(USER, pipeline.id, [
        {"sourceEventId": f"it-{key}-3", "businessKey": key, "operation": "delete", "eventTimestamp": timestamp,
         "sourcePosition": 3},
    ], "request-delete")
    assert deleted.status == "published"
    assert deleted.published_version.version_number == 3

    writer_password = Path(os.environ["US007_TEST_WRITER_SECRET_FILE"]).read_text(encoding="utf-8").strip()
    with psycopg.connect(host="127.0.0.1", port=int(PORT), dbname="bi_analytics", user="bi_prepared_writer",
                         password=writer_password, sslmode="disable") as connection:
        connection.execute("SELECT set_config('app.tenant_id',%s,true)", (USER.tenant,))
        history = connection.execute(
            "SELECT source_event_id,operation FROM prepared.version_events WHERE dataset_id=%s AND version_id=%s ORDER BY ordinal",
            (pipeline.prepared_dataset_id, deleted.published_version.version_id),
        ).fetchall()
        state = connection.execute(
            "SELECT 1 FROM prepared.current_sales_state WHERE dataset_id=%s AND version_id=%s AND business_key=%s",
            (pipeline.prepared_dataset_id, deleted.published_version.version_id, key),
        ).fetchone()
    assert [row[1] for row in history] == ["insert", "update", "insert", "delete"]
    assert state is None
    versions = service.list_versions(USER, pipeline.prepared_dataset_id, 10, 0)
    assert versions["total"] == 3
    assert versions["items"][0].version_id == deleted.published_version.version_id
    consumed_history = service.read_history(USER, pipeline.prepared_dataset_id, deleted.published_version.version_id, 10, 0)
    assert consumed_history["total"] == 4
    consumed_state = service.read_current_state(USER, pipeline.prepared_dataset_id, deleted.published_version.version_id, 10, 0)
    assert all(row["business_key"] != key for row in consumed_state["items"])

    polled_runs = []
    while True:
        polled = service.poll_pipeline(USER, pipeline.id, "request-poll")
        if polled is None:
            break
        assert polled.status == "published", (polled.error_code, polled.sanitized_error)
        assert polled.published_version.source_range_end >= polled.published_version.source_range_start
        polled_runs.append(polled)
    assert len(polled_runs) == 2
    assert polled_runs[-1].published_version.event_count == 1105
    assert service.poll_pipeline(USER, pipeline.id, "request-empty-poll") is None
