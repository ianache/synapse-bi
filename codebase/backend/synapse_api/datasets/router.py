from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request, Response

from ..auth import Principal, require
from .schemas import Dataset, DatasetFilters, DatasetPage, SaveDataset
from .service import DatasetService


def dataset_router(service: DatasetService) -> APIRouter:
    router = APIRouter(prefix="/api/v1/datasets", tags=["Dataset registry"])

    @router.get("", response_model=DatasetPage)
    def listing(filters: Annotated[DatasetFilters, Query()], user: Principal = Depends(require("datasets:read"))):
        return service.list(user, filters)

    @router.post("", response_model=Dataset, status_code=201)
    def create(body: SaveDataset, request: Request, response: Response,
               idempotency_key: Annotated[str | None, Header(min_length=1, max_length=100)] = None,
               user: Principal = Depends(require("datasets:write"))):
        result = service.create(user, body, idempotency_key, request.state.request_id)
        response.headers["Location"] = f"/api/v1/datasets/{result.id}"
        response.headers["ETag"] = f'"{result.version}"'
        return result

    @router.get("/{dataset_id}", response_model=Dataset)
    def get(dataset_id: str, response: Response, user: Principal = Depends(require("datasets:read"))):
        result = service.get(user, dataset_id)
        response.headers["ETag"] = f'"{result.version}"'
        return result

    @router.put("/{dataset_id}", response_model=Dataset)
    def update(dataset_id: str, body: SaveDataset, request: Request, response: Response,
               if_match: Annotated[str | None, Header(max_length=30)] = None,
               user: Principal = Depends(require("datasets:write"))):
        result = service.update(user, dataset_id, body, if_match, request.state.request_id)
        response.headers["ETag"] = f'"{result.version}"'
        return result

    return router
