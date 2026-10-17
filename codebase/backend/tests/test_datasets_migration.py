"""Catch partial schema changes, data loss, future-version mutation and tenant FK holes."""
import sqlite3

import pytest

from synapse_api.database import Database, SCHEMA
from synapse_api.sources import SOURCE_SCHEMA


@pytest.mark.parametrize("version", [0, 1, 2])
def test_new_v1_v2_upgrade_preserves_data(tmp_path, version):
    database = Database(tmp_path / "upgrade.db")
    with database.connect() as conn:
        if version:
            conn.executescript(SCHEMA)
            conn.execute("INSERT INTO dashboards VALUES(?,?,?,?,?,?,?,?,?)",
                         ("t", "d", "Original", "original", "a", "Ana", 0, "time", 1))
            conn.execute("INSERT INTO idempotency VALUES(?,?,?,?,?)", ("t", "a", "key", "fp", "d"))
            conn.commit()
        if version == 2:
            conn.executescript(SOURCE_SCHEMA)
            conn.execute("INSERT INTO sources VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                         ("t", "s", "Source", "source", "", "{}", b"opaque-ciphertext", "connected", None, "time", 1))
            conn.execute("INSERT INTO source_observations VALUES(?,?,?,?,?,?,?,?,?)",
                         ("t", "s", "o", 1, 1, "time", "success", '{"objects":[]}', None))
    database.initialize()
    database.initialize()
    with database.connect() as conn:
        assert conn.execute("SELECT MAX(version) FROM schema_migrations").fetchone()[0] == 4
        assert len(conn.execute("SELECT name FROM sqlite_master WHERE name IN ('dataset_registry','dataset_columns','dataset_inputs','dataset_requests')").fetchall()) == 4
        if version:
            assert conn.execute("SELECT name FROM dashboards").fetchone()[0] == "Original"
            assert conn.execute("SELECT fingerprint FROM idempotency").fetchone()[0] == "fp"
        if version == 2:
            assert conn.execute("SELECT secret FROM sources").fetchone()[0] == b"opaque-ciphertext"
            assert conn.execute("SELECT snapshot FROM source_observations").fetchone()[0] == '{"objects":[]}'


def test_future_schema_rejected_before_new_tables(tmp_path):
    database = Database(tmp_path / "future.db")
    with database.connect() as conn:
        conn.execute("CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)")
        conn.execute("INSERT INTO schema_migrations VALUES(99)")
    with pytest.raises(RuntimeError, match="not supported"):
        database.initialize()
    with database.connect() as conn:
        assert [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")] == ["schema_migrations"]


def test_migration_failure_rolls_back(tmp_path, monkeypatch):
    from synapse_api.datasets import migration
    database = Database(tmp_path / "failed.db")
    with database.connect() as conn:
        conn.executescript(SCHEMA + SOURCE_SCHEMA)
    monkeypatch.setattr(migration, "DATASET_DDL", (*migration.DATASET_DDL, "THIS IS NOT SQL"))
    with pytest.raises(sqlite3.OperationalError):
        database.initialize()
    with database.connect() as conn:
        assert conn.execute("SELECT MAX(version) FROM schema_migrations").fetchone()[0] == 2
        assert conn.execute("SELECT COUNT(*) FROM sqlite_master WHERE name LIKE 'dataset_%'").fetchone()[0] == 0


def test_composite_foreign_keys(tmp_path):
    database = Database(tmp_path / "fk.db")
    database.initialize()
    with database.connect(write=True) as conn:
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute("INSERT INTO dataset_columns VALUES(?,?,?,?)", ("foreign", "missing", "x", 1))
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute("INSERT INTO dataset_inputs VALUES(?,?,?,?,?,?,?,?)", ("foreign", "missing", 1, "s", "o", "gold", "x", "{}"))


def test_apply_requires_transaction(tmp_path):
    from synapse_api.datasets.migration import apply_v3
    with sqlite3.connect(tmp_path / "inactive.db") as conn:
        with pytest.raises(RuntimeError, match="transaction"):
            apply_v3(conn)
