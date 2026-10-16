"""Presence is not approval, certification, measured freshness or quality."""
import unicodedata

from ..errors import ApiError
from .schemas import SaveDataset

GOVERNANCE_FIELDS = ("owner", "classification", "freshnessExpectation")
MEDALLION_FIELDS = ("schemaDescription", "partitionPolicy", "retentionPolicy", "minimumQuality", "tenantPolicy")
MISSING_METADATA_PATHS = frozenset((*GOVERNANCE_FIELDS, "preparation.processReference", "preparation.inputOrigins",
                                    *(f"medallion.{field}" for field in MEDALLION_FIELDS)))


def normalize_name(value: str) -> str:
    return unicodedata.normalize("NFC", value.strip()).casefold()


def missing_metadata(body: SaveDataset) -> list[str]:
    governance = body.governance.model_dump(by_alias=True)
    missing = [field for field in GOVERNANCE_FIELDS if not governance[field]]
    if body.kind == "prepared":
        if body.preparation is None or not body.preparation.process_reference:
            missing.append("preparation.processReference")
        if body.preparation is None or not body.preparation.input_origins:
            missing.append("preparation.inputOrigins")
    if body.medallion is not None:
        values = body.medallion.model_dump(by_alias=True)
        missing.extend(f"medallion.{field}" for field in MEDALLION_FIELDS if not values[field])
    return missing


def validate_registration(body: SaveDataset) -> None:
    missing = missing_metadata(body)
    if body.save_as == "registered" and missing:
        raise ApiError(422, "metadata_incomplete", "Completa los metadatos requeridos para registrar.",
                       details={"missingMetadata": missing})
