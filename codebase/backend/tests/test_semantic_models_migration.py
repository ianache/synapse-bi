"""V5 must preserve existing records, reject invalid tenant relations, and roll back all DDL."""
import sqlite3

import pytest

from synapse_api.database import Database
from test_semantic_catalog_migration import make_v3


def make_v4(path):
    from synapse_api.semantic_catalog.migration import apply_v4
    db = make_v3(path)
    with db.connect(write=True) as conn:
        apply_v4(conn)
    return db


def test_upgrade_v4_is_additive(tmp_path):
    db = make_v4(tmp_path / 'v4.db')
    db.initialize()
    db.initialize()
    with db.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 5
        assert conn.execute('SELECT name FROM dashboards').fetchone()[0] == 'Existing'
        assert conn.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name LIKE 'models_%'").fetchone()[0] == 3
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []
        assert conn.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'


def test_v5_rollback_on_failure(tmp_path, monkeypatch):
    from synapse_api.semantic_models import migration
    db = make_v4(tmp_path / 'rollback.db')
    monkeypatch.setattr(migration, 'MODELS_DDL', (*migration.MODELS_DDL, 'INVALID DDL'))
    with pytest.raises(sqlite3.OperationalError):
        db.initialize()
    with db.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 4
        assert conn.execute("SELECT count(*) FROM sqlite_master WHERE name LIKE 'models_%'").fetchone()[0] == 0


def test_future_rejected_before_ddl(tmp_path):
    db = Database(tmp_path / 'future.db')
    with db.connect(write=True) as conn:
        conn.execute('CREATE TABLE schema_migrations(version INTEGER PRIMARY KEY)')
        conn.execute('INSERT INTO schema_migrations VALUES(6)')
    with pytest.raises(RuntimeError):
        db.initialize()
    with db.connect() as conn:
        assert [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")] == ['schema_migrations']


def test_cross_tenant_fk(tmp_path):
    db = Database(tmp_path / 'tenant.db')
    db.initialize()
    with db.connect(write=True) as conn:
        conn.execute('INSERT INTO semantic_domains VALUES(?,?,?,?,?,?,?,?,?,?)',
                     ('t1', 'domain', 'Ventas', 'ventas', '', None, 'a', 'now', 'now', 1))
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute('INSERT INTO models_registry VALUES(?,?,?,?,?,?,?,?,?,?)',
                         ('t2', 'model', 'domain', 'X', 'x', '', 'a', 'now', 'now', 1))


def test_backup_restore(tmp_path):
    db = make_v4(tmp_path / 'source.db')
    backup = tmp_path / 'backup.db'
    with db.connect() as source, sqlite3.connect(backup) as target:
        source.backup(target)
    db.initialize()
    restored = Database(backup)
    with restored.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 4
    restored.initialize()
    with restored.connect() as conn:
        assert conn.execute('SELECT name FROM dashboards').fetchone()[0] == 'Existing'
        assert conn.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'


def test_apply_requires_transaction(tmp_path):
    from synapse_api.semantic_models.migration import apply_v5
    with sqlite3.connect(tmp_path / 'transaction.db') as conn:
        with pytest.raises(RuntimeError, match='transaction'):
            apply_v5(conn)
