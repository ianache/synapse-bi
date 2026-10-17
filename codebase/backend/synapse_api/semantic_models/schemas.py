from typing import Annotated, Literal

from pydantic import Field, field_validator

from ..semantic_catalog.schemas import Named, StrictDTO, SaveKpiDefinition, SaveComponent, BindingSnapshot, Pagination, identifier

Uuid = Annotated[str, Field(min_length=1, max_length=128)]
Digest = Annotated[str, Field(pattern=r'^[0-9a-f]{64}$')]


class PreviewDraft(StrictDTO):
    kpi_ids: list[Uuid] = Field(default_factory=list, max_length=100)

    @field_validator('kpi_ids')
    @classmethod
    def references(cls, value):
        normalized = [identifier(v) for v in value]
        if len(set(normalized)) != len(normalized):
            raise ValueError('Distinct references required')
        return sorted(normalized)


class CreateModel(Named, PreviewDraft):
    domain_id: Uuid
    description: str = Field(default='', max_length=2000)

    _uuid = field_validator('domain_id')(identifier)


class CloneDraft(StrictDTO):
    source_draft_id: Uuid

    _uuid = field_validator('source_draft_id')(identifier)


class UpdateDraft(PreviewDraft):
    candidate_digest: Digest


class ModelFilters(Pagination):
    q: str = Field(default='', max_length=100)
    domain_id: Uuid | None = None

    @field_validator('domain_id')
    @classmethod
    def domain(cls, value):
        return identifier(value) if value is not None else None


class CompareFilters(StrictDTO):
    left_draft_id: Uuid
    right_draft_id: Uuid

    _left = field_validator('left_draft_id')(identifier)
    _right = field_validator('right_draft_id')(identifier)


class DomainCapture(StrictDTO):
    id: str
    version: int = Field(ge=1)
    name: str


class KpiCapture(SaveKpiDefinition):
    id: str
    version: int = Field(ge=1)


class ComponentCapture(SaveComponent):
    id: str
    version: int = Field(ge=1)
    binding_snapshot: BindingSnapshot | None


class Capture(StrictDTO):
    domain: DomainCapture
    kpis: list[KpiCapture]
    components: list[ComponentCapture]


class Model(StrictDTO):
    id: str
    domain_id: str
    name: str
    description: str
    created_by: str
    created_at: str
    updated_at: str
    revision: int = Field(ge=1)


class DraftSummary(StrictDTO):
    id: str
    sequence: int = Field(ge=1)
    revision: int = Field(ge=1)
    status: Literal['draft'] = 'draft'
    semantic_version: None = None
    captured_at: str
    updated_at: str
    kpi_count: int = Field(ge=0)
    component_count: int = Field(ge=0)


class Draft(StrictDTO):
    id: str
    model_id: str
    sequence: int = Field(ge=1)
    revision: int = Field(ge=1)
    status: Literal['draft'] = 'draft'
    semantic_version: None = None
    kpi_ids: list[str]
    capture: Capture
    capture_digest: Digest
    captured_at: str
    created_by: str
    created_at: str
    updated_at: str
    parent_draft_id: str | None
    completeness: Literal['complete', 'incomplete']
    missing_metadata: list[str]


class ModelDetail(StrictDTO):
    model: Model
    draft: Draft


class ModelItem(Model):
    latest_draft: DraftSummary


class ModelPage(StrictDTO):
    items: list[ModelItem]
    total: int
    limit: int
    offset: int


class DraftPage(StrictDTO):
    items: list[DraftSummary]
    total: int
    limit: int
    offset: int


class Change(StrictDTO):
    kind: Literal['kpi', 'component', 'domain']
    id: str
    field: str
    change: Literal['added', 'removed', 'modified']
    before: object | None
    after: object | None


class Preview(StrictDTO):
    candidate_digest: Digest
    candidate_capture: Capture
    changes: list[Change]
    checked_at: str
    base_revision: int = Field(ge=1)


class Comparison(StrictDTO):
    left: DraftSummary
    right: DraftSummary
    changes: list[Change]
