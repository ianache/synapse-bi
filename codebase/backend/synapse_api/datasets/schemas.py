from typing import Annotated, Literal
import unicodedata

from pydantic import Field, field_validator, model_validator

from ..schemas import DTO

Identifier = Annotated[str, Field(min_length=1, max_length=128, strict=True)]


class Origin(DTO):
    source_id: Identifier
    observation_id: Identifier
    schema_name: Identifier = Field(alias="schema")
    object: Identifier


class Governance(DTO):
    owner: str | None = Field(default=None, max_length=500)
    classification: str | None = Field(default=None, max_length=500)
    freshness_expectation: str | None = Field(default=None, max_length=500)
    load_reference: str | None = Field(default=None, max_length=500)

    @field_validator("*", mode="before")
    @classmethod
    def trim_optional(cls, value):
        return (value.strip() or None) if isinstance(value, str) else value


class Preparation(DTO):
    process_reference: str | None = Field(default=None, max_length=1000)
    input_origins: list[Origin] = Field(default_factory=list, max_length=20)

    @field_validator("process_reference", mode="before")
    @classmethod
    def trim_optional(cls, value):
        return (value.strip() or None) if isinstance(value, str) else value


class Medallion(DTO):
    schema_description: str | None = Field(default=None, max_length=500)
    partition_policy: str | None = Field(default=None, max_length=500)
    retention_policy: str | None = Field(default=None, max_length=500)
    minimum_quality: str | None = Field(default=None, max_length=500)
    tenant_policy: str | None = Field(default=None, max_length=500)

    @field_validator("*", mode="before")
    @classmethod
    def trim_optional(cls, value):
        return (value.strip() or None) if isinstance(value, str) else value


class SaveDataset(DTO):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)
    kind: Literal["direct", "prepared"]
    save_as: Literal["draft", "registered"]
    origin: Origin
    selected_columns: list[Identifier] = Field(min_length=1, max_length=500)
    governance: Governance = Field(default_factory=Governance)
    preparation: Preparation | None = None
    medallion: Medallion | None = None

    @field_validator("name", mode="before")
    @classmethod
    def printable_name(cls, value):
        if isinstance(value, str):
            value = unicodedata.normalize("NFC", value.strip())
            if not value or not value.isprintable():
                raise ValueError("Printable nonempty name required")
        return value

    @field_validator("selected_columns")
    @classmethod
    def distinct_columns(cls, value):
        if len(value) != len(set(value)):
            raise ValueError("Distinct column names required")
        return value

    @model_validator(mode="after")
    def coherent_preparation(self):
        if self.kind == "direct" and self.preparation is not None:
            raise ValueError("Direct datasets cannot declare preparation")
        return self


class TechnicalColumn(DTO):
    name: str
    position: int
    type: str
    nullable: bool
    generated: bool
    comment: str | None = None


class SourceConstraint(DTO):
    name: str
    kind: Literal["p", "u", "f", "c"]
    columns: list[str]
    referenced_schema: str | None = None
    referenced_table: str | None = None
    referenced_columns: list[str] = Field(default_factory=list)


class DatasetOrigin(Origin):
    source_name: str
    kind: str
    observed_at: str
    source_version: int
    current_source_version: int


class Evaluation(DTO):
    status: Literal["not_evaluated"] = "not_evaluated"


class DatasetLineage(DTO):
    output: Origin
    dataset_id: str
    input_origins: list[Origin] = Field(default_factory=list)
    process_reference: str | None = None


class DatasetSummary(DTO):
    id: str
    name: str
    kind: Literal["direct", "prepared"]
    registration_status: Literal["draft", "registered"]
    completeness: Literal["complete", "incomplete"]
    missing_metadata: list[str]
    governance_validation: Literal["pending"] = "pending"
    origin: DatasetOrigin
    version: int = Field(ge=1)
    created_at: str
    updated_at: str
    created_by: str


class Dataset(DatasetSummary):
    description: str
    selected_columns: list[TechnicalColumn]
    source_constraints: list[SourceConstraint]
    governance: Governance
    preparation: Preparation | None
    medallion: Medallion | None
    freshness: Evaluation = Field(default_factory=Evaluation)
    quality: Evaluation = Field(default_factory=Evaluation)
    lineage: DatasetLineage


class DatasetPage(DTO):
    items: list[DatasetSummary]
    total: int
    limit: int
    offset: int


class DatasetFilters(DTO):
    q: str | None = Field(default=None, max_length=200)
    kind: Literal["direct", "prepared"] | None = None
    registration_status: Literal["draft", "registered"] | None = None
    completeness: Literal["complete", "incomplete"] | None = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0, le=10000)
