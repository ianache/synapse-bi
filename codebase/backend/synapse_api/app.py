from contextlib import asynccontextmanager
import logging
import sqlite3
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from .auth import Authenticator, Principal, principal, require
from .catalog import get_kpi, list_kpis
from .config import Settings
from .database import Database
from .demo import seed
from . import dashboards
from .errors import ApiError
from .schemas import AddWidget, CreateDashboard, Dashboard, DashboardPage, DevSession, Kpi, KpiPage, QueryResult, SemanticQuery
from .serving import execute_query
from .sources import SourceService, source_router
from .datasets.body_limit import DatasetBodyLimitMiddleware
from .datasets.policy import MISSING_METADATA_PATHS
from .datasets.router import dataset_router
from .datasets.service import DatasetService

logger = logging.getLogger("synapse_api")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings.from_env()
    settings.validate()
    database = Database(settings.database_path)

    @asynccontextmanager
    async def lifespan(app):
        database.initialize()
        if settings.seed_demo:
            seed(database)
        yield

    app = FastAPI(title="Synapse BI API", version="0.1.0", lifespan=lifespan, description="API v1 de catálogo, consultas semánticas y dashboards. Datos sintéticos sólo mediante configuración explícita de desarrollo.")
    app.state.database = database
    app.state.auth = Authenticator(settings)
    app.state.sources = SourceService(database, settings)
    app.include_router(source_router(app.state.sources))
    app.state.datasets = DatasetService(database)
    app.include_router(dataset_router(app.state.datasets))
    app.add_middleware(DatasetBodyLimitMiddleware)
    app.add_middleware(CORSMiddleware, allow_origins=list(settings.allowed_origins), allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type", "If-Match", "Idempotency-Key"], expose_headers=["ETag", "X-Request-ID", "Location"])

    def error_response(request, status, code, message, details=None):
        headers = {"WWW-Authenticate": "Bearer"} if status == 401 else {}
        error = {"code": code, "message": message, "requestId": getattr(request.state, "request_id", "unavailable")}
        if code == "metadata_incomplete" and isinstance(details, dict) and isinstance(details.get("missingMetadata"), list):
            error["details"] = {"missingMetadata": [field for field in details["missingMetadata"] if isinstance(field, str) and field in MISSING_METADATA_PATHS]}
        return JSONResponse(status_code=status, content={"error": error}, headers=headers)

    @app.middleware("http")
    async def context(request: Request, call_next):
        request.state.request_id = str(uuid4())
        try:
            response = await call_next(request)
        except Exception:
            # No request payloads, credentials, query parameters or SQL in logs.
            logger.error("Unhandled API failure request_id=%s", request.state.request_id)
            response = error_response(request, 500, "internal_error", "No se pudo completar la operación.")
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-Content-Type-Options"] = "nosniff"
        return response

    @app.exception_handler(ApiError)
    async def api_error(request, error):
        return error_response(request, error.status, error.code, error.message, error.details)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request, error):
        return error_response(request, 422, "validation_error", "La solicitud contiene campos o valores no permitidos.")

    @app.exception_handler(HTTPException)
    async def http_error(request, error):
        return error_response(request, error.status_code, "http_error", "Recurso o método no disponible.")

    @app.exception_handler(sqlite3.OperationalError)
    async def storage_error(request, error):
        return error_response(request, 503, "storage_unavailable", "El almacenamiento no está disponible. Vuelve a intentarlo.")

    @app.get("/health", tags=["Operations"])
    def health():
        return {"status": "ok", "version": "0.1.0"}

    @app.get("/ready", tags=["Operations"])
    def ready():
        with database.connect() as connection:
            connection.execute("SELECT version FROM schema_migrations").fetchone()
        return {"status": "ready"}

    @app.post("/api/v1/auth/dev-session", tags=["Development"], include_in_schema=settings.auth_mode == "development")
    def dev_session(body: DevSession, request: Request):
        if settings.auth_mode != "development":
            raise ApiError(404, "not_found", "Recurso no disponible.")
        if not request.client or request.client.host not in {"127.0.0.1", "::1"}:
            raise ApiError(403, "local_only", "La sesión de desarrollo sólo está disponible localmente.")
        origin = request.headers.get("origin")
        if (origin and origin not in settings.allowed_origins) or request.headers.get("sec-fetch-site") == "cross-site":
            raise ApiError(403, "origin_denied", "Origen no permitido.")
        return {"accessToken": app.state.auth.development_token(body.persona), "tokenType": "bearer", "expiresIn": 3600, "mode": "development"}

    @app.get("/api/v1/me", tags=["Identity"])
    def me(user: Principal = Depends(principal)):
        return {"subject": user.subject, "tenantId": user.tenant, "name": user.name, "scopes": sorted(user.scopes), "authMode": settings.auth_mode, "dataMode": "synthetic" if settings.seed_demo else "connected"}

    @app.get("/api/v1/kpis", response_model=KpiPage, tags=["Semantic catalog"])
    def catalog(q: Annotated[str, Query(max_length=200)] = "", category: Annotated[str, Query(max_length=80)] = "", owner: Annotated[str, Query(max_length=200)] = "", sort: Literal["relevance", "name"] = "relevance", limit: Annotated[int, Query(ge=1, le=100)] = 50, offset: Annotated[int, Query(ge=0, le=10000)] = 0, user: Principal = Depends(require("catalog:read"))):
        return list_kpis(database, user, q, category, owner, sort, limit, offset)

    @app.get("/api/v1/kpis/{kpi_id}", response_model=Kpi, tags=["Semantic catalog"])
    def kpi(kpi_id: str, version: Annotated[int | None, Query(ge=1)] = None, user: Principal = Depends(require("catalog:read"))):
        return get_kpi(database, user, kpi_id, version)

    @app.post("/api/v1/queries", response_model=QueryResult, tags=["Semantic serving"])
    def query(body: SemanticQuery, request: Request, user: Principal = Depends(require("queries:execute"))):
        return execute_query(database, user, body, request.state.request_id)

    @app.get("/api/v1/dashboards", response_model=DashboardPage, tags=["Dashboards"])
    def dashboard_list(limit: Annotated[int, Query(ge=1, le=100)] = 50, offset: Annotated[int, Query(ge=0, le=10000)] = 0, user: Principal = Depends(require("dashboards:read"))):
        return dashboards.list_dashboards(database, user, limit, offset)

    @app.get("/api/v1/dashboards/{dashboard_id}", response_model=Dashboard, tags=["Dashboards"])
    def dashboard_get(dashboard_id: str, response: Response, user: Principal = Depends(require("dashboards:read"))):
        result = dashboards.get_dashboard(database, user, dashboard_id)
        response.headers["ETag"] = f'"{result.version}"'
        return result

    @app.post("/api/v1/dashboards", response_model=Dashboard, status_code=201, tags=["Dashboards"])
    def dashboard_create(body: CreateDashboard, request: Request, response: Response, idempotency_key: Annotated[str | None, Header(min_length=1, max_length=100)] = None, user: Principal = Depends(require("dashboards:write"))):
        result = dashboards.create_dashboard(database, user, body, idempotency_key, request.state.request_id)
        response.headers["ETag"] = f'"{result.version}"'
        return result

    @app.put("/api/v1/dashboards/{dashboard_id}/widgets/{kpi_id}", response_model=Dashboard, tags=["Dashboards"])
    def widget_put(dashboard_id: str, kpi_id: str, body: AddWidget, request: Request, response: Response, if_match: Annotated[str | None, Header(max_length=30)] = None, user: Principal = Depends(require("dashboards:write"))):
        if body.kpi_id != kpi_id:
            raise ApiError(422, "kpi_mismatch", "El KPI del cuerpo debe coincidir con el recurso.")
        result = dashboards.add_widget(database, user, dashboard_id, body, if_match, request.state.request_id)
        response.headers["ETag"] = f'"{result.version}"'
        return result

    @app.delete("/api/v1/dashboards/{dashboard_id}/widgets/{kpi_id}", response_model=Dashboard, tags=["Dashboards"])
    def widget_delete(dashboard_id: str, kpi_id: str, request: Request, response: Response, if_match: Annotated[str | None, Header(max_length=30)] = None, user: Principal = Depends(require("dashboards:write"))):
        result = dashboards.remove_widget(database, user, dashboard_id, kpi_id, if_match, request.state.request_id)
        response.headers["ETag"] = f'"{result.version}"'
        return result

    return app
