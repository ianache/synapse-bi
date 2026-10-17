from datetime import datetime, timedelta, timezone
import hashlib
import json
import re
import sqlite3
from uuid import uuid4

from ..database import Database
from ..dashboards import audit
from ..errors import ApiError
from .bindings import require_metadata, resolve_binding
from .policy import normalize_name
from .repository import SemanticRepository, TABLES


def authorize(user, *, write=False):
    needed = {'semantic:read', 'semantic:write'} if write else {'semantic:read'}
    if not needed.issubset(user.scopes):
        raise ApiError(403, 'permission_denied', 'No tienes permiso para realizar esta operación.')


def fingerprint(body):
    document = dict(body)
    for field in ('dimensionIds', 'measureIds', 'synonyms'):
        if field in document:
            document[field] = sorted(document[field])
    return hashlib.sha256(json.dumps(document, sort_keys=True, ensure_ascii=False, separators=(',', ':')).encode()).hexdigest()


def conflict(error):
    if 'UNIQUE constraint failed:' in str(error) and 'normalized_name' in str(error):
        raise ApiError(409, 'name_conflict', 'Ya existe un elemento con ese nombre.') from None
    raise error


class SemanticCatalogService:
    def __init__(self, database: Database):
        self.db = database

    def _validate(self, repo, kind, body):
        if kind == 'domain':
            return
        repo.row('domain', body['domainId'])
        if kind == 'kpi':
            for field, tag in [('dimensionIds', 'dimension'), ('measureIds', 'measure')]:
                for item_id in body[field]:
                    ref = repo.row('component', item_id)
                    if ref['domain_id'] != body['domainId'] or ref['kind'] != tag:
                        raise ApiError(422, 'invalid_reference', 'La referencia no es compatible con el elemento.')

    def _create(self, user, kind, model, key, request_id, *, origin=None):
        authorize(user, write=True)
        if not isinstance(key, str) or not re.fullmatch(r'[\x20-\x7e]{1,100}', key):
            raise ApiError(422, 'invalid_idempotency_key', 'Se requiere una clave de idempotencia válida.')
        body = model.model_dump(by_alias=True)
        if origin is not None or body.get('binding') is not None:
            require_metadata(user)
        operation = 'component.copy' if origin is not None else f'{kind}.create'
        target = origin or ''
        stamp = datetime.now(timezone.utc)
        digest = fingerprint(body)
        try:
            with self.db.connect(write=True) as conn:
                repo = SemanticRepository(conn, user)
                previous = conn.execute('SELECT * FROM semantic_requests WHERE tenant_id=? AND subject=? AND operation=? AND target_id=? AND key=? AND expires_at>?',
                                         (user.tenant, user.subject, operation, target, key, stamp.isoformat())).fetchone()
                if previous:
                    if previous['fingerprint'] != digest:
                        raise ApiError(409, 'idempotency_conflict', 'La clave ya se usó con otro contenido.')
                    response = json.loads(previous['response_document'])
                    if response.get('bindingSnapshot') is not None:
                        require_metadata(user)
                    return response
                snapshot = None
                if origin is not None:
                    source = repo.row('component', origin)
                    copy_name = body['name']
                    body = repo.body('component', source) | {'name': copy_name}
                    bound = repo.binding(origin)
                    snapshot = json.loads(bound['snapshot_document']) if bound else None
                else:
                    self._validate(repo, kind, body)
                    if kind == 'component':
                        snapshot = resolve_binding(conn, user, body.get('binding'))
                item_id = str(uuid4())
                repo.save(kind, item_id, body, stamp.isoformat(), copy_origin=origin)
                if kind == 'component':
                    repo.save_binding(item_id, snapshot)
                elif kind == 'kpi':
                    repo.save_references(item_id, body)
                result = repo.document(kind, repo.row(kind, item_id))
                audit(conn, user, f'semantic.{operation}', item_id, request_id)
                conn.execute('''INSERT INTO semantic_requests VALUES(?,?,?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(tenant_id,subject,operation,target_id,key) DO UPDATE SET
                    fingerprint=excluded.fingerprint,response_document=excluded.response_document,
                    resource_kind=excluded.resource_kind,resource_id=excluded.resource_id,
                    created_at=excluded.created_at,expires_at=excluded.expires_at''',
                    (user.tenant, user.subject, operation, target, key, digest, json.dumps(result, ensure_ascii=False),
                     kind, item_id, stamp.isoformat(), (stamp + timedelta(hours=24)).isoformat()))
                return result
        except sqlite3.IntegrityError as error:
            conflict(error)

    def create_domain(self, user, body, key, request_id):
        return self._create(user, 'domain', body, key, request_id)

    def create_component(self, user, body, key, request_id):
        return self._create(user, 'component', body, key, request_id)

    def create_kpi(self, user, body, key, request_id):
        return self._create(user, 'kpi', body, key, request_id)

    def copy_component(self, user, component_id, body, key, request_id):
        return self._create(user, 'component', body, key, request_id, origin=component_id)

    def get(self, user, kind, item_id):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            repo = SemanticRepository(conn, user)
            return repo.document(kind, repo.row(kind, item_id))

    def list(self, user, kind, *, q='', domain_id=None, component_kind=None, limit=25, offset=0):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            repo = SemanticRepository(conn, user)
            rows = conn.execute(f'SELECT * FROM {TABLES[kind]} WHERE tenant_id=? ORDER BY updated_at DESC,id ASC', (user.tenant,)).fetchall()
            query = normalize_name(q)
            matched = [r for r in rows if (not query or query in r['normalized_name'])
                       and (domain_id is None or (kind != 'domain' and r['domain_id'] == domain_id))
                       and (component_kind is None or (kind == 'component' and r['kind'] == component_kind))]
            return dict(items=[repo.document(kind, r) for r in matched[offset:offset + limit]], total=len(matched), limit=limit, offset=offset)

    def consumers(self, user, component_id, *, limit=25, offset=0):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            repo = SemanticRepository(conn, user)
            repo.row('component', component_id)
            rows = conn.execute('''SELECT k.id,k.name,k.version,k.domain_id FROM semantic_kpi_definitions k
                JOIN semantic_kpi_components r ON r.tenant_id=k.tenant_id AND r.kpi_id=k.id
                WHERE r.tenant_id=? AND r.component_id=? ORDER BY k.id''', (user.tenant, component_id)).fetchall()
            return dict(items=[dict(id=r['id'], name=r['name'], version=r['version'], domainId=r['domain_id']) for r in rows[offset:offset + limit]],
                        total=len(rows), limit=limit, offset=offset)

    def update(self, user, kind, item_id, model, if_match, request_id):
        authorize(user, write=True)
        body = model.model_dump(by_alias=True)
        try:
            with self.db.connect(write=True) as conn:
                repo = SemanticRepository(conn, user)
                row = repo.row(kind, item_id)
                if if_match is None:
                    raise ApiError(428, 'precondition_required', 'Se requiere If-Match para editar.')
                if not re.fullmatch(r'"[1-9][0-9]{0,18}"', if_match):
                    raise ApiError(422, 'validation_error', 'If-Match no es válido.')
                if kind == 'component' and row['protected']:
                    raise ApiError(409, 'component_protected', 'El componente está protegido; crea una copia.')
                if if_match != f'"{row["version"]}"':
                    raise ApiError(412, 'version_conflict', 'El elemento cambió; revisa la versión actual.')
                old_body = repo.body(kind, row)
                if kind != 'domain' and (body['domainId'] != row['domain_id'] or (kind == 'component' and body['kind'] != row['kind'])):
                    raise ApiError(422, 'invalid_reference', 'El dominio y tipo no pueden cambiar.')
                self._validate(repo, kind, body)
                changed_binding = kind == 'component' and old_body['binding'] != body['binding']
                if changed_binding:
                    require_metadata(user)
                    snapshot = resolve_binding(conn, user, body['binding'])
                repo.save(kind, item_id, body, datetime.now(timezone.utc).isoformat(), updating=True)
                if changed_binding:
                    repo.save_binding(item_id, snapshot)
                elif kind == 'kpi':
                    repo.save_references(item_id, body)
                result = repo.document(kind, repo.row(kind, item_id))
                audit(conn, user, f'semantic.{kind}.update', item_id, request_id)
                return result
        except sqlite3.IntegrityError as error:
            conflict(error)
