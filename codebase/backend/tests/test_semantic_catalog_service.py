from dataclasses import replace
from uuid import uuid4

import pytest

from synapse_api.errors import ApiError
from synapse_api.semantic_catalog.schemas import SaveDomain, SaveComponent, SaveKpiDefinition, CopyComponent
from semantic_catalog_fixtures import catalog, principal, shared


def test_custom_domain_shared_component_copy_changes_one_kpi(tmp_path):
    db, service, user = catalog(tmp_path)
    domain, measure, kpis = shared(service, user)
    with pytest.raises(ApiError) as blocked:
        service.update(user, 'component', measure['id'], SaveComponent(name='Changed', kind='measure', domainId=domain['id']), '"1"', 'r')
    assert blocked.value.code == 'component_protected'
    copied = service.copy_component(user, measure['id'], CopyComponent(name='Tiempo ajustado'), 'copy', 'r')
    assert copied['copyOriginId'] == measure['id'] and not copied['protected'] and copied['consumerCount'] == 0
    service.update(user, 'kpi', kpis[0]['id'], SaveKpiDefinition(name='Entrega puntual', domainId=domain['id'], measureIds=[copied['id']]), '"1"', 'r')
    assert service.get(user, 'kpi', kpis[1]['id'])['measureIds'] == [measure['id']]
    assert service.get(user, 'component', measure['id'])['name'] == 'Tiempo'
    assert service.consumers(user, measure['id'])['total'] == 1
    service.update(user, 'kpi', kpis[1]['id'], SaveKpiDefinition(name='Cumplimiento por centro', domainId=domain['id']), '"1"', 'r')
    assert service.get(user, 'component', measure['id'])['protected'] is True
    assert service.consumers(user, measure['id'])['total'] == 0
    second_copy = service.copy_component(user, measure['id'], CopyComponent(name='Otra copia'), 'copy2', 'r')
    assert second_copy['copyOriginId'] == measure['id']


def test_replay_does_not_duplicate_or_overwrite_later_edit(tmp_path):
    db, service, user = catalog(tmp_path)
    original = service.create_domain(user, SaveDomain(name=' Logística '), 'key', 'r')
    service.update(user, 'domain', original['id'], SaveDomain(name='Operaciones'), '"1"', 'r')
    assert service.create_domain(user, SaveDomain(name='Logística'), 'key', 'r') == original
    assert service.get(user, 'domain', original['id'])['name'] == 'Operaciones'
    with pytest.raises(ApiError) as error:
        service.create_domain(user, SaveDomain(name='Otro'), 'key', 'r')
    assert error.value.code == 'idempotency_conflict'
    assert service.list(user, 'domain')['total'] == 1
    with db.connect() as conn:
        assert conn.execute('SELECT count(*) FROM audit_events').fetchone()[0] == 2


@pytest.mark.parametrize('case', ['tenant', 'domain', 'type'])
def test_declared_reference_requires_visible_type_and_domain(tmp_path, case):
    db, service, user = catalog(tmp_path)
    domain, measure, _ = shared(service, user)
    actor = principal('demo-other') if case == 'tenant' else user
    target = service.create_domain(actor, SaveDomain(name='Otro'), 'other', 'r')
    ids = {'dimensionIds' if case == 'type' else 'measureIds': [measure['id']]}
    with pytest.raises(ApiError) as error:
        service.create_kpi(actor, SaveKpiDefinition(name='Invalid', domainId=target['id'] if case != 'type' else domain['id'], **ids), 'bad', 'r')
    assert error.value.status == (404 if case == 'tenant' else 422)
    assert service.list(actor, 'kpi')['total'] == (0 if case == 'tenant' else 2)


def test_stale_version_cannot_overwrite(tmp_path):
    _, service, user = catalog(tmp_path)
    item = service.create_domain(user, SaveDomain(name='A'), 'key', 'r')
    service.update(user, 'domain', item['id'], SaveDomain(name='B'), '"1"', 'r')
    for version, status in [(None, 428), ('1', 422), ('"1"', 412)]:
        with pytest.raises(ApiError) as error:
            service.update(user, 'domain', item['id'], SaveDomain(name='C'), version, 'r')
        assert error.value.status == status
    assert service.get(user, 'domain', item['id'])['name'] == 'B'


def test_audit_failure_rolls_back(tmp_path, monkeypatch):
    from synapse_api.semantic_catalog import service as module
    db, service, user = catalog(tmp_path)
    def fail(*args):
        raise RuntimeError('audit unavailable')
    monkeypatch.setattr(module, 'audit', fail)
    with pytest.raises(RuntimeError):
        service.create_domain(user, SaveDomain(name='X'), 'key', 'r')
    assert service.list(user, 'domain')['total'] == 0
    with db.connect() as conn:
        assert conn.execute('SELECT count(*) FROM semantic_requests').fetchone()[0] == 0


def test_binding_snapshot_survives_dataset_edit_and_hides_physical_names(tmp_path):
    from dataset_fixtures import seed_observation, draft_body
    from synapse_api.datasets.schemas import SaveDataset
    from synapse_api.datasets.service import DatasetService
    db, service, user = catalog(tmp_path)
    origin = seed_observation(db)
    dataset_body = draft_body(origin)
    ds = DatasetService(db).create(user, SaveDataset(**dataset_body), 'dataset', 'r')
    domain = service.create_domain(user, SaveDomain(name='Logística'), 'dom', 'r')
    body = SaveComponent(name='Ingresos', kind='measure', domainId=domain['id'], binding={'datasetId': ds.id, 'column': 'revenue "USD"'})
    measure = service.create_component(user, body, 'measure', 'r')
    assert measure['bindingStatus'] == 'current'
    dataset_body['selectedColumns'] = ['tenant_id']
    DatasetService(db).update(user, ds.id, SaveDataset(**dataset_body), '"1"', 'r')
    current = service.get(user, 'component', measure['id'])
    assert current['bindingStatus'] == 'column_removed'
    assert current['bindingSnapshot'] == measure['bindingSnapshot']
    assert service.create_component(user, body, 'measure', 'r') == measure
    updated = service.update(user, 'component', measure['id'], body.model_copy(update={'name': 'Ingresos nuevos'}), '"1"', 'r')
    assert updated['bindingSnapshot'] == measure['bindingSnapshot']
    reader = replace(user, scopes=frozenset({'semantic:read'}))
    hidden = service.get(reader, 'component', measure['id'])
    assert hidden['binding'] is None and hidden['bindingSnapshot'] is None
    assert 'revenue' not in str(hidden) and hidden['bindingStatus'] == 'unavailable'


def test_names_are_unique_per_scope_and_filters_are_stable(tmp_path):
    _, service, user = catalog(tmp_path)
    service.create_domain(user, SaveDomain(name='Logi\u0301stica'), 'a', 'r')
    with pytest.raises(ApiError) as error:
        service.create_domain(user, SaveDomain(name='LOGÍSTICA'), 'b', 'r')
    assert error.value.code == 'name_conflict'
    assert service.list(user, 'domain', q='LOGÍSTICA')['total'] == 1
    assert service.list(user, 'domain', q='%')['items'] == []


def test_semantic_editor_can_preserve_occluded_binding_but_cannot_remove_it(tmp_path):
    from dataset_fixtures import seed_observation, draft_body
    from synapse_api.datasets.schemas import SaveDataset
    from synapse_api.datasets.service import DatasetService
    db, service, admin = catalog(tmp_path)
    source = seed_observation(db)
    dataset = DatasetService(db).create(admin, SaveDataset(**draft_body(source)), 'dataset', 'r')
    domain = service.create_domain(admin, SaveDomain(name='Logística'), 'domain', 'r')
    component = service.create_component(admin, SaveComponent(name='Original', kind='measure', domainId=domain['id'],
        binding={'datasetId': dataset.id, 'column': 'revenue "USD"'}), 'component', 'r')
    editor = replace(admin, scopes=frozenset({'semantic:read', 'semantic:write'}))
    saved = service.update(editor, 'component', component['id'], SaveComponent(name='Renamed', kind='measure', domainId=domain['id']), '"1"', 'r')
    assert saved['name'] == 'Renamed' and saved['version'] == 2
    assert saved['binding'] is None and saved['bindingSnapshot'] is None
    visible = service.get(admin, 'component', component['id'])
    assert visible['bindingSnapshot'] == component['bindingSnapshot']
    with pytest.raises(ApiError) as denied:
        service.update(editor, 'component', component['id'], SaveComponent(name='Renamed', kind='measure', domainId=domain['id'], binding=None), '"2"', 'r')
    assert denied.value.status == 403
