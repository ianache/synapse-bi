"""Additive SQLite v3; the caller owns the transaction and commit."""
import sqlite3

DATASET_DDL: tuple[str, ...] = (
    """CREATE TABLE dataset_registry(
       tenant_id TEXT NOT NULL, id TEXT NOT NULL,
       name TEXT NOT NULL, normalized_name TEXT NOT NULL, description TEXT NOT NULL,
       kind TEXT NOT NULL CHECK(kind IN ('direct','prepared')),
       registration_status TEXT NOT NULL CHECK(registration_status IN ('draft','registered')),
       source_id TEXT NOT NULL, observation_id TEXT NOT NULL, schema_name TEXT NOT NULL, object_name TEXT NOT NULL,
       owner_declared TEXT, classification_declared TEXT, freshness_expectation TEXT, load_reference TEXT,
       process_reference TEXT, medallion_document TEXT, source_metadata_document TEXT NOT NULL,
       created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
       version INTEGER NOT NULL CHECK(version>=1),
       PRIMARY KEY(tenant_id,id), UNIQUE(tenant_id,normalized_name),
       FOREIGN KEY(tenant_id,source_id,observation_id) REFERENCES source_observations(tenant_id,source_id,id) ON DELETE RESTRICT,
       CHECK(kind='prepared' OR process_reference IS NULL),
       CHECK(registration_status='draft' OR
             (owner_declared IS NOT NULL AND length(trim(owner_declared))>0 AND
              classification_declared IS NOT NULL AND length(trim(classification_declared))>0 AND
              freshness_expectation IS NOT NULL AND length(trim(freshness_expectation))>0)))""",
    """CREATE TABLE dataset_columns(
       tenant_id TEXT NOT NULL, dataset_id TEXT NOT NULL, column_name TEXT NOT NULL,
       ordinal INTEGER NOT NULL CHECK(ordinal>0), PRIMARY KEY(tenant_id,dataset_id,column_name),
       UNIQUE(tenant_id,dataset_id,ordinal),
       FOREIGN KEY(tenant_id,dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT)""",
    """CREATE TABLE dataset_inputs(
       tenant_id TEXT NOT NULL, dataset_id TEXT NOT NULL, ordinal INTEGER NOT NULL CHECK(ordinal>0),
       source_id TEXT NOT NULL, observation_id TEXT NOT NULL, schema_name TEXT NOT NULL, object_name TEXT NOT NULL,
       observed_metadata_document TEXT NOT NULL, PRIMARY KEY(tenant_id,dataset_id,ordinal),
       UNIQUE(tenant_id,dataset_id,source_id,observation_id,schema_name,object_name),
       FOREIGN KEY(tenant_id,dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT,
       FOREIGN KEY(tenant_id,source_id,observation_id) REFERENCES source_observations(tenant_id,source_id,id) ON DELETE RESTRICT)""",
    """CREATE TABLE dataset_requests(
       tenant_id TEXT NOT NULL, subject TEXT NOT NULL, operation TEXT NOT NULL CHECK(operation='datasets.create'),
       key TEXT NOT NULL, fingerprint TEXT NOT NULL, dataset_id TEXT NOT NULL,
       response_document TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
       PRIMARY KEY(tenant_id,subject,operation,key),
       FOREIGN KEY(tenant_id,dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT)""",
    "CREATE INDEX datasets_updated ON dataset_registry(tenant_id,updated_at DESC,id ASC)",
    "CREATE INDEX datasets_status ON dataset_registry(tenant_id,kind,registration_status,updated_at DESC,id ASC)",
    "CREATE INDEX datasets_origin ON dataset_registry(tenant_id,source_id,observation_id)",
    "CREATE INDEX dataset_inputs_origin ON dataset_inputs(tenant_id,source_id,observation_id)",
    "CREATE INDEX dataset_requests_expiry ON dataset_requests(expires_at)",
)


def apply_v3(connection: sqlite3.Connection) -> None:
    if not connection.in_transaction:
        raise RuntimeError("Dataset migration requires an active transaction")
    for statement in DATASET_DDL:
        connection.execute(statement)
    connection.execute("INSERT INTO schema_migrations(version) VALUES(3)")
