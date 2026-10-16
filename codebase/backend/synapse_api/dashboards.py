from datetime import datetime, timezone
import hashlib
import sqlite3
from uuid import uuid4

from .auth import Principal
from .catalog import get_kpi, normalize
from .database import Database
from .errors import ApiError
from .schemas import AddWidget, CreateDashboard, Dashboard, DashboardPage


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def audit(connection, user: Principal, action: str, resource: str, request_id: str):
    connection.execute("INSERT INTO audit_events(tenant_id,subject,action,resource_id,request_id,occurred_at) VALUES(?,?,?,?,?,?)", (user.tenant, user.subject, action, resource, request_id, now()))


def visible_row(connection, user: Principal, id_: str):
    row = connection.execute("SELECT * FROM dashboards WHERE tenant_id=? AND id=? AND (owner_id=? OR shared=1)", (user.tenant, id_, user.subject)).fetchone()
    if row is None:
        raise ApiError(404, "dashboard_not_found", "Dashboard no disponible.")
    return row


def dto(connection, user: Principal, row) -> Dashboard:
    widgets = connection.execute("SELECT kpi_id,model_version FROM widgets WHERE tenant_id=? AND dashboard_id=? ORDER BY position,kpi_id", (user.tenant, row["id"])).fetchall()
    return Dashboard(id=row["id"], name=row["name"], owner=row["owner_name"], updated=row["updated_at"], visualizations=len(widgets), shared=bool(row["shared"]), editable=row["owner_id"] == user.subject and "dashboards:write" in user.scopes, kpi_ids=[w["kpi_id"] for w in widgets], version=row["version"], model_versions={w["kpi_id"]: w["model_version"] for w in widgets})


def get_dashboard(database: Database, user: Principal, id_: str) -> Dashboard:
    with database.connect() as connection:
        return dto(connection, user, visible_row(connection, user, id_))


def list_dashboards(database: Database, user: Principal, limit: int, offset: int) -> DashboardPage:
    with database.connect() as connection:
        values = (user.tenant, user.subject)
        condition = " FROM dashboards WHERE tenant_id=? AND (owner_id=? OR shared=1)"
        total = connection.execute("SELECT COUNT(*)" + condition, values).fetchone()[0]
        rows = connection.execute("SELECT *" + condition + " ORDER BY updated_at DESC,id LIMIT ? OFFSET ?", (*values, limit, offset)).fetchall()
        return DashboardPage(items=[dto(connection, user, row) for row in rows], total=total, limit=limit, offset=offset)


def create_dashboard(database: Database, user: Principal, body: CreateDashboard, key: str | None, request_id: str) -> Dashboard:
    fingerprint = hashlib.sha256(body.model_dump_json().encode()).hexdigest()
    with database.connect(write=True) as connection:
        if key:
            replay = connection.execute("SELECT fingerprint,dashboard_id FROM idempotency WHERE tenant_id=? AND subject=? AND key=?", (user.tenant, user.subject, key)).fetchone()
            if replay:
                if replay["fingerprint"] != fingerprint:
                    raise ApiError(409, "idempotency_conflict", "La clave de idempotencia ya se usó con otra solicitud.")
                return dto(connection, user, visible_row(connection, user, replay["dashboard_id"]))
        id_ = str(uuid4())
        try:
            connection.execute("INSERT INTO dashboards(tenant_id,id,name,normalized_name,owner_id,owner_name,shared,updated_at) VALUES(?,?,?,?,?,?,0,?)", (user.tenant, id_, body.name, normalize(body.name), user.subject, user.name, now()))
        except sqlite3.IntegrityError:
            raise ApiError(409, "dashboard_name_conflict", "Ya tienes un dashboard con ese nombre.") from None
        if key:
            connection.execute("INSERT INTO idempotency VALUES(?,?,?,?,?)", (user.tenant, user.subject, key, fingerprint, id_))
        audit(connection, user, "dashboard.created", id_, request_id)
        return dto(connection, user, visible_row(connection, user, id_))


def require_edit(row, user: Principal, expected_version: str | None):
    if row["owner_id"] != user.subject or "dashboards:write" not in user.scopes:
        raise ApiError(403, "dashboard_read_only", "No tienes permiso de edición sobre este dashboard.")
    if expected_version is None:
        raise ApiError(428, "version_required", "Envía If-Match con la versión del dashboard.")
    if expected_version != f'"{row["version"]}"':
        raise ApiError(412, "version_conflict", "El dashboard cambió. Actualiza la vista antes de continuar.")


def add_widget(database: Database, user: Principal, id_: str, body: AddWidget, expected_version: str | None, request_id: str) -> Dashboard:
    with database.connect(write=True) as connection:
        row = visible_row(connection, user, id_)
        require_edit(row, user, expected_version)
        get_kpi(database, user, body.kpi_id, body.model_version)
        existing = connection.execute("SELECT model_version FROM widgets WHERE tenant_id=? AND dashboard_id=? AND kpi_id=?", (user.tenant, id_, body.kpi_id)).fetchone()
        if existing:
            if existing["model_version"] != body.model_version:
                raise ApiError(409, "widget_version_conflict", "El KPI ya existe con otra versión del modelo.")
            return dto(connection, user, row)
        position = connection.execute("SELECT COALESCE(MAX(position),0)+1 FROM widgets WHERE tenant_id=? AND dashboard_id=?", (user.tenant, id_)).fetchone()[0]
        connection.execute("INSERT INTO widgets VALUES(?,?,?,?,?)", (user.tenant, id_, body.kpi_id, body.model_version, position))
        connection.execute("UPDATE dashboards SET version=version+1,updated_at=? WHERE tenant_id=? AND id=?", (now(), user.tenant, id_))
        audit(connection, user, "dashboard.kpi_added", id_, request_id)
        return dto(connection, user, visible_row(connection, user, id_))


def remove_widget(database: Database, user: Principal, id_: str, kpi_id: str, expected_version: str | None, request_id: str) -> Dashboard:
    with database.connect(write=True) as connection:
        row = visible_row(connection, user, id_)
        require_edit(row, user, expected_version)
        cursor = connection.execute("DELETE FROM widgets WHERE tenant_id=? AND dashboard_id=? AND kpi_id=?", (user.tenant, id_, kpi_id))
        if cursor.rowcount:
            connection.execute("UPDATE dashboards SET version=version+1,updated_at=? WHERE tenant_id=? AND id=?", (now(), user.tenant, id_))
            audit(connection, user, "dashboard.kpi_removed", id_, request_id)
        return dto(connection, user, visible_row(connection, user, id_))
