"""Resolve registered metadata only; never connect to a source or execute a formula."""
import json

from ..errors import ApiError

METADATA_SCOPES = frozenset({'datasets:read', 'sources:read'})


def require_metadata(user):
    if not METADATA_SCOPES.issubset(user.scopes):
        raise ApiError(403, 'permission_denied', 'No tienes permiso para realizar esta operación.')


def resolve_binding(conn, user, binding):
    if binding is None:
        return None
    require_metadata(user)
    row = conn.execute('SELECT * FROM dataset_registry WHERE tenant_id=? AND id=?',
                       (user.tenant, binding['datasetId'])).fetchone()
    if row is None:
        raise ApiError(404, 'not_found', 'Referencia no disponible.')
    selected = conn.execute('SELECT 1 FROM dataset_columns WHERE tenant_id=? AND dataset_id=? AND column_name=?',
                            (user.tenant, row['id'], binding['column'])).fetchone()
    if selected is None:
        raise ApiError(422, 'invalid_reference', 'La columna no pertenece a la selección vigente.')
    column = next((c for c in json.loads(row['source_metadata_document'])['columns'] if c['name'] == binding['column']), None)
    if column is None:
        raise ApiError(422, 'invalid_reference', 'Referencia no disponible.')
    return dict(datasetId=row['id'], datasetVersion=row['version'], sourceId=row['source_id'],
                observationId=row['observation_id'], schema=row['schema_name'], object=row['object_name'],
                column=binding['column'], columnType=column['type'])


def binding_state(conn, user, binding_row):
    if binding_row is None:
        return None, None, 'absent'
    if not METADATA_SCOPES.issubset(user.scopes):
        return None, None, 'unavailable'
    snapshot = json.loads(binding_row['snapshot_document'])
    binding = {'datasetId': binding_row['dataset_id'], 'column': binding_row['column_name']}
    dataset = conn.execute('SELECT version FROM dataset_registry WHERE tenant_id=? AND id=?',
                           (user.tenant, binding['datasetId'])).fetchone()
    if dataset is None:
        return binding, snapshot, 'unavailable'
    selected = conn.execute('SELECT 1 FROM dataset_columns WHERE tenant_id=? AND dataset_id=? AND column_name=?',
                            (user.tenant, binding['datasetId'], binding['column'])).fetchone()
    status = 'column_removed' if selected is None else ('dataset_changed' if dataset['version'] != snapshot['datasetVersion'] else 'current')
    return binding, snapshot, status
