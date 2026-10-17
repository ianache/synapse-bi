from dataclasses import replace
from uuid import uuid4

from semantic_catalog_fixtures import catalog, shared


def models_catalog(tmp_path):
    db, service, user = catalog(tmp_path)
    user = replace(user, scopes=user.scopes | {'models:read', 'models:write'})
    domain, measure, kpis = shared(service, user)
    return db, service, user, domain, measure, kpis


def large_catalog(db, user, domain_id, component_count, *, full=False):
    from synapse_api.semantic_catalog.repository import SemanticRepository
    from synapse_api.semantic_catalog.schemas import SaveComponent, SaveKpiDefinition
    with db.connect(write=True) as conn:
        repo = SemanticRepository(conn, user)
        ids = [str(uuid4()) for _ in range(component_count)]
        for i, item_id in enumerate(ids):
            body = SaveComponent(name=f'Medida {i}', kind='measure', domainId=domain_id,
                **({'definition': 'd' * 2000, 'grain': 'g' * 500, 'unit': 'u' * 500,
                    'aggregation': 'a' * 500, 'synonyms': [str(j).zfill(100) for j in range(20)]} if full else {}))
            repo.save('component', item_id, body.model_dump(by_alias=True), 'now')
        kpi_ids = []
        groups = [ids[i:i+100] for i in range(0, len(ids), 100)]
        for i in range(100 if full else len(groups)):
            item_id = str(uuid4())
            metadata = ({'definition': 'd'*2000, 'formula': 'x'*8000,
                **{k: 's'*500 for k in ['unit', 'grain', 'owner', 'steward', 'classification', 'accessPolicy', 'freshnessExpectation', 'qualityExpectation']},
                **{k: 'l'*2000 for k in ['filters', 'nullPolicy', 'returnPolicy', 'lateDataPolicy']}} if full else {})
            body = SaveKpiDefinition(name=f'KPI {i}', domainId=domain_id,
                                    measureIds=groups[i % len(groups)], **metadata)
            data = body.model_dump(by_alias=True)
            repo.save('kpi', item_id, data, 'now')
            repo.save_references(item_id, data)
            kpi_ids.append(item_id)
    return kpi_ids
