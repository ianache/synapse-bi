"""Additive v5. The caller owns the transaction and rollback."""
import sqlite3

MODELS_DDL = (
    '''CREATE TABLE models_registry(
      tenant_id TEXT NOT NULL,id TEXT NOT NULL,domain_id TEXT NOT NULL,
      name TEXT NOT NULL,normalized_name TEXT NOT NULL,description TEXT NOT NULL,
      created_by TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK(revision>=1), PRIMARY KEY(tenant_id,id),
      UNIQUE(tenant_id,domain_id,normalized_name),UNIQUE(tenant_id,domain_id,id),
      FOREIGN KEY(tenant_id,domain_id) REFERENCES semantic_domains(tenant_id,id) ON DELETE RESTRICT)''',
    '''CREATE TABLE models_drafts(
      tenant_id TEXT NOT NULL,id TEXT NOT NULL,model_id TEXT NOT NULL,domain_id TEXT NOT NULL,
      sequence INTEGER NOT NULL CHECK(sequence>=1),revision INTEGER NOT NULL CHECK(revision>=1),
      status TEXT NOT NULL CHECK(status='draft'),semantic_version TEXT CHECK(semantic_version IS NULL),
      parent_draft_id TEXT,kpi_ids_document TEXT NOT NULL,capture_document TEXT NOT NULL,
      capture_digest TEXT NOT NULL,captured_at TEXT NOT NULL,created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(tenant_id,id),
      UNIQUE(tenant_id,model_id,sequence),UNIQUE(tenant_id,model_id,id),
      CHECK(parent_draft_id IS NULL OR parent_draft_id!=id),
      FOREIGN KEY(tenant_id,domain_id,model_id) REFERENCES models_registry(tenant_id,domain_id,id) ON DELETE RESTRICT,
      FOREIGN KEY(tenant_id,model_id,parent_draft_id) REFERENCES models_drafts(tenant_id,model_id,id) ON DELETE RESTRICT)''',
    '''CREATE TABLE models_requests(
      tenant_id TEXT NOT NULL,subject TEXT NOT NULL,operation TEXT NOT NULL,
      target_id TEXT NOT NULL,key TEXT NOT NULL,fingerprint TEXT NOT NULL,
      response_document TEXT NOT NULL,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,
      PRIMARY KEY(tenant_id,subject,operation,target_id,key),
      CHECK(operation IN ('model.create','draft.clone')))''',
    'CREATE INDEX models_updated ON models_registry(tenant_id,updated_at DESC,id ASC)',
    'CREATE INDEX models_domain ON models_registry(tenant_id,domain_id,updated_at DESC,id ASC)',
    'CREATE INDEX models_sequences ON models_drafts(tenant_id,model_id,sequence DESC)',
    'CREATE INDEX models_requests_expiry ON models_requests(expires_at)',
)


def apply_v5(connection: sqlite3.Connection) -> None:
    if not connection.in_transaction:
        raise RuntimeError('Model migration requires an active transaction')
    for statement in MODELS_DDL:
        connection.execute(statement)
    connection.execute('INSERT INTO schema_migrations(version) VALUES(5)')
