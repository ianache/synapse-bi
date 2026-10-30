import sqlite3

import pytest

from synapse_api.database import Database
from test_semantic_models_migration import make_v4
from synapse_api.semantic_models.migration import apply_v5
from synapse_api.demo import seed


def test_v6_makes_legacy_shared_private_and_preserves_content(tmp_path):
    db = make_v4(tmp_path / 'legacy.db')
    with db.connect(write=True) as conn:
        apply_v5(conn)
        conn.execute("UPDATE dashboards SET shared=1 WHERE name='Existing'")
        before = conn.execute('SELECT tenant_id,id,name,owner_id FROM dashboards').fetchall()
        widgets_before = conn.execute('SELECT * FROM widgets').fetchall()
    db.initialize()
    db.initialize()
    with db.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 6
        assert [tuple(row) for row in conn.execute('SELECT tenant_id,id,name,owner_id FROM dashboards')] == [tuple(row) for row in before]
        assert [tuple(row) for row in conn.execute('SELECT * FROM widgets')] == [tuple(row) for row in widgets_before]
        assert conn.execute("SELECT shared FROM dashboards WHERE name='Existing'").fetchone()[0] == 0
        assert conn.execute("SELECT count(*) FROM dashboard_access_migrations WHERE previous_shared=1").fetchone()[0] == 1
        assert conn.execute('PRAGMA foreign_key_check').fetchall() == []


def test_v6_rollback_if_migration_fails(tmp_path, monkeypatch):
    from synapse_api import dashboard_migration
    db = make_v4(tmp_path / 'rollback.db')
    with db.connect(write=True) as conn:
        apply_v5(conn)
        conn.execute("UPDATE dashboards SET shared=1 WHERE name='Existing'")
    monkeypatch.setattr(dashboard_migration, 'DASHBOARD_DDL', (*dashboard_migration.DASHBOARD_DDL, 'INVALID DDL'))
    with pytest.raises(sqlite3.OperationalError):
        db.initialize()
    with db.connect() as conn:
        assert conn.execute('SELECT MAX(version) FROM schema_migrations').fetchone()[0] == 5
        assert conn.execute("SELECT shared FROM dashboards WHERE name='Existing'").fetchone()[0] == 1
        assert conn.execute("SELECT count(*) FROM sqlite_master WHERE name='dashboard_access_migrations'").fetchone()[0] == 0


def test_new_demo_dashboards_are_private_after_v6(tmp_path):
    db = Database(tmp_path / 'new.db')
    db.initialize()
    seed(db)
    with db.connect() as conn:
        assert conn.execute('SELECT count(*) FROM dashboards WHERE shared=1').fetchone()[0] == 0
