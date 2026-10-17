"""Capture authorized catalog declarations only; never connect to physical sources."""
import hashlib
import json

from ..errors import ApiError
from ..semantic_catalog.repository import SemanticRepository
from .schemas import Capture, PreviewDraft

READ_SCOPES = frozenset({'models:read', 'semantic:read', 'datasets:read', 'sources:read'})


def authorize(user, *, write=False):
    scopes = READ_SCOPES | ({'models:write', 'semantic:write'} if write else set())
    if not scopes.issubset(user.scopes):
        raise ApiError(403, 'permission_denied', 'No tienes permiso para realizar esta operación.')


def canonical(document: dict) -> str:
    return json.dumps(document, sort_keys=True, ensure_ascii=False, separators=(',', ':'))


def capture_digest(capture: dict) -> str:
    return hashlib.sha256(canonical(capture).encode('utf-8')).hexdigest()


def capture_catalog(conn, user, domain_id: str, kpi_ids: list[str]) -> dict:
    authorize(user)
    ids = PreviewDraft(kpiIds=kpi_ids).kpi_ids
    repo = SemanticRepository(conn, user)
    domain = repo.row('domain', domain_id)
    kpis, components = [], {}
    for item_id in ids:
        row = repo.row('kpi', item_id)
        if row['domain_id'] != domain_id:
            raise ApiError(422, 'invalid_reference', 'La referencia no es compatible con el modelo.')
        body = repo.body('kpi', row)
        kpis.append(body | {'id': row['id'], 'version': row['version']})
        for field, kind in [('dimensionIds', 'dimension'), ('measureIds', 'measure')]:
            for ref_id in body[field]:
                if ref_id in components:
                    continue
                ref = repo.row('component', ref_id)
                if ref['domain_id'] != domain_id or ref['kind'] != kind:
                    raise ApiError(422, 'invalid_reference', 'La referencia no es compatible con el modelo.')
                binding = repo.binding(ref_id)
                snapshot = json.loads(binding['snapshot_document']) if binding else None
                if binding:
                    available = conn.execute('SELECT 1 FROM dataset_registry WHERE tenant_id=? AND id=?',
                                             (user.tenant, binding['dataset_id'])).fetchone()
                    if not available:
                        raise ApiError(404, 'not_found', 'Referencia no disponible.')
                components[ref_id] = repo.body('component', ref) | {
                    'id': ref['id'], 'version': ref['version'], 'bindingSnapshot': snapshot}
                if len(components) > 1000:
                    raise ApiError(409, 'capture_too_large', 'La captura supera el límite permitido.')
    result = Capture.model_validate({'domain': {'id': domain['id'], 'version': domain['version'], 'name': domain['name']},
                                    'kpis': sorted(kpis, key=lambda k: k['id']),
                                    'components': [components[k] for k in sorted(components)]}).model_dump(by_alias=True)
    if len(canonical(result).encode('utf-8')) > 8 * 1024 * 1024:
        raise ApiError(409, 'capture_too_large', 'La captura supera el límite permitido.')
    return result
