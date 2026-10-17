"""Fixed-table SQL boundary. The service owns every transaction."""
import json

from ..errors import ApiError
from .bindings import binding_state
from .policy import missing_metadata, normalize_name

TABLES = {'domain': 'semantic_domains', 'component': 'semantic_components', 'kpi': 'semantic_kpi_definitions'}


class SemanticRepository:
    def __init__(self, connection, user):
        self.conn, self.user = connection, user

    def row(self, kind, item_id):
        row = self.conn.execute(f'SELECT * FROM {TABLES[kind]} WHERE tenant_id=? AND id=?',
                                (self.user.tenant, item_id)).fetchone()
        if row is None:
            raise ApiError(404, 'not_found', 'Elemento no disponible.')
        return row

    def body(self, kind, row):
        body = {'name': row['name']}
        if kind == 'domain':
            return body | {'description': row['description'], 'owner': row['owner']}
        body |= json.loads(row['metadata_document']) | {'domainId': row['domain_id']}
        if kind == 'component':
            bound = self.binding(row['id'])
            body |= {'kind': row['kind'], 'binding': None if bound is None else {
                'datasetId': bound['dataset_id'], 'column': bound['column_name']}}
        else:
            refs = self.conn.execute('SELECT component_id,kind FROM semantic_kpi_components WHERE tenant_id=? AND kpi_id=? ORDER BY component_id',
                                      (self.user.tenant, row['id'])).fetchall()
            body |= {field: [r['component_id'] for r in refs if r['kind'] == tag]
                     for field, tag in [('dimensionIds', 'dimension'), ('measureIds', 'measure')]}
        return body

    def binding(self, component_id):
        return self.conn.execute('SELECT * FROM semantic_bindings WHERE tenant_id=? AND component_id=?',
                                  (self.user.tenant, component_id)).fetchone()

    def document(self, kind, row):
        doc = self.body(kind, row)
        warnings = []
        doc |= dict(id=row['id'], version=row['version'], createdAt=row['created_at'], updatedAt=row['updated_at'],
                    status='draft', governanceValidation='pending')
        missing = missing_metadata(kind, doc)
        if kind == 'component':
            binding, snapshot, state = binding_state(self.conn, self.user, self.binding(row['id']))
            doc |= dict(binding=binding, bindingSnapshot=snapshot, bindingStatus=state,
                        copyOriginId=row['copy_origin_id'], protected=bool(row['protected']),
                        consumerCount=self.conn.execute('SELECT count(*) FROM semantic_kpi_components WHERE tenant_id=? AND component_id=?',
                                                        (self.user.tenant, row['id'])).fetchone()[0])
            if state not in {'current', 'absent'}:
                warnings.append({'dataset_changed': 'binding_dataset_changed', 'column_removed': 'binding_column_removed',
                                 'unavailable': 'binding_unavailable'}[state])
                if 'binding' not in missing:
                    missing.append('binding')
        elif kind == 'kpi':
            for item_id in doc['dimensionIds'] + doc['measureIds']:
                component = self.document('component', self.row('component', item_id))
                missing += [f'components.{item_id}.{field}' for field in component['missingMetadata']]
                warnings.extend(component['warnings'])
        return doc | dict(completeness='incomplete' if missing else 'complete', missingMetadata=missing,
                          warnings=sorted(set(warnings)))

    def save(self, kind, item_id, body, timestamp, *, updating=False, copy_origin=None):
        tenant = self.user.tenant
        if kind == 'domain':
            values = (body['name'], normalize_name(body['name']), body['description'], body['owner'], timestamp)
            if updating:
                self.conn.execute('UPDATE semantic_domains SET name=?,normalized_name=?,description=?,owner=?,updated_at=?,version=version+1 WHERE tenant_id=? AND id=?',
                                  (*values, tenant, item_id))
            else:
                self.conn.execute('INSERT INTO semantic_domains(name,normalized_name,description,owner,updated_at,tenant_id,id,created_by,created_at,version) VALUES(?,?,?,?,?,?,?,?,?,1)',
                                  (*values, tenant, item_id, self.user.subject, timestamp))
            return
        metadata = {k: v for k, v in body.items() if k not in {'name', 'domainId', 'kind', 'binding', 'dimensionIds', 'measureIds'}}
        values = (body['name'], normalize_name(body['name']), json.dumps(metadata, ensure_ascii=False), timestamp)
        if updating:
            self.conn.execute(f'UPDATE {TABLES[kind]} SET name=?,normalized_name=?,metadata_document=?,updated_at=?,version=version+1 WHERE tenant_id=? AND id=?',
                              (*values, tenant, item_id))
        elif kind == 'component':
            self.conn.execute('INSERT INTO semantic_components(name,normalized_name,metadata_document,updated_at,tenant_id,id,domain_id,kind,copy_origin_id,created_by,created_at,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,1)',
                              (*values, tenant, item_id, body['domainId'], body['kind'], copy_origin, self.user.subject, timestamp))
        else:
            self.conn.execute('INSERT INTO semantic_kpi_definitions(name,normalized_name,metadata_document,updated_at,tenant_id,id,domain_id,created_by,created_at,version) VALUES(?,?,?,?,?,?,?,?,?,1)',
                              (*values, tenant, item_id, body['domainId'], self.user.subject, timestamp))

    def save_binding(self, component_id, snapshot):
        self.conn.execute('DELETE FROM semantic_bindings WHERE tenant_id=? AND component_id=?', (self.user.tenant, component_id))
        if snapshot is not None:
            self.conn.execute('INSERT INTO semantic_bindings VALUES(?,?,?,?,?,?)',
                              (self.user.tenant, component_id, snapshot['datasetId'], snapshot['column'],
                               snapshot['datasetVersion'], json.dumps(snapshot, ensure_ascii=False)))

    def save_references(self, kpi_id, body):
        self.conn.execute('DELETE FROM semantic_kpi_components WHERE tenant_id=? AND kpi_id=?', (self.user.tenant, kpi_id))
        for field, kind in [('dimensionIds', 'dimension'), ('measureIds', 'measure')]:
            for item_id in body[field]:
                self.conn.execute('INSERT INTO semantic_kpi_components VALUES(?,?,?,?,?)',
                                  (self.user.tenant, kpi_id, item_id, body['domainId'], kind))
                self.conn.execute('UPDATE semantic_components SET protected=1 WHERE tenant_id=? AND id=?',
                                  (self.user.tenant, item_id))
