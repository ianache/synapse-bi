from datetime import datetime, timedelta, timezone
import hashlib
import json
import re
import sqlite3
from uuid import uuid4

from ..auth import Principal
from ..dashboards import audit
from ..database import Database
from ..errors import ApiError
from .observations import resolve_origins
from .policy import normalize_name, validate_registration
from .repository import DatasetRepository
from .schemas import Dataset, DatasetSummary, DatasetPage, DatasetFilters, SaveDataset


def _authorize(user, *, write=False):
    needed = {"datasets:read", "datasets:write", "sources:read"} if write else {"datasets:read"}
    if not needed.issubset(user.scopes):
        raise ApiError(403, "permission_denied", "No tienes permiso para realizar esta operación.")


def _fingerprint(body, resolved):
    document = body.model_dump(by_alias=True)
    selected = set(body.selected_columns)
    document["selectedColumns"] = [c["name"] for c in resolved.output.metadata["columns"] if c["name"] in selected]
    if document["preparation"]:
        document["preparation"]["inputOrigins"].sort(key=lambda o: (o["sourceId"], o["observationId"], o["schema"], o["object"]))
    return hashlib.sha256(json.dumps(document, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


class DatasetService:
    def __init__(self, database: Database):
        self.db = database

    def create(self, user: Principal, body: SaveDataset, key: str, request_id: str) -> Dataset:
        _authorize(user, write=True)
        if not isinstance(key, str) or not 1 <= len(key) <= 100 or not key.isprintable():
            raise ApiError(422, "invalid_idempotency_key", "Se requiere una clave de idempotencia válida.")
        timestamp = datetime.now(timezone.utc)
        try:
            with self.db.connect(write=True) as conn:
                repository = DatasetRepository(conn, user)
                replay = repository._request(key, timestamp.isoformat())
                resolved = resolve_origins(conn, user, body)
                validate_registration(body)
                fingerprint = _fingerprint(body, resolved)
                if replay:
                    if replay["fingerprint"] != fingerprint:
                        raise ApiError(409, "idempotency_conflict", "La clave ya se usó con otro contenido.")
                    return Dataset.model_validate_json(replay["response_document"])
                dataset_id = str(uuid4())
                repository._save(dataset_id, body, resolved, timestamp.isoformat())
                result = repository._dto(repository._row(dataset_id))
                repository._save_request(key, fingerprint, result, timestamp.isoformat(), (timestamp + timedelta(hours=24)).isoformat())
                audit(conn, user, "dataset.create", dataset_id, request_id)
                audit(conn, user, "dataset.registration" if body.save_as == "registered" else "dataset.draft", dataset_id, request_id)
                return result
        except sqlite3.IntegrityError as error:
            if "dataset_registry.tenant_id, dataset_registry.normalized_name" in str(error):
                raise ApiError(409, "name_conflict", "Ya existe un dataset con ese nombre.") from None
            raise

    def get(self, user: Principal, dataset_id: str) -> Dataset:
        _authorize(user)
        with self.db.connect() as conn:
            conn.execute("BEGIN")  # One WAL snapshot for row, columns, inputs and source version.
            repository = DatasetRepository(conn, user)
            return repository._dto(repository._row(dataset_id))

    def list(self, user: Principal, filters: DatasetFilters) -> DatasetPage:
        _authorize(user)
        with self.db.connect() as conn:
            conn.execute("BEGIN")  # Filtering, total and page share the same committed snapshot.
            candidates = DatasetRepository(conn, user)._all()
            query = normalize_name(filters.q or "")
            matches = [item for item in candidates
                       if (not query or query in normalize_name(item.name) or query in normalize_name(item.origin.object))
                       and (filters.kind is None or item.kind == filters.kind)
                       and (filters.registration_status is None or item.registration_status == filters.registration_status)
                       and (filters.completeness is None or item.completeness == filters.completeness)]
            return DatasetPage(items=[DatasetSummary.model_validate(item.model_dump(include=set(DatasetSummary.model_fields)))
                                      for item in matches[filters.offset:filters.offset + filters.limit]],
                               total=len(matches), limit=filters.limit, offset=filters.offset)

    def update(self, user: Principal, dataset_id: str, body: SaveDataset, if_match: str | None, request_id: str) -> Dataset:
        _authorize(user, write=True)
        if if_match is None:
            raise ApiError(428, "precondition_required", "Se requiere If-Match para editar.")
        if not re.fullmatch(r'"[1-9][0-9]{0,18}"', if_match):
            raise ApiError(422, "invalid_precondition", "If-Match no es válido.")
        try:
            with self.db.connect(write=True) as conn:
                repository = DatasetRepository(conn, user)
                row = repository._row(dataset_id)
                if row["version"] != int(if_match[1:-1]):
                    raise ApiError(412, "version_conflict", "El dataset cambió. Recupera la versión actual antes de editar.")
                previous = repository._body(row)
                if body.kind != previous.kind or body.origin != previous.origin:
                    raise ApiError(409, "origin_immutable", "El tipo y origen son inmutables. Crea otro dataset.")
                resolved = resolve_origins(conn, user, body)
                validate_registration(body)
                repository._save(dataset_id, body, resolved, datetime.now(timezone.utc).isoformat(), updating=True)
                audit(conn, user, "dataset.update", dataset_id, request_id)
                audit(conn, user, "dataset.registration" if body.save_as == "registered" else "dataset.draft", dataset_id, request_id)
                return repository._dto(repository._row(dataset_id))
        except sqlite3.IntegrityError as error:
            if "dataset_registry.tenant_id, dataset_registry.normalized_name" in str(error):
                raise ApiError(409, "name_conflict", "Ya existe un dataset con ese nombre.") from None
            raise
