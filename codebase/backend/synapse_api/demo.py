"""Explicit synthetic fixtures; never loaded in production."""
from .catalog import normalize
from .database import Database
from .schemas import Kpi


def demo_kpis() -> list[Kpi]:
    common = dict(freshness="Datos sintéticos del 1 al 3 de octubre de 2026", quality="Sin evaluar", frequency="Estática (demostración)", model_id="sales-demo", model_version=1, dimensions=["channel", "product"], data_mode="synthetic", lineage=[{"id": "sales-fixture", "label": "Registros de ventas sintéticos", "kind": "source"}, {"id": "sales-demo", "label": "Modelo de ventas de ejemplo v1", "kind": "model"}])
    return [
        Kpi(**common, id="kpi_fin_net_revenue", name="Ingresos netos", domain="Finanzas", category="Ventas", definition="Ventas brutas menos descuentos y devoluciones en el período seleccionado.", owner="Finanzas (ejemplo)", formula="SUM(gross − discount − returns)", unit="PEN", grain="Transacción", synonyms=["ventas", "ingresos", "facturación", "revenue"]),
        Kpi(**common, id="kpi_op_gross_margin", name="Margen bruto", domain="Operaciones & Ventas", category="Operaciones", definition="Porcentaje del ingreso neto restante después de descontar el costo de los bienes vendidos.", owner="Finanzas (ejemplo)", formula="(SUM(net_revenue) − SUM(cost)) / SUM(net_revenue) × 100", unit="%", grain="Transacción", synonyms=["ventas", "margen", "beneficio", "rentabilidad"]),
        Kpi(**{**common, "dimensions": ["channel"], "grain": "Día y canal"}, id="kpi_sls_conversion_rate", name="Tasa de conversión", domain="Ventas Digitales", category="Clientes", definition="Porcentaje de sesiones elegibles que terminan en una compra, agregado por sus componentes.", owner="Crecimiento (ejemplo)", formula="SUM(converted) / SUM(eligible) × 100", unit="%", synonyms=["ventas", "clientes", "conversión", "embudo"]),
    ]


def seed(database: Database):
    # INSERT OR IGNORE preserves existing user dashboards on restart.
    with database.connect(write=True) as connection:
        for tenant, subject, name in [("demo-global", "ana", "Ana Rivas"), ("demo-other", "otro", "Analista de otro tenant")]:
            for kpi in demo_kpis():
                connection.execute("INSERT OR IGNORE INTO kpis VALUES(?,?,?,?)", (tenant, kpi.id, kpi.model_version, kpi.model_dump_json(by_alias=True)))
            for id_, title in [("ventas-q3", "Ventas Q3 Ejecutivo"), ("finanzas", "Resumen financiero mensual"), ("comercial", "Seguimiento comercial"), ("personal", "Mi análisis")]:
                connection.execute("INSERT OR IGNORE INTO dashboards(tenant_id,id,name,normalized_name,owner_id,owner_name,shared,updated_at) VALUES(?,?,?,?,?,?,?,?)", (tenant, id_, title, normalize(title), subject, name, int(id_ != "personal"), "2026-10-03T20:00:00+00:00"))
            factor = 1 if tenant == "demo-global" else 10
            sales = [("s1", "2026-10-01", "Digital", "Producto A", 100000, 10000, 0, 50000), ("s2", "2026-10-02", "Tienda", "Producto B", 200000, 10000, 20000, 100000), ("s3", "2026-10-03", "Digital", "Producto A", 50000, 0, 0, 25000)]
            for row in sales:
                connection.execute("INSERT OR IGNORE INTO sales VALUES(?,?,?,?,?,?,?,?,?)", (tenant, *row[:4], *(n * factor for n in row[4:])))
            for day, channel, eligible, converted in [("2026-10-01", "Digital", 100, 10), ("2026-10-02", "Tienda", 50, 20), ("2026-10-03", "Digital", 100, 15)]:
                connection.execute("INSERT OR IGNORE INTO sessions VALUES(?,?,?,?,?)", (tenant, day, channel, eligible * factor, converted * factor))
