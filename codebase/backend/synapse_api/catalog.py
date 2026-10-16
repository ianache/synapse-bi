import unicodedata

from .auth import Principal
from .database import Database
from .errors import ApiError
from .schemas import Kpi, KpiPage


def normalize(value: str) -> str:
    return ''.join(c for c in unicodedata.normalize("NFD", value.casefold().strip()) if unicodedata.category(c) != "Mn")


def get_kpi(database: Database, user: Principal, id_: str, version: int | None = None) -> Kpi:
    with database.connect() as connection:
        sql = "SELECT document FROM kpis WHERE tenant_id=? AND id=?"
        values: list = [user.tenant, id_]
        if version is not None:
            sql += " AND model_version=?"
            values.append(version)
        row = connection.execute(sql + " ORDER BY model_version DESC LIMIT 1", values).fetchone()
    if row is None:
        raise ApiError(404, "kpi_not_found", "KPI o versión no disponible.")
    return Kpi.model_validate_json(row["document"])


def list_kpis(database: Database, user: Principal, query: str, category: str, owner: str, sort: str, limit: int, offset: int) -> KpiPage:
    with database.connect() as connection:
        rows = connection.execute("SELECT k.document FROM kpis k WHERE tenant_id=? AND model_version=(SELECT MAX(v.model_version) FROM kpis v WHERE v.tenant_id=k.tenant_id AND v.id=k.id) ORDER BY id", (user.tenant,)).fetchall()
    items = [Kpi.model_validate_json(row["document"]) for row in rows]
    words = normalize(query).split()
    items = [k for k in items if all(w in normalize(' '.join([k.name, k.definition, k.domain, *k.synonyms])) for w in words) and (category in {"", "Todos", "Publicados"} or k.category == category) and (not owner or k.owner == owner)]
    if sort == "name":
        items.sort(key=lambda k: normalize(k.name))
    return KpiPage(items=items[offset:offset + limit], total=len(items), limit=limit, offset=offset)
