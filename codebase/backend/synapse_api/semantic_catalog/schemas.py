from datetime import datetime
from typing import Annotated, Literal, Generic, TypeVar
import unicodedata
from uuid import UUID

from pydantic import ConfigDict, Field, field_validator, model_validator

from ..schemas import DTO

ShortText = Annotated[str, Field(max_length=500)]
LongText = Annotated[str, Field(max_length=2000)]
Identifier = Annotated[str, Field(min_length=1, max_length=128)]
Synonym = Annotated[str, Field(min_length=1, max_length=100)]


def identifier(value: str) -> str:
    return str(UUID(value))


class StrictDTO(DTO):
    model_config = ConfigDict(strict=True)

    @field_validator('*', mode='before')
    @classmethod
    def optional_text(cls, value, info):
        if isinstance(value, str) and info.field_name not in {
            'name', 'domain_id', 'dataset_id', 'column', 'kind', 'valid_from', 'valid_to'
        }:
            return value.strip() or ('' if info.field_name == 'description' else None)
        return value


class Named(StrictDTO):
    name: str = Field(min_length=1, max_length=100)

    @field_validator('name', mode='before')
    @classmethod
    def name_text(cls, value):
        if isinstance(value, str):
            value = unicodedata.normalize('NFC', value.strip())
            if not value or not value.isprintable():
                raise ValueError('Printable nonempty name required')
        return value


class SaveDomain(Named):
    description: LongText = ''
    owner: ShortText | None = None


class Binding(StrictDTO):
    dataset_id: Identifier
    column: str = Field(min_length=1, max_length=128)

    _uuid = field_validator('dataset_id')(identifier)


class SaveComponent(Named):
    kind: Literal['dimension', 'measure']
    domain_id: Identifier
    definition: LongText | None = None
    grain: ShortText | None = None
    unit: ShortText | None = None
    aggregation: ShortText | None = None
    synonyms: list[Synonym] = Field(default_factory=list, max_length=20)
    binding: Binding | None = None

    _uuid = field_validator('domain_id')(identifier)

    @field_validator('synonyms')
    @classmethod
    def distinct_synonyms(cls, value):
        trimmed = [v.strip() for v in value]
        if any(not v for v in trimmed) or len(set(trimmed)) != len(trimmed):
            raise ValueError('Distinct nonempty synonyms required')
        return trimmed

    @model_validator(mode='after')
    def dimension_metadata(self):
        if self.kind == 'dimension' and (self.unit is not None or self.aggregation is not None):
            raise ValueError('Dimension cannot declare unit or aggregation')
        return self


class SaveKpiDefinition(Named):
    domain_id: Identifier
    definition: LongText | None = None
    formula: Annotated[str, Field(max_length=8000)] | None = None
    unit: ShortText | None = None
    grain: ShortText | None = None
    owner: ShortText | None = None
    steward: ShortText | None = None
    classification: ShortText | None = None
    access_policy: ShortText | None = None
    freshness_expectation: ShortText | None = None
    quality_expectation: ShortText | None = None
    filters: LongText | None = None
    null_policy: LongText | None = None
    return_policy: LongText | None = None
    late_data_policy: LongText | None = None
    valid_from: str | None = None
    valid_to: str | None = None
    dimension_ids: list[Identifier] = Field(default_factory=list, max_length=100)
    measure_ids: list[Identifier] = Field(default_factory=list, max_length=100)

    _uuid = field_validator('domain_id')(identifier)

    @field_validator('dimension_ids', 'measure_ids')
    @classmethod
    def references(cls, value):
        normalized = [identifier(v) for v in value]
        if len(normalized) != len(set(normalized)):
            raise ValueError('Distinct references required')
        return normalized

    @field_validator('valid_from', 'valid_to')
    @classmethod
    def timestamp(cls, value):
        if value is not None:
            if len(value) > 64:
                raise ValueError('Invalid timestamp')
            parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
            if parsed.tzinfo is None or 'T' not in value:
                raise ValueError('Timezone-aware RFC3339 required')
        return value

    @model_validator(mode='after')
    def validity(self):
        if self.valid_from and self.valid_to:
            start = datetime.fromisoformat(self.valid_from.replace('Z', '+00:00'))
            end = datetime.fromisoformat(self.valid_to.replace('Z', '+00:00'))
            if end < start:
                raise ValueError('End precedes start')
        return self


class CopyComponent(Named):
    pass


class ReadMetadata(DTO):
    id: str
    version: int
    created_at: str
    updated_at: str
    status: Literal['draft'] = 'draft'
    governance_validation: Literal['pending'] = 'pending'
    completeness: Literal['complete', 'incomplete']
    missing_metadata: list[str]
    warnings: list[Literal['binding_dataset_changed', 'binding_column_removed', 'binding_unavailable']]


class Domain(SaveDomain, ReadMetadata):
    pass


class BindingSnapshot(DTO):
    dataset_id: str
    dataset_version: int
    source_id: str
    observation_id: str
    schema_name: str = Field(alias='schema')
    object: str
    column: str
    column_type: str


class Component(SaveComponent, ReadMetadata):
    copy_origin_id: str | None
    protected: bool
    consumer_count: int
    binding_snapshot: BindingSnapshot | None
    binding_status: Literal['absent', 'current', 'dataset_changed', 'column_removed', 'unavailable']


class KpiDefinition(SaveKpiDefinition, ReadMetadata):
    pass


T = TypeVar('T')


class CatalogPage(DTO, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int


class Consumer(DTO):
    id: str
    name: str
    version: int
    domain_id: str


class Pagination(DTO):
    limit: int = Field(default=25, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class DomainFilters(Pagination):
    q: str = Field(default='', max_length=100)


class KpiFilters(DomainFilters):
    domain_id: str | None = None

    @field_validator('domain_id')
    @classmethod
    def valid_domain(cls, value):
        return identifier(value) if value is not None else None


class ComponentFilters(KpiFilters):
    kind: Literal['dimension', 'measure'] | None = None
