"""Catch invalid drafts, coercion, unbounded text and false documentation readiness."""
from uuid import uuid4

import pytest
from pydantic import ValidationError


def models():
    from synapse_api.semantic_catalog.schemas import SaveDomain, SaveComponent, SaveKpiDefinition
    return SaveDomain, SaveComponent, SaveKpiDefinition


def test_minimum_drafts_and_missing_metadata():
    from synapse_api.semantic_catalog.policy import missing_metadata
    Domain, Component, Kpi = models()
    domain = str(uuid4())
    assert missing_metadata('domain', Domain(name='Logística').model_dump(by_alias=True)) == ['description', 'owner']
    dim = Component(name='Centro', kind='dimension', domainId=domain)
    assert missing_metadata('component', dim.model_dump(by_alias=True)) == ['definition', 'grain', 'binding']
    measure = Component(name='Tiempo', kind='measure', domainId=domain)
    assert missing_metadata('component', measure.model_dump(by_alias=True)) == ['definition', 'grain', 'binding', 'unit', 'aggregation']
    draft = Kpi(name='Entrega', domainId=domain)
    pending = missing_metadata('kpi', draft.model_dump(by_alias=True))
    assert 'formula' in pending and 'dimensionIds' in pending and 'measureIds' in pending
    assert 'validFrom' in pending and 'validTo' not in pending


@pytest.mark.parametrize('value', ['', '   ', '\n', 'a\x00b', 'x' * 101, 12, True])
def test_rejects_blank_name_unknown_fields_and_contract_limits(value):
    Domain, _, _ = models()
    with pytest.raises(ValidationError):
        Domain(name=value)


@pytest.mark.parametrize('field,limit', [('description', 2000), ('owner', 500)])
def test_domain_text_boundaries(field, limit):
    Domain, _, _ = models()
    assert getattr(Domain(name='X', **{field: 'a' * limit}), field) == 'a' * limit
    with pytest.raises(ValidationError):
        Domain(name='X', **{field: 'a' * (limit + 1)})


def test_unicode_name_normalization():
    from synapse_api.semantic_catalog.policy import normalize_name
    Domain, _, _ = models()
    assert Domain(name='  Logi\u0301stica  ').name == 'Logística'
    assert normalize_name(' LOGI\u0301STICA ') == 'logística'
    with pytest.raises(ValidationError):
        Domain(name='X', tenant='foreign')


def test_component_types_binding_and_synonyms_are_strict():
    _, Component, _ = models()
    body = dict(name='X', domainId=str(uuid4()), kind='dimension')
    for extra in [dict(unit='USD'), dict(aggregation='sum'), dict(synonyms=['x', 'x']),
                  dict(synonyms=['x'] * 21), dict(binding={'datasetId': str(uuid4())}),
                  dict(binding={'datasetId': str(uuid4()), 'column': 'a', 'tenant': 'x'}),
                  dict(domainId='not-a-uuid'), dict(protected=True)]:
        with pytest.raises(ValidationError):
            Component(**(body | extra))
    assert Component(**body, synonyms=['Zona']).synonyms == ['Zona']


@pytest.mark.parametrize('field,limit', [('definition', 2000), ('grain', 500), ('unit', 500), ('aggregation', 500)])
def test_component_text_boundaries(field, limit):
    _, Component, _ = models()
    body = dict(name='X', domainId=str(uuid4()), kind='measure')
    Component(**body, **{field: 'a' * limit})
    with pytest.raises(ValidationError):
        Component(**body, **{field: 'a' * (limit + 1)})


@pytest.mark.parametrize('field,limit', [('definition', 2000), ('formula', 8000), ('unit', 500), ('grain', 500),
    ('owner', 500), ('steward', 500), ('classification', 500), ('accessPolicy', 500),
    ('freshnessExpectation', 500), ('qualityExpectation', 500), ('filters', 2000),
    ('nullPolicy', 2000), ('returnPolicy', 2000), ('lateDataPolicy', 2000)])
def test_kpi_text_boundaries(field, limit):
    _, _, Kpi = models()
    body = dict(name='X', domainId=str(uuid4()))
    Kpi(**body, **{field: 'a' * limit})
    with pytest.raises(ValidationError):
        Kpi(**body, **{field: 'a' * (limit + 1)})


def test_kpi_references_dates_and_formula_are_declarative():
    _, _, Kpi = models()
    body = dict(name='X', domainId=str(uuid4()))
    ident = str(uuid4())
    for extra in [dict(measureIds=[ident, ident]), dict(dimensionIds=[str(uuid4()) for _ in range(101)]),
                  dict(validFrom='2026-10-16T00:00:00Z', validTo='2026-10-15T00:00:00Z'),
                  dict(validFrom='not-a-date'), dict(validFrom='2026-10-16T00:00:00'), dict(formula=123)]:
        with pytest.raises(ValidationError):
            Kpi(**(body | extra))
    assert Kpi(**body, formula='  arbitrary\n text  ').formula == 'arbitrary\n text'
    assert Kpi(**body, owner='  ').owner is None
