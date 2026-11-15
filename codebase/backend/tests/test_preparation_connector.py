from types import SimpleNamespace

import pytest

from synapse_api.errors import ApiError
from synapse_api.source_connector import connect_prepared_writer, read_cdc_events


class Connection:
    def __init__(self, rows=()):
        self.rows = list(rows)
        self.read_only = False
        self.query = None
        self.parameters = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def execute(self, query, parameters):
        self.query, self.parameters = query, parameters
        return self

    def fetchall(self):
        return self.rows


def connector_settings(tmp_path, **overrides):
    values = dict(
        environment="test",
        source_targets=({"host": "127.0.0.1", "port": 55432, "address": "127.0.0.1"},),
        source_ca_file="",
        prepared_writer_secret_file=str(tmp_path / "writer.secret"),
    )
    values.update(overrides)
    return SimpleNamespace(**values)


def source_body():
    return SimpleNamespace(host="127.0.0.1", port=55432, database="bi_analytics", username="tenant-reader",
                           tls_mode="disable", laboratory=True, schemas=["gold"])


def test_reader_uses_only_fixed_tenant_scoped_cdc_query(monkeypatch, tmp_path):
    returned = {"capture_id": 42, "source_event_id": "e-42"}
    connection = Connection([returned])
    captured = {}

    def connect(**kwargs):
        captured.update(kwargs)
        return connection

    monkeypatch.setattr("synapse_api.source_connector.psycopg.connect", connect)
    rows = read_cdc_events(connector_settings(tmp_path), source_body(), "reader-test", "tenant-a", 10,
                           through_capture=50, limit=20)

    assert rows == [returned]
    assert connection.read_only is True
    assert "FROM gold.cdc_sales_events" in connection.query
    assert "tenant_id=%s" in connection.query and "capture_id>%s" in connection.query
    assert connection.parameters == ("tenant-a", 10, 50, 20)
    assert captured["user"] == "tenant-reader"
    assert captured["password"] == "reader-test"


def test_prepared_writer_uses_separate_lab_role_and_secret(monkeypatch, tmp_path):
    secret = tmp_path / "writer.secret"
    secret.write_text("separate-writer-test", encoding="utf-8")
    settings = connector_settings(tmp_path)
    connection = Connection()
    captured = {}
    monkeypatch.setattr("synapse_api.source_connector.psycopg.connect", lambda **kwargs: captured.update(kwargs) or connection)

    result = connect_prepared_writer(settings, source_body())

    assert result is connection
    assert captured["user"] == "bi_prepared_writer"
    assert captured["password"] == "separate-writer-test"
    assert captured["user"] != source_body().username


def test_production_prepared_writer_is_disabled(tmp_path):
    settings = connector_settings(tmp_path, environment="production")

    with pytest.raises(ApiError) as caught:
        connect_prepared_writer(settings, source_body())

    assert caught.value.code == "prepared_writer_disabled"


def test_prepared_reads_use_only_allowlisted_relations(monkeypatch, tmp_path):
    from synapse_api.source_connector import read_prepared_records

    with pytest.raises(ApiError) as caught:
        read_prepared_records(connector_settings(tmp_path), source_body(), "reader-test", "tenant-a",
                              "dataset-a", "prepared.version_events; DROP TABLE sources", "version-a", 10, 0)
    assert caught.value.code == "prepared_relation_unavailable"
