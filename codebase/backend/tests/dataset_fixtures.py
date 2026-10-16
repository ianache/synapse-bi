import json
from uuid import uuid4

from synapse_api.datasets.schemas import Origin


def seed_observation(database, tenant="demo-global", *, failed=False):
    source, observation = str(uuid4()), str(uuid4())
    columns = [{"name": name, "position": index, "type": "numeric" if index == 3 else "text",
                "nullable": False, "generated": False, "comment": None}
               for index, name in enumerate(["tenant_id", "sales_line_key", 'revenue "USD"'], 1)]
    snapshot = {"serverVersion": 180006, "schemas": ["gold"], "objects": [
        {"schema": "gold", "name": "fact_sales", "kind": "table", "comment": None, "columns": columns,
         "constraints": [{"name": "sales_pk", "kind": "p", "columns": ["tenant_id", "sales_line_key"],
                          "referencedSchema": None, "referencedTable": None, "referencedColumns": []}]},
        {"schema": "gold", "name": "sales_view", "kind": "view", "comment": None,
         "columns": columns, "constraints": []}]}
    with database.connect(write=True) as conn:
        conn.execute("INSERT INTO sources VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                     (tenant, source, "Laboratorio", source, "", "{}", b"not-a-real-secret", "connected", None, "2026-10-16T00:00:00+00:00", 1))
        conn.execute("INSERT INTO source_observations VALUES(?,?,?,?,?,?,?,?,?)",
                     (tenant, source, observation, 1, 1, "2026-10-16T00:00:00+00:00", "failed" if failed else "success",
                      None if failed else json.dumps(snapshot), "connection_failed" if failed else None))
    return Origin(sourceId=source, observationId=observation, schema="gold", object="fact_sales")


def draft_body(origin):
    return {"name": "Ventas", "description": "", "kind": "direct", "saveAs": "draft",
            "origin": origin.model_dump(by_alias=True), "selectedColumns": ['revenue "USD"', "tenant_id"],
            "governance": {}, "preparation": None, "medallion": None}
