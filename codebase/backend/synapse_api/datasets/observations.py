"""Resolve only persisted observations; identifiers here are values, never SQL."""
from dataclasses import dataclass
import json
import sqlite3

from pydantic import ValidationError

from ..auth import Principal
from ..errors import ApiError
from .schemas import Origin, SaveDataset, SourceConstraint, TechnicalColumn


@dataclass(frozen=True)
class ObservedObject:
    source_id: str
    observation_id: str
    schema: str
    object: str
    metadata: dict
    observed_at: str
    source_version: int
    current_source_version: int
    source_name: str


@dataclass(frozen=True)
class ResolvedOrigins:
    output: ObservedObject
    inputs: tuple[ObservedObject, ...]


def _resolve(conn: sqlite3.Connection, user: Principal, origin: Origin) -> ObservedObject:
    row = conn.execute("""SELECT o.*,s.name AS source_name,s.version AS current_source_version
        FROM source_observations o JOIN sources s ON s.tenant_id=o.tenant_id AND s.id=o.source_id
        WHERE o.tenant_id=? AND o.source_id=? AND o.id=?""",
        (user.tenant, origin.source_id, origin.observation_id)).fetchone()
    if row is None:
        raise ApiError(404, "observation_not_found", "Observación no disponible.")
    if row["status"] != "success":
        raise ApiError(422, "observation_failed", "Selecciona una observación exitosa.")
    try:
        snapshot = json.loads(row["snapshot"])
        obj = next((obj for obj in snapshot["objects"]
                    if obj["schema"] == origin.schema_name and obj["name"] == origin.object), None)
        if obj is None:
            raise ApiError(404, "object_not_found", "Objeto observado no disponible.")
        # Copy a whitelist, not arbitrary snapshot attributes or connection data.
        metadata = {"schema": obj["schema"], "name": obj["name"], "kind": obj["kind"],
                    "comment": obj.get("comment"),
                    "columns": [TechnicalColumn.model_validate({k: c[k] for k in TechnicalColumn.model_fields if k in c})
                                .model_dump(by_alias=True) for c in obj["columns"]],
                    "constraints": [SourceConstraint.model_validate({k: c[k] for k in (
                        "name", "kind", "columns", "referencedSchema", "referencedTable", "referencedColumns") if k in c})
                        .model_dump(by_alias=True) for c in obj["constraints"]]}
    except (TypeError, KeyError, ValueError, ValidationError):
        raise ApiError(503, "observation_unavailable", "Los metadatos observados no están disponibles.") from None
    metadata["columns"].sort(key=lambda c: c["position"])
    return ObservedObject(origin.source_id, origin.observation_id, origin.schema_name, origin.object,
                          metadata, row["created_at"], row["source_version"], row["current_source_version"], row["source_name"])


def _key(origin: Origin) -> tuple[str, str, str, str]:
    return origin.source_id, origin.observation_id, origin.schema_name, origin.object


def resolve_origins(conn: sqlite3.Connection, user: Principal, body: SaveDataset) -> ResolvedOrigins:
    output = _resolve(conn, user, body.origin)
    if not set(body.selected_columns).issubset({c["name"] for c in output.metadata["columns"]}):
        raise ApiError(422, "invalid_columns", "Selecciona columnas existentes en la observación.")
    inputs = body.preparation.input_origins if body.preparation else []
    keys = [_key(origin) for origin in inputs]
    if len(keys) != len(set(keys)) or _key(body.origin) in keys:
        raise ApiError(422, "invalid_inputs", "Los inputs deben ser distintos entre sí y del origen de salida.")
    return ResolvedOrigins(output, tuple(_resolve(conn, user, origin) for origin in sorted(inputs, key=_key)))
