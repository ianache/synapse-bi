from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from uuid import uuid4

from synapse_api.errors import ApiError
from synapse_api.semantic_catalog.schemas import SaveDomain, SaveComponent, SaveKpiDefinition
from semantic_catalog_fixtures import catalog


def test_aggregate_read_uses_one_snapshot(tmp_path, monkeypatch):
    from synapse_api.semantic_catalog.repository import SemanticRepository
    from semantic_catalog_fixtures import shared
    _, service, user = catalog(tmp_path)
    domain, measure, kpis = shared(service, user)
    original = SemanticRepository.row
    changed = False
    def interleave(repo, kind, item_id):
        nonlocal changed
        row = original(repo, kind, item_id)
        if not changed and kind == 'kpi' and item_id == kpis[0]['id']:
            changed = True
            service.update(user, 'kpi', item_id, SaveKpiDefinition(name='New title', domainId=domain['id']), '"1"', 'r')
        return row
    monkeypatch.setattr(SemanticRepository, 'row', interleave)
    snapshot = service.get(user, 'kpi', kpis[0]['id'])
    assert snapshot['name'] == 'Entrega puntual'
    assert snapshot['measureIds'] == [measure['id']]
    assert service.get(user, 'kpi', kpis[0]['id'])['measureIds'] == []


def test_first_reference_races_component_update(tmp_path):
    _, service, user = catalog(tmp_path)
    domain = service.create_domain(user, SaveDomain(name='Logística'), 'domain', 'r')
    body = SaveComponent(name='Original', kind='measure', domainId=domain['id'])
    measure = service.create_component(user, body, 'measure', 'r')
    barrier = Barrier(2)
    def edit():
        barrier.wait(timeout=10)
        try:
            service.update(user, 'component', measure['id'], body.model_copy(update={'name': 'Before use'}), '"1"', 'r')
            return 'edited'
        except ApiError as error:
            return error.code
    def attach():
        barrier.wait(timeout=10)
        return service.create_kpi(user, SaveKpiDefinition(name='K', domainId=domain['id'], measureIds=[measure['id']]), str(uuid4()), 'r')
    with ThreadPoolExecutor(max_workers=2) as pool:
        edited, attached = pool.submit(edit), pool.submit(attach)
        result, kpi = edited.result(timeout=20), attached.result(timeout=20)
    current = service.get(user, 'component', measure['id'])
    assert current['protected'] is True
    assert current['name'] == ('Before use' if result == 'edited' else 'Original')
    assert result in {'edited', 'component_protected'}
    assert kpi['measureIds'] == [measure['id']]
