from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, Request, Response

from ..auth import Principal, require
from .schemas import (SaveDomain, SaveComponent, SaveKpiDefinition, CopyComponent, Domain, Component,
                      KpiDefinition, CatalogPage, Consumer, DomainFilters, ComponentFilters, KpiFilters, Pagination)
from .service import SemanticCatalogService


def semantic_catalog_router(service: SemanticCatalogService) -> APIRouter:
    base = '/api/v1/semantic-catalog'
    router = APIRouter(prefix=base, tags=['Semantic catalog drafts'])

    def register(kind, path, save_type, read_type, filters_type):
        @router.get(path, response_model=CatalogPage[read_type])
        def listing(filters: Annotated[filters_type, Query()], user: Principal = Depends(require('semantic:read'))):
            values = filters.model_dump()
            if 'kind' in values:
                values['component_kind'] = values.pop('kind')
            return service.list(user, kind, **values)

        @router.post(path, response_model=read_type, status_code=201)
        def create(body: save_type, request: Request, response: Response,
                   idempotency_key: Annotated[str | None, Header(max_length=100)] = None,
                   user: Principal = Depends(require('semantic:write'))):
            method = {'domain': service.create_domain, 'component': service.create_component, 'kpi': service.create_kpi}[kind]
            item = method(user, body, idempotency_key, request.state.request_id)
            response.headers['ETag'] = f'"{item["version"]}"'
            response.headers['Location'] = f'{base}{path}/{item["id"]}'
            return item

        @router.get(path + '/{item_id}', response_model=read_type)
        def get(item_id: str, response: Response, user: Principal = Depends(require('semantic:read'))):
            item = service.get(user, kind, item_id)
            response.headers['ETag'] = f'"{item["version"]}"'
            return item

        @router.put(path + '/{item_id}', response_model=read_type)
        def update(item_id: str, body: save_type, request: Request, response: Response,
                   if_match: Annotated[str | None, Header(max_length=30)] = None,
                   user: Principal = Depends(require('semantic:write'))):
            item = service.update(user, kind, item_id, body, if_match, request.state.request_id)
            response.headers['ETag'] = f'"{item["version"]}"'
            return item

    register('domain', '/domains', SaveDomain, Domain, DomainFilters)
    register('component', '/components', SaveComponent, Component, ComponentFilters)
    register('kpi', '/kpi-definitions', SaveKpiDefinition, KpiDefinition, KpiFilters)

    @router.post('/components/{item_id}/copies', response_model=Component, status_code=201)
    def copy(item_id: str, body: CopyComponent, request: Request, response: Response,
             idempotency_key: Annotated[str | None, Header(max_length=100)] = None,
             user: Principal = Depends(require('semantic:write'))):
        item = service.copy_component(user, item_id, body, idempotency_key, request.state.request_id)
        response.headers['ETag'] = f'"{item["version"]}"'
        response.headers['Location'] = f'{base}/components/{item["id"]}'
        return item

    @router.get('/components/{item_id}/consumers', response_model=CatalogPage[Consumer])
    def consumers(item_id: str, filters: Annotated[Pagination, Query()], user: Principal = Depends(require('semantic:read'))):
        return service.consumers(user, item_id, **filters.model_dump())

    return router
