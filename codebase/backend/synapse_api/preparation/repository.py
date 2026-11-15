"""Private SQLite boundary for preparation pipelines and catalog registration."""
import json
import sqlite3
from uuid import uuid4

from ..datasets.repository import DatasetRepository
from ..errors import ApiError
from .schemas import PreparationPipeline

PREPARATION_PROCESS_ID = "sales-cdc-v1"
PREPARATION_PROCESS_CONFIG = {"contractVersion": 1, "relation": "gold.cdc_sales_events"}


class PreparationRepository:
    def __init__(self, connection, user):
        self.conn, self.user = connection, user

    def _dto(self, row):
        return PreparationPipeline(
            id=row["id"], sourceId=row["source_id"], inputDatasetId=row["input_dataset_id"],
            preparedDatasetId=row["prepared_dataset_id"], processId=row["process_id"],
            processConfig=json.loads(row["process_config"]), enabled=bool(row["enabled"]),
            createdBy=row["created_by"], createdAt=row["created_at"], updatedAt=row["updated_at"],
        )

    def create_pipeline(self, *, source_id, input_dataset_id, prepared_dataset_name, enabled, timestamp):
        source = self.conn.execute("SELECT * FROM sources WHERE tenant_id=? AND id=?",
                                   (self.user.tenant, source_id)).fetchone()
        if source is None:
            raise ApiError(404, "source_not_found", "Fuente no disponible.")
        catalog = DatasetRepository(self.conn, self.user)
        input_dataset = catalog._row(input_dataset_id)
        if input_dataset["source_id"] != source_id:
            raise ApiError(404, "dataset_not_found", "Dataset de entrada no disponible.")
        if (input_dataset["schema_name"], input_dataset["object_name"]) != ("gold", "fact_sales"):
            raise ApiError(422, "unsupported_preparation_input", "Este proceso requiere el dataset de ventas gold.fact_sales.")
        connection = json.loads(source["connection"])
        if "gold" not in connection.get("schemas", []):
            raise ApiError(422, "source_schema_unavailable", "La fuente registrada no declara el esquema gold.")

        pipeline_id, prepared_dataset_id = str(uuid4()), str(uuid4())
        try:
            catalog.register_prepared_output(
                prepared_dataset_id, input_dataset_id, prepared_dataset_name, PREPARATION_PROCESS_ID, timestamp
            )
            self.conn.execute("""INSERT INTO preparation_pipelines(
                tenant_id,id,source_id,input_dataset_id,prepared_dataset_id,process_id,process_config,enabled,
                created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)""",
                (self.user.tenant, pipeline_id, source_id, input_dataset_id, prepared_dataset_id,
                 PREPARATION_PROCESS_ID, json.dumps(PREPARATION_PROCESS_CONFIG, sort_keys=True), int(enabled),
                 self.user.subject, timestamp, timestamp))
        except sqlite3.IntegrityError:
            raise ApiError(409, "preparation_pipeline_conflict", "Ya existe un pipeline o dataset preparado equivalente en este tenant.") from None
        return self.get(pipeline_id)

    def get(self, pipeline_id):
        row = self.conn.execute("SELECT * FROM preparation_pipelines WHERE tenant_id=? AND id=?",
                                (self.user.tenant, pipeline_id)).fetchone()
        if row is None:
            raise ApiError(404, "preparation_pipeline_not_found", "Pipeline no disponible.")
        return self._dto(row)

    def list(self):
        rows = self.conn.execute("SELECT * FROM preparation_pipelines WHERE tenant_id=? ORDER BY created_at DESC,id",
                                 (self.user.tenant,)).fetchall()
        return [self._dto(row) for row in rows]

    def enabled_pipelines(self):
        rows = self.conn.execute("SELECT * FROM preparation_pipelines WHERE tenant_id=? AND enabled=1 ORDER BY id",
                                 (self.user.tenant,)).fetchall()
        return [self._dto(row) for row in rows]
