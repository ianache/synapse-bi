"""Private SQL boundary; caller owns the connection and transaction."""
import json

from ..errors import ApiError
from .policy import missing_metadata, normalize_name
from .schemas import Dataset, DatasetOrigin, DatasetLineage, Origin, SaveDataset


class DatasetRepository:
    def __init__(self, connection, user):
        self.conn, self.user = connection, user

    def _row(self, dataset_id):
        row = self.conn.execute("""SELECT d.*,s.name AS source_name,s.version AS current_source_version,
            o.created_at AS observed_at,o.source_version FROM dataset_registry d
            JOIN sources s ON s.tenant_id=d.tenant_id AND s.id=d.source_id
            JOIN source_observations o ON o.tenant_id=d.tenant_id AND o.source_id=d.source_id AND o.id=d.observation_id
            WHERE d.tenant_id=? AND d.id=?""", (self.user.tenant, dataset_id)).fetchone()
        if row is None:
            raise ApiError(404, "dataset_not_found", "Dataset no disponible.")
        return row

    def _inputs(self, dataset_id):
        return [Origin(sourceId=r["source_id"], observationId=r["observation_id"], schema=r["schema_name"], object=r["object_name"])
                for r in self.conn.execute("SELECT * FROM dataset_inputs WHERE tenant_id=? AND dataset_id=? ORDER BY ordinal",
                                           (self.user.tenant, dataset_id))]

    def _body(self, row):
        return SaveDataset(name=row["name"], description=row["description"], kind=row["kind"], saveAs=row["registration_status"],
            origin=Origin(sourceId=row["source_id"], observationId=row["observation_id"], schema=row["schema_name"], object=row["object_name"]),
            selectedColumns=[r[0] for r in self.conn.execute("SELECT column_name FROM dataset_columns WHERE tenant_id=? AND dataset_id=? ORDER BY ordinal", (self.user.tenant, row["id"]))],
            governance={"owner": row["owner_declared"], "classification": row["classification_declared"],
                        "freshnessExpectation": row["freshness_expectation"], "loadReference": row["load_reference"]},
            preparation={"processReference": row["process_reference"], "inputOrigins": self._inputs(row["id"])} if row["kind"] == "prepared" else None,
            medallion=json.loads(row["medallion_document"]) if row["medallion_document"] is not None else None)

    def _dto(self, row):
        body = self._body(row)
        metadata = json.loads(row["source_metadata_document"])
        missing = missing_metadata(body)
        selected = set(body.selected_columns)
        return Dataset(id=row["id"], name=body.name, description=body.description, kind=body.kind,
            registrationStatus=body.save_as, completeness="incomplete" if missing else "complete", missingMetadata=missing,
            origin=DatasetOrigin(**body.origin.model_dump(by_alias=True), sourceName=row["source_name"], kind=metadata["kind"],
                                 observedAt=row["observed_at"], sourceVersion=row["source_version"], currentSourceVersion=row["current_source_version"]),
            selectedColumns=[column for column in metadata["columns"] if column["name"] in selected],
            sourceConstraints=metadata["constraints"], governance=body.governance, preparation=body.preparation, medallion=body.medallion,
            lineage=DatasetLineage(output=body.origin, datasetId=row["id"], inputOrigins=body.preparation.input_origins if body.preparation else [],
                                   processReference=body.preparation.process_reference if body.preparation else None),
            version=row["version"], createdAt=row["created_at"], updatedAt=row["updated_at"], createdBy=row["created_by"])

    def _save(self, dataset_id, body, resolved, timestamp, *, updating=False):
        governance = body.governance
        editable = (body.name, normalize_name(body.name), body.description, body.save_as,
                    governance.owner, governance.classification, governance.freshness_expectation, governance.load_reference,
                    body.preparation.process_reference if body.preparation else None,
                    body.medallion.model_dump_json(by_alias=True) if body.medallion is not None else None, timestamp)
        if updating:
            self.conn.execute("""UPDATE dataset_registry SET name=?,normalized_name=?,description=?,registration_status=?,
                owner_declared=?,classification_declared=?,freshness_expectation=?,load_reference=?,process_reference=?,medallion_document=?,
                updated_at=?,version=version+1 WHERE tenant_id=? AND id=?""", (*editable, self.user.tenant, dataset_id))
            self.conn.execute("DELETE FROM dataset_columns WHERE tenant_id=? AND dataset_id=?", (self.user.tenant, dataset_id))
            self.conn.execute("DELETE FROM dataset_inputs WHERE tenant_id=? AND dataset_id=?", (self.user.tenant, dataset_id))
        else:
            self.conn.execute("""INSERT INTO dataset_registry(name,normalized_name,description,registration_status,
                owner_declared,classification_declared,freshness_expectation,load_reference,process_reference,medallion_document,updated_at,
                tenant_id,id,kind,source_id,observation_id,schema_name,object_name,source_metadata_document,created_by,created_at,version)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)""",
                (*editable, self.user.tenant, dataset_id, body.kind, body.origin.source_id, body.origin.observation_id,
                 body.origin.schema_name, body.origin.object, json.dumps(resolved.output.metadata), self.user.subject, timestamp))
        selected = set(body.selected_columns)
        for column in resolved.output.metadata["columns"]:
            if column["name"] in selected:
                self.conn.execute("INSERT INTO dataset_columns VALUES(?,?,?,?)", (self.user.tenant, dataset_id, column["name"], column["position"]))
        for index, origin in enumerate(resolved.inputs, 1):
            self.conn.execute("INSERT INTO dataset_inputs VALUES(?,?,?,?,?,?,?,?)",
                (self.user.tenant, dataset_id, index, origin.source_id, origin.observation_id, origin.schema, origin.object, json.dumps(origin.metadata)))

    def _request(self, key, timestamp):
        return self.conn.execute("""SELECT * FROM dataset_requests
            WHERE tenant_id=? AND subject=? AND operation='datasets.create' AND key=? AND expires_at>?""",
            (self.user.tenant, self.user.subject, key, timestamp)).fetchone()

    def _save_request(self, key, fingerprint, dataset, timestamp, expiry):
        self.conn.execute("""INSERT INTO dataset_requests VALUES(?,?,'datasets.create',?,?,?,?,?,?)
            ON CONFLICT(tenant_id,subject,operation,key) DO UPDATE SET fingerprint=excluded.fingerprint,
            dataset_id=excluded.dataset_id,response_document=excluded.response_document,
            created_at=excluded.created_at,expires_at=excluded.expires_at""",
            (self.user.tenant, self.user.subject, key, fingerprint, dataset.id, dataset.model_dump_json(by_alias=True), timestamp, expiry))

    def _all(self):
        ids = self.conn.execute("SELECT id FROM dataset_registry WHERE tenant_id=? ORDER BY updated_at DESC,id ASC", (self.user.tenant,)).fetchall()
        return [self._dto(self._row(row[0])) for row in ids]
