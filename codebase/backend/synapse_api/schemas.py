from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel


class DTO(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class LineageNode(DTO):
    id: str
    label: str
    kind: str


class Kpi(DTO):
    id: str
    name: str
    domain: str
    category: str
    definition: str
    owner: str
    freshness: str
    quality: str
    frequency: str
    formula: str
    unit: str
    grain: str
    synonyms: list[str]
    model_id: str
    model_version: int
    status: Literal["published"] = "published"
    dimensions: list[str]
    lineage: list[LineageNode]
    data_mode: Literal["synthetic", "connected"]


class KpiPage(DTO):
    items: list[Kpi]
    total: int
    limit: int
    offset: int


class Dashboard(DTO):
    id: str
    name: str
    owner: str
    updated: str
    visualizations: int
    shared: bool
    editable: bool
    kpi_ids: list[str]
    version: int
    model_versions: dict[str, int]


class DashboardPage(DTO):
    items: list[Dashboard]
    total: int
    limit: int
    offset: int


class CreateDashboard(DTO):
    name: str = Field(min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value):
        value = value.strip()
        if not value or any(ord(c) < 32 for c in value):
            raise ValueError("A nonempty, printable name is required")
        return value


class AddWidget(DTO):
    kpi_id: str = Field(min_length=1, max_length=100)
    model_version: int = Field(ge=1)


class SemanticQuery(DTO):
    kpi_id: str = Field(min_length=1, max_length=100)
    model_version: int = Field(ge=1)
    start_date: date
    end_date: date
    group_by: Literal["channel", "product"] | None = None
    channel: Literal["Digital", "Tienda"] | None = None

    @model_validator(mode="after")
    def valid_window(self):
        if self.start_date > self.end_date or (self.end_date - self.start_date).days > 366:
            raise ValueError("Date range must be ordered and at most 366 days")
        return self


class QueryRow(DTO):
    dimension: str | None
    value: str | None


class QueryResult(DTO):
    kpi_id: str
    model_id: str
    model_version: int
    unit: str
    status: Literal["success", "empty"]
    rows: list[QueryRow]
    metadata: dict


class DevSession(DTO):
    persona: Literal["analyst", "viewer", "other-tenant", "data-admin", "other-data-admin"] = "analyst"
