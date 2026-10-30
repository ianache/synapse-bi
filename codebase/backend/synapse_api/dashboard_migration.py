"""Migrate tenant-wide dashboard shares to private, preserving content."""
import sqlite3


DASHBOARD_DDL = (
    'ALTER TABLE dashboards ADD COLUMN initial_start_date TEXT',
    'ALTER TABLE dashboards ADD COLUMN initial_end_date TEXT',
    '''CREATE TABLE dashboard_readers(
      tenant_id TEXT NOT NULL, dashboard_id TEXT NOT NULL, subject TEXT NOT NULL,
      PRIMARY KEY(tenant_id,dashboard_id,subject),
      FOREIGN KEY(tenant_id,dashboard_id) REFERENCES dashboards(tenant_id,id))''',
    '''CREATE TABLE dashboard_access_migrations(
      tenant_id TEXT NOT NULL, dashboard_id TEXT NOT NULL,
      previous_shared INTEGER NOT NULL CHECK(previous_shared=1),
      migrated_at TEXT NOT NULL,
      PRIMARY KEY(tenant_id,dashboard_id),
      FOREIGN KEY(tenant_id,dashboard_id) REFERENCES dashboards(tenant_id,id))''',
)


def apply_v6(connection: sqlite3.Connection) -> None:
    if not connection.in_transaction:
        raise RuntimeError('Dashboard migration requires an active transaction')
    for statement in DASHBOARD_DDL:
        connection.execute(statement)
    connection.execute('''INSERT INTO dashboard_access_migrations
        SELECT tenant_id,id,1,strftime('%Y-%m-%dT%H:%M:%fZ','now')
        FROM dashboards WHERE shared=1''')
    connection.execute('UPDATE dashboards SET shared=0 WHERE shared=1')
    connection.execute('INSERT INTO schema_migrations(version) VALUES(6)')
