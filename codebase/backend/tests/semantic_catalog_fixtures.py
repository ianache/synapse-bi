from uuid import uuid4

from synapse_api.auth import Principal
from synapse_api.database import Database

SCOPES = frozenset({'semantic:read', 'semantic:write', 'datasets:read', 'datasets:write', 'sources:read'})


def principal(tenant='demo-global', scopes=SCOPES):
    return Principal('admin', tenant, 'Administrador', scopes)


def catalog(tmp_path):
    from synapse_api.semantic_catalog.service import SemanticCatalogService
    db = Database(tmp_path / 'catalog.db')
    db.initialize()
    return db, SemanticCatalogService(db), principal()


def shared(service, user):
    from synapse_api.semantic_catalog.schemas import SaveDomain, SaveComponent, SaveKpiDefinition
    domain = service.create_domain(user, SaveDomain(name='Logística'), str(uuid4()), 'req')
    measure = service.create_component(user, SaveComponent(name='Tiempo', kind='measure', domainId=domain['id']), str(uuid4()), 'req')
    kpis = [service.create_kpi(user, SaveKpiDefinition(name=name, domainId=domain['id'], measureIds=[measure['id']]), str(uuid4()), 'req')
            for name in ['Entrega puntual', 'Cumplimiento por centro']]
    return domain, measure, kpis
