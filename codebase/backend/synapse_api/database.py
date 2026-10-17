from contextlib import contextmanager
from pathlib import Path
import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS kpis(
 tenant_id TEXT NOT NULL, id TEXT NOT NULL, model_version INTEGER NOT NULL,
 document TEXT NOT NULL, PRIMARY KEY(tenant_id,id,model_version)
);
CREATE TABLE IF NOT EXISTS dashboards(
 tenant_id TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, normalized_name TEXT NOT NULL,
 owner_id TEXT NOT NULL, owner_name TEXT NOT NULL, shared INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,owner_id,normalized_name)
);
CREATE TABLE IF NOT EXISTS widgets(
 tenant_id TEXT NOT NULL, dashboard_id TEXT NOT NULL, kpi_id TEXT NOT NULL,
 model_version INTEGER NOT NULL, position INTEGER NOT NULL,
 PRIMARY KEY(tenant_id,dashboard_id,kpi_id),
 FOREIGN KEY(tenant_id,dashboard_id) REFERENCES dashboards(tenant_id,id),
 FOREIGN KEY(tenant_id,kpi_id,model_version) REFERENCES kpis(tenant_id,id,model_version)
);
CREATE TABLE IF NOT EXISTS sales(
 tenant_id TEXT NOT NULL, id TEXT NOT NULL, occurred_on TEXT NOT NULL,
 channel TEXT NOT NULL, product TEXT NOT NULL,
 gross_cents INTEGER NOT NULL, discount_cents INTEGER NOT NULL,
 return_cents INTEGER NOT NULL, cost_cents INTEGER NOT NULL,
 PRIMARY KEY(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS sales_tenant_date ON sales(tenant_id,occurred_on);
CREATE TABLE IF NOT EXISTS sessions(
 tenant_id TEXT NOT NULL, occurred_on TEXT NOT NULL, channel TEXT NOT NULL,
 eligible INTEGER NOT NULL, converted INTEGER NOT NULL,
 PRIMARY KEY(tenant_id,occurred_on,channel)
);
CREATE TABLE IF NOT EXISTS idempotency(
 tenant_id TEXT NOT NULL, subject TEXT NOT NULL, key TEXT NOT NULL,
 fingerprint TEXT NOT NULL, dashboard_id TEXT NOT NULL,
 PRIMARY KEY(tenant_id,subject,key),
 FOREIGN KEY(tenant_id,dashboard_id) REFERENCES dashboards(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS audit_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL,
 subject TEXT NOT NULL, action TEXT NOT NULL, resource_id TEXT NOT NULL,
 request_id TEXT NOT NULL, occurred_at TEXT NOT NULL
);
INSERT OR IGNORE INTO schema_migrations VALUES(1);
"""


class Database:
    def __init__(self, path: Path):
        self.path = path

    @contextmanager
    def connect(self, write: bool = False):
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            if write:
                connection.execute("BEGIN IMMEDIATE")
            yield connection
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            # Reject future schemas before any bootstrap DDL can change them.
            if connection.execute("SELECT 1 FROM sqlite_master WHERE name='schema_migrations'").fetchone():
                version = connection.execute("SELECT MAX(version) FROM schema_migrations").fetchone()[0]
                if version is not None and version not in {1, 2, 3, 4}:
                    raise RuntimeError("Database schema version is not supported")
            connection.execute("PRAGMA journal_mode = WAL")
            from .sources import SOURCE_SCHEMA
            from .datasets.migration import apply_v3
            from .semantic_catalog.migration import apply_v4
            connection.execute("BEGIN IMMEDIATE")
            # These fixed bootstrap scripts contain no triggers or semicolons
            # inside literals. Individual execute keeps all DDL transactional.
            for statement in (SCHEMA + SOURCE_SCHEMA).split(";"):
                if statement.strip():
                    connection.execute(statement)
            version = connection.execute("SELECT MAX(version) FROM schema_migrations").fetchone()[0]
            if version < 3:
                apply_v3(connection)
            if version < 4:
                apply_v4(connection)
