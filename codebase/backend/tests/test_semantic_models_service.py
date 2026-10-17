from dataclasses import replace

import pytest

from synapse_api.errors import ApiError
from synapse_api.semantic_models.schemas import CreateModel, CloneDraft, PreviewDraft, UpdateDraft, ModelFilters
from synapse_api.semantic_catalog.schemas import SaveKpiDefinition
from semantic_models_fixtures import models_catalog


def setup(tmp_path, *, empty=False):
    from synapse_api.semantic_models.service import SemanticModelsService
    db, catalog, user, domain, measure, kpis = models_catalog(tmp_path)
    service = SemanticModelsService(db)
    body = CreateModel(name='Modelo propio', domainId=domain['id'], kpiIds=[] if empty else [k['id'] for k in kpis])
    detail = service.create(user, body, 'creation', 'req')
    return db, catalog, service, user, body, detail


def test_create_model_with_empty_draft(tmp_path):
    _, _, service, user, _, result = setup(tmp_path, empty=True)
    assert result['draft']['sequence'] == 1
    assert result['draft']['status'] == 'draft'
    assert result['draft']['semanticVersion'] is None
    assert result['draft']['capture']['kpis'] == []
    assert result['draft']['completeness'] == 'incomplete'
    assert 'kpiIds' in result['draft']['missingMetadata']
    page = service.list(user, ModelFilters(q='MODELO'))
    assert page['total'] == 1 and page['items'][0]['latestDraft']['kpiCount'] == 0
    assert service.get(user, result['model']['id']) == result


def test_retry_original_response_and_tenant_scope(tmp_path):
    _, catalog, service, user, body, result = setup(tmp_path)
    kpi = result['draft']['capture']['kpis'][0]
    catalog.update(user, 'kpi', kpi['id'], SaveKpiDefinition(name='Changed', domainId=body.domain_id), '"1"', 'req')
    assert service.create(user, body, 'creation', 'req2') == result
    with pytest.raises(ApiError) as exc:
        service.create(user, body.model_copy(update={'name': 'Other'}), 'creation', 'req3')
    assert exc.value.code == 'idempotency_conflict'
    with pytest.raises(ApiError) as exc:
        service.get(replace(user, tenant='other'), result['model']['id'])
    assert exc.value.status == 404
    revoked = replace(user, scopes=user.scopes - {'sources:read'})
    for action in [lambda: service.create(revoked, body, 'creation', 'req'), lambda: service.get(revoked, result['model']['id'])]:
        with pytest.raises(ApiError) as exc:
            action()
        assert exc.value.status == 403


def test_preview_is_read_only_and_confirm_rejects_changed_candidate(tmp_path):
    db, catalog, service, user, body, result = setup(tmp_path)
    mid, did = result['model']['id'], result['draft']['id']
    preview = service.preview(user, mid, did, PreviewDraft(kpiIds=body.kpi_ids), '"1"')
    assert preview['changes'] == []
    assert service.get_draft(user, mid, did) == result['draft']
    with db.connect() as conn:
        assert conn.execute("SELECT count(*) FROM audit_events WHERE action LIKE 'models.%'").fetchone()[0] == 1
    kpi = result['draft']['capture']['kpis'][0]
    catalog.update(user, 'kpi', kpi['id'], SaveKpiDefinition(name='Updated', domainId=body.domain_id), '"1"', 'req')
    with pytest.raises(ApiError) as exc:
        service.update(user, mid, did, UpdateDraft(kpiIds=body.kpi_ids, candidateDigest=preview['candidateDigest']), '"1"', 'req')
    assert exc.value.code == 'capture_changed'
    assert service.get_draft(user, mid, did)['revision'] == 1
    current = service.preview(user, mid, did, PreviewDraft(kpiIds=body.kpi_ids), '"1"')
    updated = service.update(user, mid, did, UpdateDraft(kpiIds=body.kpi_ids, candidateDigest=current['candidateDigest']), '"1"', 'req')
    assert updated['revision'] == 2
    assert any(k['name'] == 'Updated' for k in updated['capture']['kpis'])
    with pytest.raises(ApiError) as exc:
        service.update(user, mid, did, UpdateDraft(kpiIds=body.kpi_ids, candidateDigest=current['candidateDigest']), '"1"', 'req')
    assert exc.value.status == 412


def test_clone_preserves_history_and_is_idempotent(tmp_path):
    _, _, service, user, _, result = setup(tmp_path)
    mid, did = result['model']['id'], result['draft']['id']
    clone = service.clone(user, mid, CloneDraft(sourceDraftId=did), '"1"', 'clone', 'req')
    assert clone['sequence'] == 2 and clone['parentDraftId'] == did
    assert clone['capture'] == result['draft']['capture']
    assert service.clone(user, mid, CloneDraft(sourceDraftId=did), '"1"', 'clone', 'req') == clone
    assert service.get_draft(user, mid, did) == result['draft']
    comparison = service.compare(user, mid, did, clone['id'])
    assert comparison['changes'] == []
    with pytest.raises(ApiError) as exc:
        service.preview(user, mid, did, PreviewDraft(kpiIds=[]), '"1"')
    assert exc.value.code == 'draft_not_editable'
    history = service.list_drafts(user, mid, ModelFilters(limit=1))
    assert history['total'] == 2 and history['items'][0]['sequence'] == 2
