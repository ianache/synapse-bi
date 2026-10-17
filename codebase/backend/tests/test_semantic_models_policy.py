"""Reject client-controlled captures, hidden authority and invalid selection before persistence."""
from uuid import uuid4

import pytest
from pydantic import ValidationError


def test_empty_selection_is_valid():
    from synapse_api.semantic_models.schemas import CreateModel
    body = CreateModel(name='  Logi\u0301stica  ', domainId=str(uuid4()))
    assert body.name == 'Logística'
    assert body.kpi_ids == []
    assert body.description == ''


@pytest.mark.parametrize('extra', [
    {'name': ''}, {'name': '  '}, {'name': 'x' * 101}, {'name': True},
    {'domainId': 'invalid'}, {'tenantId': 'foreign'}, {'semanticVersion': '1.0.0'},
    {'description': 'x' * 2001}, {'capture': {}}, {'kpiIds': ['invalid']},
])
def test_invalid_ids_duplicates_extra_fields(extra):
    from synapse_api.semantic_models.schemas import CreateModel
    with pytest.raises(ValidationError):
        CreateModel(**({'name': 'Ventas', 'domainId': str(uuid4())} | extra))


def test_selection_bounds_and_normalized_duplicate_ids():
    from synapse_api.semantic_models.schemas import CreateModel
    domain, kpi = str(uuid4()), str(uuid4())
    assert len(CreateModel(name='X', domainId=domain, kpiIds=[str(uuid4()) for _ in range(100)]).kpi_ids) == 100
    for ids in [[str(uuid4()) for _ in range(101)], [kpi, kpi.upper()]]:
        with pytest.raises(ValidationError):
            CreateModel(name='X', domainId=domain, kpiIds=ids)


def test_update_requires_candidate_digest_not_arbitrary_capture():
    from synapse_api.semantic_models.schemas import UpdateDraft, PreviewDraft, CloneDraft
    assert PreviewDraft(kpiIds=[]).kpi_ids == []
    assert CloneDraft(sourceDraftId=str(uuid4())).source_draft_id
    assert UpdateDraft(kpiIds=[], candidateDigest='a' * 64).candidate_digest == 'a' * 64
    for extra in [{}, {'candidateDigest': 'bad'}, {'candidateDigest': 'a' * 64, 'capture': {}},
                  {'candidateDigest': 'a' * 64, 'domainId': str(uuid4())}]:
        with pytest.raises(ValidationError):
            UpdateDraft(kpiIds=[], **extra)
