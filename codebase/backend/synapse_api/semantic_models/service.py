"""Atomic model/draft operations. No query execution or publication."""
from datetime import datetime, timedelta, timezone
import json
import re
import sqlite3
from uuid import uuid4

from ..dashboards import audit
from ..errors import ApiError
from ..semantic_catalog.policy import missing_metadata, normalize_name
from .capture import authorize, canonical, capture_catalog, capture_digest
from .diff import compare_captures
from .repository import ModelRepository
from .schemas import Model, Draft, DraftSummary


def _match(etag, revision):
    if etag is None:
        raise ApiError(428, 'precondition_required', 'Se requiere If-Match.')
    if not isinstance(etag, str) or not re.fullmatch(r'"[1-9][0-9]{0,18}"', etag):
        raise ApiError(422, 'validation_error', 'If-Match no es válido.')
    if etag != f'"{revision}"':
        raise ApiError(412, 'version_conflict', 'La versión cambió; conserva y revisa tus cambios.')


def _model(row):
    return Model.model_validate({field: row[field] for field in
        ['id', 'domain_id', 'name', 'description', 'created_by', 'created_at', 'updated_at', 'revision']}).model_dump(by_alias=True)


def _draft(row):
    capture = json.loads(row['capture_document'])
    missing = [] if capture['kpis'] else ['kpiIds']
    for kind, key in [('kpi', 'kpis'), ('component', 'components')]:
        for item in capture[key]:
            missing += [f'{key}.{item["id"]}.{field}' for field in missing_metadata(kind, item)]
    result = {field: row[field] for field in ['id', 'model_id', 'sequence', 'revision', 'status',
        'semantic_version', 'captured_at', 'created_by', 'created_at', 'updated_at', 'parent_draft_id']}
    result |= {'capture': capture, 'capture_digest': row['capture_digest'],
               'kpi_ids': json.loads(row['kpi_ids_document']), 'missing_metadata': missing,
               'completeness': 'incomplete' if missing else 'complete'}
    return Draft.model_validate(result).model_dump(by_alias=True)


def _summary(row):
    capture = json.loads(row['capture_document'])
    result = {field: row[field] for field in ['id', 'sequence', 'revision', 'status', 'semantic_version', 'captured_at', 'updated_at']}
    result |= {'kpi_count': len(capture['kpis']), 'component_count': len(capture['components'])}
    return DraftSummary.model_validate(result).model_dump(by_alias=True)


class SemanticModelsService:
    def __init__(self, database):
        self.db = database

    def _latest(self, conn, user, model_id):
        row = conn.execute('SELECT * FROM models_drafts WHERE tenant_id=? AND model_id=? ORDER BY sequence DESC LIMIT 1',
                           (user.tenant, model_id)).fetchone()
        if row is None:
            raise ApiError(404, 'not_found', 'Borrador no disponible.')
        return row

    def _editable(self, conn, user, row):
        if self._latest(conn, user, row['model_id'])['id'] != row['id']:
            raise ApiError(409, 'draft_not_editable', 'Sólo el último borrador puede actualizarse.')

    def _replay(self, conn, user, operation, target, key, body, now):
        if not isinstance(key, str) or not re.fullmatch(r'[\x20-\x7e]{1,100}', key):
            raise ApiError(422, 'invalid_idempotency_key', 'Se requiere una clave de idempotencia válida.')
        digest = capture_digest(body)
        previous = conn.execute('''SELECT * FROM models_requests WHERE tenant_id=? AND subject=? AND operation=?
            AND target_id=? AND key=? AND expires_at>?''',
            (user.tenant, user.subject, operation, target, key, now.isoformat())).fetchone()
        if previous:
            if previous['fingerprint'] != digest:
                raise ApiError(409, 'idempotency_conflict', 'La clave ya se usó con otro contenido.')
            return json.loads(previous['response_document'])
        return None

    def _remember(self, conn, user, operation, target, key, body, result, now):
        conn.execute('''INSERT INTO models_requests VALUES(?,?,?,?,?,?,?,?,?)
            ON CONFLICT(tenant_id,subject,operation,target_id,key) DO UPDATE SET
            fingerprint=excluded.fingerprint,response_document=excluded.response_document,
            created_at=excluded.created_at,expires_at=excluded.expires_at''',
            (user.tenant, user.subject, operation, target, key, capture_digest(body), canonical(result),
             now.isoformat(), (now + timedelta(hours=24)).isoformat()))

    def _insert_draft(self, conn, user, model, capture, sequence, timestamp, parent=None):
        item_id = str(uuid4())
        conn.execute('''INSERT INTO models_drafts VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
            (user.tenant, item_id, model['id'], model['domain_id'], sequence, 1, 'draft', None,
             parent, canonical([k['id'] for k in capture['kpis']]), canonical(capture), capture_digest(capture),
             timestamp, user.subject, timestamp, timestamp))
        return ModelRepository(conn, user).draft(model['id'], item_id)

    def create(self, user, body, key, request_id):
        authorize(user, write=True)
        data, now = body.model_dump(by_alias=True), datetime.now(timezone.utc)
        try:
            with self.db.connect(write=True) as conn:
                previous = self._replay(conn, user, 'model.create', '', key, data, now)
                if previous is not None:
                    return previous
                capture = capture_catalog(conn, user, body.domain_id, body.kpi_ids)
                item_id, timestamp = str(uuid4()), now.isoformat()
                conn.execute('INSERT INTO models_registry VALUES(?,?,?,?,?,?,?,?,?,?)',
                    (user.tenant, item_id, body.domain_id, body.name, normalize_name(body.name), body.description,
                     user.subject, timestamp, timestamp, 1))
                model = ModelRepository(conn, user).model(item_id)
                draft = self._insert_draft(conn, user, model, capture, 1, timestamp)
                result = {'model': _model(model), 'draft': _draft(draft)}
                audit(conn, user, 'models.create', item_id, request_id)
                self._remember(conn, user, 'model.create', '', key, data, result, now)
                return result
        except sqlite3.IntegrityError as exc:
            if 'normalized_name' in str(exc):
                raise ApiError(409, 'name_conflict', 'Ya existe un modelo con ese nombre en el dominio.') from None
            raise

    def get(self, user, model_id):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            row = ModelRepository(conn, user).model(model_id)
            return {'model': _model(row), 'draft': _draft(self._latest(conn, user, model_id))}

    def get_draft(self, user, model_id, draft_id):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            return _draft(ModelRepository(conn, user).draft(model_id, draft_id))

    def list(self, user, filters):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            rows = conn.execute('SELECT * FROM models_registry WHERE tenant_id=? ORDER BY updated_at DESC,id ASC',
                                (user.tenant,)).fetchall()
            query = normalize_name(filters.q)
            rows = [row for row in rows if (not query or query in row['normalized_name']) and
                    (filters.domain_id is None or filters.domain_id == row['domain_id'])]
            items = [_model(row) | {'latestDraft': _summary(self._latest(conn, user, row['id']))}
                     for row in rows[filters.offset:filters.offset + filters.limit]]
            return {'items': items, 'total': len(rows), 'limit': filters.limit, 'offset': filters.offset}

    def list_drafts(self, user, model_id, filters):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            ModelRepository(conn, user).model(model_id)
            total = conn.execute('SELECT count(*) FROM models_drafts WHERE tenant_id=? AND model_id=?',
                                 (user.tenant, model_id)).fetchone()[0]
            rows = conn.execute('''SELECT * FROM models_drafts WHERE tenant_id=? AND model_id=?
                ORDER BY sequence DESC,id ASC LIMIT ? OFFSET ?''',
                (user.tenant, model_id, filters.limit, filters.offset)).fetchall()
            return {'items': [_summary(row) for row in rows],
                    'total': total, 'limit': filters.limit, 'offset': filters.offset}

    def clone(self, user, model_id, body, etag, key, request_id):
        authorize(user, write=True)
        data, now = body.model_dump(by_alias=True), datetime.now(timezone.utc)
        with self.db.connect(write=True) as conn:
            repo = ModelRepository(conn, user)
            model = repo.model(model_id)
            previous = self._replay(conn, user, 'draft.clone', model_id, key, data, now)
            if previous is not None:
                return previous
            _match(etag, model['revision'])
            source = repo.draft(model_id, body.source_draft_id)
            latest = self._latest(conn, user, model_id)
            row = self._insert_draft(conn, user, model, json.loads(source['capture_document']),
                                     latest['sequence'] + 1, now.isoformat(), source['id'])
            conn.execute('UPDATE models_registry SET revision=revision+1,updated_at=? WHERE tenant_id=? AND id=?',
                         (now.isoformat(), user.tenant, model_id))
            result = _draft(row)
            audit(conn, user, 'models.draft.clone', row['id'], request_id)
            self._remember(conn, user, 'draft.clone', model_id, key, data, result, now)
            return result

    def preview(self, user, model_id, draft_id, body, etag):
        authorize(user, write=True)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            row = ModelRepository(conn, user).draft(model_id, draft_id)
            _match(etag, row['revision'])
            self._editable(conn, user, row)
            capture = capture_catalog(conn, user, row['domain_id'], body.kpi_ids)
            return {'candidateDigest': capture_digest(capture), 'candidateCapture': capture,
                    'changes': compare_captures(json.loads(row['capture_document']), capture),
                    'checkedAt': datetime.now(timezone.utc).isoformat(), 'baseRevision': row['revision']}

    def update(self, user, model_id, draft_id, body, etag, request_id):
        authorize(user, write=True)
        with self.db.connect(write=True) as conn:
            repo = ModelRepository(conn, user)
            row = repo.draft(model_id, draft_id)
            _match(etag, row['revision'])
            self._editable(conn, user, row)
            capture = capture_catalog(conn, user, row['domain_id'], body.kpi_ids)
            if capture_digest(capture) != body.candidate_digest:
                raise ApiError(409, 'capture_changed', 'El catálogo cambió; vuelve a comparar antes de confirmar.')
            timestamp = datetime.now(timezone.utc).isoformat()
            conn.execute('''UPDATE models_drafts SET kpi_ids_document=?,capture_document=?,capture_digest=?,
                captured_at=?,updated_at=?,revision=revision+1 WHERE tenant_id=? AND model_id=? AND id=?''',
                (canonical(body.kpi_ids), canonical(capture), body.candidate_digest, timestamp, timestamp,
                 user.tenant, model_id, draft_id))
            conn.execute('UPDATE models_registry SET revision=revision+1,updated_at=? WHERE tenant_id=? AND id=?',
                         (timestamp, user.tenant, model_id))
            result = _draft(repo.draft(model_id, draft_id))
            audit(conn, user, 'models.draft.update', draft_id, request_id)
            return result

    def compare(self, user, model_id, left_id, right_id):
        authorize(user)
        with self.db.connect() as conn:
            conn.execute('BEGIN')
            repo = ModelRepository(conn, user)
            left, right = repo.draft(model_id, left_id), repo.draft(model_id, right_id)
            return {'left': _summary(left), 'right': _summary(right),
                    'changes': compare_captures(json.loads(left['capture_document']), json.loads(right['capture_document']))}
