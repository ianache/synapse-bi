from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, Response

from ..auth import Principal, require
from ..semantic_catalog.schemas import Pagination
from .schemas import (CreateModel, CloneDraft, PreviewDraft, UpdateDraft, ModelFilters, CompareFilters,
                      ModelDetail, ModelPage, Draft, DraftPage, Preview, Comparison)
from .service import SemanticModelsService


def semantic_models_router(service: SemanticModelsService) -> APIRouter:
    base = '/api/v1/semantic-models'
    router = APIRouter(prefix=base, tags=['Semantic model drafts'])

    @router.get('', response_model=ModelPage)
    def listing(filters: Annotated[ModelFilters, Query()], user: Principal = Depends(require('models:read'))):
        return service.list(user, filters)

    @router.post('', response_model=ModelDetail, status_code=201)
    def create(body: CreateModel, request: Request, response: Response,
               idempotency_key: Annotated[str | None, Header(max_length=100)] = None,
               user: Principal = Depends(require('models:write'))):
        result = service.create(user, body, idempotency_key, request.state.request_id)
        response.headers['ETag'] = f'"{result["model"]["revision"]}"'
        response.headers['Location'] = f'{base}/{result["model"]["id"]}'
        return result

    @router.get('/{model_id}', response_model=ModelDetail)
    def get(model_id: UUID, response: Response, user: Principal = Depends(require('models:read'))):
        result = service.get(user, str(model_id))
        response.headers['ETag'] = f'"{result["model"]["revision"]}"'
        return result

    @router.get('/{model_id}/drafts', response_model=DraftPage)
    def drafts(model_id: UUID, filters: Annotated[Pagination, Query()], user: Principal = Depends(require('models:read'))):
        return service.list_drafts(user, str(model_id), filters)

    @router.post('/{model_id}/drafts', response_model=Draft, status_code=201)
    def clone(model_id: UUID, body: CloneDraft, request: Request, response: Response,
              idempotency_key: Annotated[str | None, Header(max_length=100)] = None,
              if_match: Annotated[str | None, Header(max_length=30)] = None,
              user: Principal = Depends(require('models:write'))):
        result = service.clone(user, str(model_id), body, if_match, idempotency_key, request.state.request_id)
        response.headers['ETag'] = f'"{result["revision"]}"'
        response.headers['Location'] = f'{base}/{model_id}/drafts/{result["id"]}'
        return result

    @router.get('/{model_id}/drafts/{draft_id}', response_model=Draft)
    def draft(model_id: UUID, draft_id: UUID, response: Response, user: Principal = Depends(require('models:read'))):
        result = service.get_draft(user, str(model_id), str(draft_id))
        response.headers['ETag'] = f'"{result["revision"]}"'
        return result

    @router.post('/{model_id}/drafts/{draft_id}/preview', response_model=Preview)
    def preview(model_id: UUID, draft_id: UUID, body: PreviewDraft,
                if_match: Annotated[str | None, Header(max_length=30)] = None,
                user: Principal = Depends(require('models:write'))):
        return service.preview(user, str(model_id), str(draft_id), body, if_match)

    @router.put('/{model_id}/drafts/{draft_id}', response_model=Draft)
    def update(model_id: UUID, draft_id: UUID, body: UpdateDraft, request: Request, response: Response,
               if_match: Annotated[str | None, Header(max_length=30)] = None,
               user: Principal = Depends(require('models:write'))):
        result = service.update(user, str(model_id), str(draft_id), body, if_match, request.state.request_id)
        response.headers['ETag'] = f'"{result["revision"]}"'
        return result

    @router.get('/{model_id}/compare', response_model=Comparison)
    def compare(model_id: UUID, filters: Annotated[CompareFilters, Query()], user: Principal = Depends(require('models:read'))):
        return service.compare(user, str(model_id), filters.left_draft_id, filters.right_draft_id)

    return router
