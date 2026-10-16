from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from .auth import Principal
from .catalog import get_kpi
from .database import Database
from .dashboards import audit
from .errors import ApiError
from .schemas import QueryResult, QueryRow, SemanticQuery


def format_value(value: Decimal | None) -> str | None:
    return str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)) if value is not None else None


def execute_query(database: Database, user: Principal, body: SemanticQuery, request_id: str) -> QueryResult:
    kpi = get_kpi(database, user, body.kpi_id, body.model_version)
    if body.group_by and body.group_by not in kpi.dimensions:
        raise ApiError(422, "unsupported_dimension", "La dimensión no está permitida por este KPI.")
    if kpi.data_mode != "synthetic":
        raise ApiError(503, "serving_not_configured", "El motor de consulta de este modelo aún no está configurado.")
    # All SQL identifiers/expressions come from this closed mapping, never input SQL.
    if kpi.id in {"kpi_fin_net_revenue", "kpi_op_gross_margin"}:
        table = "sales"
        components = "SUM(gross_cents-discount_cents-return_cents) AS revenue, SUM(cost_cents) AS cost"
    elif kpi.id == "kpi_sls_conversion_rate":
        table = "sessions"
        components = "SUM(eligible) AS eligible, SUM(converted) AS converted"
    else:
        raise ApiError(503, "serving_not_configured", "No hay un ejecutor registrado para este KPI.")
    dimension = {None: "NULL", "channel": "channel", "product": "product"}[body.group_by]
    sql = f"SELECT {dimension} AS dimension, COUNT(*) AS sample_count, MAX(occurred_on) AS newest, {components} FROM {table} WHERE tenant_id=? AND occurred_on>=? AND occurred_on<=?"
    parameters: list = [user.tenant, body.start_date.isoformat(), body.end_date.isoformat()]
    if body.channel:
        sql += " AND channel=?"
        parameters.append(body.channel)
    if body.group_by:
        sql += f" GROUP BY {dimension} ORDER BY {dimension}"
    sql += " LIMIT 100"
    with database.connect(write=True) as connection:
        records = connection.execute(sql, parameters).fetchall()
        audit(connection, user, "semantic.query", kpi.id, request_id)
    rows = []
    latest = None
    for row in records:
        if not row["sample_count"]:
            continue
        if kpi.id == "kpi_fin_net_revenue":
            value = Decimal(row["revenue"]) / 100
        elif kpi.id == "kpi_op_gross_margin":
            value = Decimal(row["revenue"] - row["cost"]) / Decimal(row["revenue"]) * 100 if row["revenue"] else None
        else:
            value = Decimal(row["converted"]) / Decimal(row["eligible"]) * 100 if row["eligible"] else None
        rows.append(QueryRow(dimension=row["dimension"], value=format_value(value)))
        latest = max(latest or row["newest"], row["newest"])
    return QueryResult(kpi_id=kpi.id, model_id=kpi.model_id, model_version=kpi.model_version, unit=kpi.unit, status="success" if rows else "empty", rows=rows, metadata={"dataMode": kpi.data_mode, "sourceUpdatedAt": latest, "queriedAt": datetime.now(timezone.utc).isoformat(), "quality": {"status": "not_evaluated", "score": None}, "freshness": {"status": "not_evaluated", "policy": None}, "lineage": [node.model_dump(by_alias=True) for node in kpi.lineage], "startDate": body.start_date.isoformat(), "endDate": body.end_date.isoformat(), "groupBy": body.group_by, "nullReason": "undefined_denominator" if any(r.value is None for r in rows) else None})
