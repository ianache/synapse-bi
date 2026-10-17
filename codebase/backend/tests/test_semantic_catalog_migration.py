"""Detect data loss, partial v4 upgrades and invalid tenant references."""
import sqlite3

import pytest

from synapse_api.database import Database, SCHEMA
from synapse_api.sources import SOURCE_SCHEMA
from synapse_api.datasets.migration import apply_v3


def make_v3(path):
    db = Database(path)
    with db.connect() as conn:
        conn.executescript(SCHEMA + SOURCE_SCHEMA)
        conn.execute('BEGIN IMMEDIATE')
        apply_v3(conn)
        conn.execute('INSERT INTO dashboards VALUES(?,?,?,?,?,?,?,?,?)',
                     ('t', 'd', 'Existing', 'existing', 'a', 'Ana', 0, 'time', 1))
    return db


def test_v3_upgrade_is_additive_and_initialize_twice_is_noop(tmp_path):
    db = make_v3(tmp_path / 'upgrade.db')
    db.initialize()
    db.initialize()
    with db.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 4
        assert conn.execute('SELECT name FROM dashboards').fetchone()[0] == 'Existing'
        assert len(conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'semantic_%'").fetchall()) == 6
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
        assert conn.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'


def test_migration_failure_rolls_back(tmp_path, monkeypatch):
    from synapse_api.semantic_catalog import migration
    db = make_v3(tmp_path / 'rollback.db')
    monkeypatch.setattr(migration, 'SEMANTIC_DDL', (*migration.SEMANTIC_DDL, 'THIS IS NOT SQL'))
    with pytest.raises(sqlite3.OperationalError):
        db.initialize()
    with db.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 3
        assert conn.execute("SELECT COUNT(*) FROM sqlite_master WHERE name LIKE 'semantic_%'").fetchone()[0] == 0


def test_future_schema_rejected_before_changes(tmp_path):
    db = Database(tmp_path / 'future.db')
    with db.connect() as conn:
        conn.execute('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)')
        conn.execute('INSERT INTO schema_migrations VALUES(99)')
    with pytest.raises(RuntimeError):
        db.initialize()
    with db.connect() as conn:
        assert [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")] == ['schema_migrations']


def test_restore_copy_preserves_existing_records(tmp_path):
    db = make_v3(tmp_path / 'original.db')
    backup = tmp_path / 'backup.db'
    with db.connect() as source, sqlite3.connect(backup) as target:
        source.backup(target)
    db.initialize()
    restored = Database(backup)
    with restored.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 3
        assert conn.execute('SELECT name FROM dashboards').fetchone()[0] == 'Existing'
    restored.initialize()
    with restored.connect() as conn:
        assert conn.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'


def test_apply_requires_transaction(tmp_path):
    from synapse_api.semantic_catalog.migration import apply_v4
    with sqlite3.connect(tmp_path / 'inactive.db') as conn:
        with pytest.raises(RuntimeError, match='transaction'):
            apply_v4(conn)
