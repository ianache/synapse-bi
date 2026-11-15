"""Additive SQLite v7 preparation pipeline registry migration."""
import sqlite3


DDL = (
    """CREATE TABLE preparation_pipelines(
       tenant_id TEXT NOT NULL, id TEXT NOT NULL,
       source_id TEXT NOT NULL, input_dataset_id TEXT NOT NULL, prepared_dataset_id TEXT NOT NULL,
       process_id TEXT NOT NULL, process_config TEXT NOT NULL CHECK(json_valid(process_config)),
       enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
       created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
       PRIMARY KEY(tenant_id,id),
       UNIQUE(tenant_id,prepared_dataset_id),
       UNIQUE(tenant_id,source_id,input_dataset_id,process_id),
       FOREIGN KEY(tenant_id,source_id) REFERENCES sources(tenant_id,id) ON DELETE RESTRICT,
       FOREIGN KEY(tenant_id,input_dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT,
       FOREIGN KEY(tenant_id,prepared_dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT
    )""",
    "CREATE INDEX preparation_pipelines_enabled ON preparation_pipelines(enabled,tenant_id,id)",
)


def apply_v7(connection: sqlite3.Connection) -> None:
    if not connection.in_transaction:
        raise RuntimeError("Preparation migration requires an active transaction")
    for statement in DDL:
        connection.execute(statement)
    connection.execute("INSERT INTO schema_migrations(version) VALUES(7)")


def apply_v8(connection: sqlite3.Connection) -> None:
    """Allow multiple prepared outputs from the same input and process."""
    if not connection.in_transaction:
        raise RuntimeError("Preparation migration requires an active transaction")
    connection.execute("""CREATE TABLE preparation_pipelines_v8(
       tenant_id TEXT NOT NULL, id TEXT NOT NULL,
       source_id TEXT NOT NULL, input_dataset_id TEXT NOT NULL, prepared_dataset_id TEXT NOT NULL,
       process_id TEXT NOT NULL, process_config TEXT NOT NULL CHECK(json_valid(process_config)),
       enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
       created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
       PRIMARY KEY(tenant_id,id),
       UNIQUE(tenant_id,prepared_dataset_id),
       FOREIGN KEY(tenant_id,source_id) REFERENCES sources(tenant_id,id) ON DELETE RESTRICT,
       FOREIGN KEY(tenant_id,input_dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT,
       FOREIGN KEY(tenant_id,prepared_dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT
    )""")
    connection.execute("""INSERT INTO preparation_pipelines_v8
       SELECT tenant_id,id,source_id,input_dataset_id,prepared_dataset_id,process_id,process_config,
              enabled,created_by,created_at,updated_at FROM preparation_pipelines""")
    connection.execute("DROP TABLE preparation_pipelines")
    connection.execute("ALTER TABLE preparation_pipelines_v8 RENAME TO preparation_pipelines")
    connection.execute("CREATE INDEX preparation_pipelines_enabled ON preparation_pipelines(enabled,tenant_id,id)")
    connection.execute("INSERT INTO schema_migrations(version) VALUES(8)")
