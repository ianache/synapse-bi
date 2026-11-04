from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from ..auth import Principal, principal
from ..errors import ApiError
from .repository import PreparationRepository
from .schemas import PreparationPipelineCreate, PreparationRetryCreate, PreparationRunCreate
from .service import PreparationService


def _write(user):
    if not {"datasets:write", "sources:read"}.issubset(user.scopes):
        raise ApiError(403, "permission_denied", "No tienes permiso para realizar esta operación.")


def _read(user):
    if "datasets:read" not in user.scopes:
        raise ApiError(403, "permission_denied", "No tienes permiso para realizar esta operación.")


def _hide_technical_details(value):
    if hasattr(value, "model_copy"):
        return value.model_copy(update={"error_code": None, "sanitized_error": None})
    if isinstance(value, dict):
        return {key: item for key, item in value.items() if key not in {"errorCode", "sanitizedError", "error_code", "sanitized_error"}}
    return value


def preparation_router(service: PreparationService, database) -> APIRouter:
    router = APIRouter(tags=["Prepared datasets"])

    @router.post("/api/v1/preparation-pipelines", status_code=201)
    def create_pipeline(body: PreparationPipelineCreate, request: Request, user: Principal = Depends(principal)):
        _write(user)
        from datetime import datetime, timezone
        with database.connect(write=True) as connection:
            result = PreparationRepository(connection, user).create_pipeline(
                source_id=body.source_id, input_dataset_id=body.input_dataset_id,
                prepared_dataset_name=body.prepared_dataset_name, enabled=body.enabled,
                timestamp=datetime.now(timezone.utc).isoformat())
        return result

    @router.get("/api/v1/preparation-pipelines")
    def list_pipelines(user: Principal = Depends(principal)):
        _read(user)
        with database.connect() as connection:
            return {"items": PreparationRepository(connection, user).list()}

    @router.post("/api/v1/preparation-runs", status_code=201)
    def create_run(body: PreparationRunCreate, request: Request, user: Principal = Depends(principal)):
        _write(user)
        return service.execute_manual(user, body.pipeline_id, body.events, request.state.request_id)

    @router.get("/api/v1/preparation-runs")
    def list_runs(limit: Annotated[int, Query(ge=1, le=100)] = 50,
                  offset: Annotated[int, Query(ge=0, le=10000)] = 0,
                  pipeline_id: Annotated[str | None, Query(max_length=128)] = None,
                  user: Principal = Depends(principal)):
        _read(user)
        result = service.list_runs(user, limit=limit, offset=offset, pipeline_id=pipeline_id)
        if "sources:read" not in user.scopes or "datasets:write" not in user.scopes:
            result["items"] = [_hide_technical_details(item) for item in result["items"]]
        return result

    @router.get("/api/v1/preparation-runs/{run_id}")
    def get_run(run_id: str, user: Principal = Depends(principal)):
        _read(user)
        result = service.get_run(user, run_id)
        if "sources:read" not in user.scopes or "datasets:write" not in user.scopes:
            result = _hide_technical_details(result)
        return result

    @router.post("/api/v1/preparation-runs/{run_id}/retry", status_code=201)
    def retry_run(run_id: str, request: Request, body: PreparationRetryCreate | None = None,
                  user: Principal = Depends(principal)):
        _write(user)
        return service.retry_run(user, run_id, request.state.request_id, body.events if body else None)

    @router.get("/api/v1/prepared-datasets/{dataset_id}/versions")
    def versions(dataset_id: str, limit: Annotated[int, Query(ge=1, le=100)] = 50,
                 offset: Annotated[int, Query(ge=0, le=10000)] = 0, user: Principal = Depends(principal)):
        _read(user)
        return service.list_versions(user, dataset_id, limit, offset)

    @router.get("/api/v1/prepared-datasets/{dataset_id}/versions/{version_id}/history")
    def history(dataset_id: str, version_id: str, limit: Annotated[int, Query(ge=1, le=500)] = 100,
                offset: Annotated[int, Query(ge=0, le=100000)] = 0, user: Principal = Depends(principal)):
        _read(user)
        return service.read_history(user, dataset_id, version_id, limit, offset)

    @router.get("/api/v1/prepared-datasets/{dataset_id}/versions/{version_id}/current-state")
    def current_state(dataset_id: str, version_id: str, limit: Annotated[int, Query(ge=1, le=500)] = 100,
                      offset: Annotated[int, Query(ge=0, le=100000)] = 0, user: Principal = Depends(principal)):
        _read(user)
        return service.read_current_state(user, dataset_id, version_id, limit, offset)

    return router
