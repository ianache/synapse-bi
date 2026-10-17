from synapse_api.database import Database
from synapse_api.semantic_catalog.schemas import CopyComponent
from semantic_catalog_fixtures import catalog, shared


def test_restart_preserves_references_copy_protection_and_replay(tmp_path):
    from synapse_api.semantic_catalog.service import SemanticCatalogService
    db, service, user = catalog(tmp_path)
    domain, measure, kpis = shared(service, user)
    copied = service.copy_component(user, measure['id'], CopyComponent(name='Copy'), 'copy', 'r')
    restarted_db = Database(db.path)
    restarted_db.initialize()
    restarted = SemanticCatalogService(restarted_db)
    assert restarted.get(user, 'kpi', kpis[0]['id'])['measureIds'] == [measure['id']]
    assert restarted.get(user, 'component', measure['id'])['protected'] is True
    assert restarted.copy_component(user, measure['id'], CopyComponent(name='Copy'), 'copy', 'r') == copied
