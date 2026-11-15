"""Validated CDC event and preparation execution contracts."""
from datetime import datetime
from typing import Any, Literal

from pydantic import Field, field_validator

from ..schemas import DTO


class CdcEvent(DTO):
    source_event_id: str | None = Field(default=None, min_length=1, max_length=200)
    business_key: int | None = Field(default=None, strict=True, ge=1)
    operation: str | None = Field(default=None, max_length=40)
    event_timestamp: datetime | None = None
    source_position: int | None = Field(default=None, strict=True, ge=0)
    after_image: dict[str, Any] | None = None
    timestamp_ambiguous: bool = False

    @field_validator("source_event_id", "operation")
    @classmethod
    def trim_optional(cls, value):
        return value.strip() if isinstance(value, str) else value


class QualityFinding(DTO):
    code: str
    rejected_count: int = Field(ge=1)
    message: str


class BatchValidation(DTO):
    events: list[CdcEvent]
    findings: list[QualityFinding]
    input_count: int = Field(ge=0)
    insert_count: int = Field(ge=0)
    update_count: int = Field(ge=0)
    delete_count: int = Field(ge=0)
    rejected_count: int = Field(ge=0)
    blocked: bool


class PreparationPipelineCreate(DTO):
    source_id: str = Field(min_length=1, max_length=128)
    input_dataset_id: str = Field(min_length=1, max_length=128)
    prepared_dataset_name: str = Field(min_length=1, max_length=100)
    enabled: bool = False


class PreparationPipeline(DTO):
    id: str
    source_id: str
    input_dataset_id: str
    prepared_dataset_id: str
    process_id: str
    process_config: dict[str, Any]
    enabled: bool
    created_by: str
    created_at: str
    updated_at: str


class PreparationRunCreate(DTO):
    pipeline_id: str = Field(min_length=1, max_length=128)
    events: list[dict[str, Any]] = Field(min_length=1, max_length=1000)


class PreparationRetryCreate(DTO):
    events: list[dict[str, Any]] | None = Field(default=None, min_length=1, max_length=1000)


class PreparedVersion(DTO):
    dataset_id: str
    version_id: str
    version_number: int = Field(ge=1)
    input_dataset_id: str
    process_id: str
    process_config: dict[str, Any]
    run_id: str
    source_range_start: int | None = None
    source_range_end: int | None = None
    event_count: int = Field(ge=0)
    created_at: datetime


class PreparationRun(DTO):
    id: str
    pipeline_id: str
    dataset_id: str
    process_id: str
    origin: Literal["manual", "poll"]
    status: Literal["received", "processing", "published", "technical_failure", "quality_rejected"]
    started_at: datetime
    ended_at: datetime | None = None
    event_count: int = Field(ge=0)
    insert_count: int = Field(ge=0)
    update_count: int = Field(ge=0)
    delete_count: int = Field(ge=0)
    rejected_count: int = Field(ge=0)
    quality_results: dict[str, Any]
    published_version: PreparedVersion | None = None
    latest_successful_version: PreparedVersion | None = None
    retry_of_run_id: str | None = None
    error_code: str | None = None
    sanitized_error: str | None = None
