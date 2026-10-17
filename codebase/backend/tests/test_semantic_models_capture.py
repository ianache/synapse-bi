from dataclasses import replace

import pytest

from synapse_api.errors import ApiError
from semantic_models_fixtures import models_catalog, large_catalog


def test_shared_dimension_once_and_digest_ignores_selection_order(tmp_path):
    from synapse_api.semantic_models.capture import capture_catalog, capture_digest
    db, _, user, domain, measure, kpis = models_catalog(tmp_path)
    with db.connect() as conn:
        conn.execute('BEGIN')
        capture = capture_catalog(conn, user, domain['id'], [k['id'] for k in kpis])
        reverse = capture_catalog(conn, user, domain['id'], [k['id'] for k in reversed(kpis)])
    assert len(capture['kpis']) == 2
    assert [c['id'] for c in capture['components']] == [measure['id']]
    assert capture_digest(capture) == capture_digest(reverse)
    assert 'consumerCount' not in capture['components'][0]
    assert 'protected' not in capture['components'][0]
    assert capture['components'][0]['bindingSnapshot'] is None


def test_missing_hidden_wrong_domain(tmp_path):
    from synapse_api.semantic_models.capture import capture_catalog
    from synapse_api.semantic_catalog.schemas import SaveDomain
    from uuid import uuid4
    db, service, user, domain, _, kpis = models_catalog(tmp_path)
    other_domain = service.create_domain(user, SaveDomain(name='Otro'), str(uuid4()), 'req')
    cases = [(user, [str(uuid4())], domain['id'], 404),
             (replace(user, tenant='other'), [kpis[0]['id']], domain['id'], 404),
             (user, [kpis[0]['id']], other_domain['id'], 422),
             (replace(user, scopes=user.scopes - {'sources:read'}), [kpis[0]['id']], domain['id'], 403)]
    with db.connect() as conn:
        for actor, ids, dom, status in cases:
            with pytest.raises(ApiError) as exc:
                capture_catalog(conn, actor, dom, ids)
            assert exc.value.status == status


def test_limits_do_not_truncate_components(tmp_path):
    from synapse_api.semantic_models.capture import capture_catalog
    db, _, user, domain, _, _ = models_catalog(tmp_path)
    ids = large_catalog(db, user, domain['id'], 1001)
    with db.connect() as conn, pytest.raises(ApiError) as exc:
        capture_catalog(conn, user, domain['id'], ids)
    assert exc.value.code == 'capture_too_large'


def test_capture_byte_limit_does_not_truncate(tmp_path):
    from synapse_api.semantic_models.capture import capture_catalog
    db, _, user, domain, _, _ = models_catalog(tmp_path)
    ids = large_catalog(db, user, domain['id'], 1000, full=True)
    with db.connect() as conn, pytest.raises(ApiError) as exc:
        capture_catalog(conn, user, domain['id'], ids)
    assert exc.value.code == 'capture_too_large'
