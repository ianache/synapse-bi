"""Additive v4. Caller owns the transaction; no changes to Gold or existing rows."""
import sqlite3

SEMANTIC_DDL = (
    """CREATE TABLE semantic_domains(
      tenant_id TEXT NOT NULL,id TEXT NOT NULL,name TEXT NOT NULL,normalized_name TEXT NOT NULL,
      description TEXT NOT NULL,owner TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,version INTEGER NOT NULL CHECK(version>=1),
      PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,normalized_name))""",
    """CREATE TABLE semantic_components(
      tenant_id TEXT NOT NULL,id TEXT NOT NULL,domain_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('dimension','measure')),name TEXT NOT NULL,normalized_name TEXT NOT NULL,
      metadata_document TEXT NOT NULL,copy_origin_id TEXT,protected INTEGER NOT NULL DEFAULT 0 CHECK(protected IN (0,1)),
      created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,version INTEGER NOT NULL CHECK(version>=1),
      PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,domain_id,kind,normalized_name),
      UNIQUE(tenant_id,domain_id,kind,id),UNIQUE(tenant_id,domain_id,id),
      CHECK(copy_origin_id IS NULL OR copy_origin_id!=id),
      FOREIGN KEY(tenant_id,domain_id) REFERENCES semantic_domains(tenant_id,id) ON DELETE RESTRICT,
      FOREIGN KEY(tenant_id,domain_id,kind,copy_origin_id) REFERENCES semantic_components(tenant_id,domain_id,kind,id) ON DELETE RESTRICT)""",
    """CREATE TABLE semantic_bindings(
      tenant_id TEXT NOT NULL,component_id TEXT NOT NULL,dataset_id TEXT NOT NULL,column_name TEXT NOT NULL,
      dataset_version INTEGER NOT NULL CHECK(dataset_version>=1),snapshot_document TEXT NOT NULL,
      PRIMARY KEY(tenant_id,component_id),
      FOREIGN KEY(tenant_id,component_id) REFERENCES semantic_components(tenant_id,id) ON DELETE RESTRICT,
      FOREIGN KEY(tenant_id,dataset_id) REFERENCES dataset_registry(tenant_id,id) ON DELETE RESTRICT)""",
    """CREATE TABLE semantic_kpi_definitions(
      tenant_id TEXT NOT NULL,id TEXT NOT NULL,domain_id TEXT NOT NULL,name TEXT NOT NULL,normalized_name TEXT NOT NULL,
      metadata_document TEXT NOT NULL,created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
      version INTEGER NOT NULL CHECK(version>=1),PRIMARY KEY(tenant_id,id),
      UNIQUE(tenant_id,domain_id,normalized_name),UNIQUE(tenant_id,domain_id,id),
      FOREIGN KEY(tenant_id,domain_id) REFERENCES semantic_domains(tenant_id,id) ON DELETE RESTRICT)""",
    """CREATE TABLE semantic_kpi_components(
      tenant_id TEXT NOT NULL,kpi_id TEXT NOT NULL,component_id TEXT NOT NULL,domain_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('dimension','measure')),PRIMARY KEY(tenant_id,kpi_id,component_id),
      FOREIGN KEY(tenant_id,domain_id,kpi_id) REFERENCES semantic_kpi_definitions(tenant_id,domain_id,id) ON DELETE RESTRICT,
      FOREIGN KEY(tenant_id,domain_id,kind,component_id) REFERENCES semantic_components(tenant_id,domain_id,kind,id) ON DELETE RESTRICT)""",
    """CREATE TABLE semantic_requests(
      tenant_id TEXT NOT NULL,subject TEXT NOT NULL,operation TEXT NOT NULL,
      target_id TEXT NOT NULL,key TEXT NOT NULL,fingerprint TEXT NOT NULL,response_document TEXT NOT NULL,
      resource_kind TEXT NOT NULL,resource_id TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,
      PRIMARY KEY(tenant_id,subject,operation,target_id,key),
      CHECK(operation IN ('domain.create','component.create','kpi.create','component.copy')))""",
    'CREATE INDEX semantic_domains_updated ON semantic_domains(tenant_id,updated_at DESC,id ASC)',
    'CREATE INDEX semantic_components_updated ON semantic_components(tenant_id,updated_at DESC,id ASC)',
    'CREATE INDEX semantic_components_domain ON semantic_components(tenant_id,domain_id,kind,updated_at DESC,id ASC)',
    'CREATE INDEX semantic_components_origin ON semantic_components(tenant_id,copy_origin_id)',
    'CREATE INDEX semantic_kpi_updated ON semantic_kpi_definitions(tenant_id,updated_at DESC,id ASC)',
    'CREATE INDEX semantic_kpi_domain ON semantic_kpi_definitions(tenant_id,domain_id,updated_at DESC,id ASC)',
    'CREATE INDEX semantic_consumers ON semantic_kpi_components(tenant_id,component_id,kpi_id)',
    'CREATE INDEX semantic_bindings_dataset ON semantic_bindings(tenant_id,dataset_id)',
    'CREATE INDEX semantic_requests_expiry ON semantic_requests(expires_at)',
)


def apply_v4(connection: sqlite3.Connection) -> None:
    if not connection.in_transaction:
        raise RuntimeError('Semantic migration requires an active transaction')
    for statement in SEMANTIC_DDL:
        connection.execute(statement)
    connection.execute('INSERT INTO schema_migrations(version) VALUES(4)')
