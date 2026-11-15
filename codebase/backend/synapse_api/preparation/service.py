"""Shared manual/polled CDC validation, run ledger, and immutable publication."""
from datetime import datetime, timezone
import json
import logging
from uuid import uuid4

from ..auth import Principal
from ..errors import ApiError
from ..sources import ConnectionInput
from .processor import apply_events_to_state, validate_and_order_events
from .repository import PreparationRepository
from .schemas import PreparationRun, PreparedVersion
from ..source_connector import connect_prepared_writer, read_cdc_events, read_prepared_records

logger = logging.getLogger("synapse_api.preparation")


def _now():
    return datetime.now(timezone.utc)


def _json(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


class PreparationService:
    def __init__(self, database, settings, sources, *, reader=read_cdc_events, writer=connect_prepared_writer):
        self.db, self.settings, self.sources = database, settings, sources
        self.reader, self.writer = reader, writer

    def _context(self, user: Principal, pipeline_id):
        with self.db.connect() as connection:
            pipeline = PreparationRepository(connection, user).get(pipeline_id)
            source = connection.execute("SELECT * FROM sources WHERE tenant_id=? AND id=?",
                                        (user.tenant, pipeline.source_id)).fetchone()
        if source is None:
            raise ApiError(404, "source_not_found", "Fuente no disponible.")
        try:
            source_config = ConnectionInput.model_validate(json.loads(source["connection"]))
        except (ValueError, TypeError):
            raise ApiError(503, "source_configuration_unavailable", "La configuraciÃ³n de la fuente no estÃ¡ disponible.") from None
        return pipeline, source_config, source

    @staticmethod
    def _version(row):
        if row is None:
            return None
        return PreparedVersion(
            datasetId=row["dataset_id"], versionId=row["version_id"], versionNumber=row["version_number"],
            inputDatasetId=row["input_dataset_id"], processId=row["process_id"],
            processConfig=row["process_config"] if isinstance(row["process_config"], dict) else json.loads(row["process_config"]),
            runId=row["run_id"], sourceRangeStart=row["source_range_start"],
            sourceRangeEnd=row["source_range_end"], eventCount=row["event_count"], createdAt=row["created_at"],
        )

    @staticmethod
    def _quality_summary(validation):
        checks = [{"code": finding.code, "passed": False, "rejectedCount": finding.rejected_count}
                  for finding in validation.findings]
        for code in ("missing_business_key", "invalid_event", "missing_required_fields", "duplicate_event_id"):
            if code not in {finding["code"] for finding in checks}:
                checks.append({"code": code, "passed": True, "rejectedCount": 0})
        return {
            "checks": checks,
            "acceptedCount": validation.input_count - validation.rejected_count,
            "rejectedCount": validation.rejected_count,
            "ambiguousTimestampCount": sum(event.timestamp_ambiguous for event in validation.events),
        }

    def _latest(self, connection, tenant_id, dataset_id):
        return connection.execute("""SELECT * FROM prepared.dataset_versions
            WHERE tenant_id=%s AND dataset_id=%s ORDER BY version_number DESC LIMIT 1""",                                  (tenant_id, dataset_id)).fetchone()

    def _execute(self, user, pipeline, source_config, raw_events, request_id, origin, *, source_range=None, retry_of=None):
        run_id = str(uuid4())
        started = _now()
        event_count = len(raw_events)
        range_start, range_end = source_range if source_range else (None, None)
        try:
            with self.writer(self.settings, source_config) as connection:
                connection.execute("SELECT set_config('app.tenant_id',%s,true)", (user.tenant,))
                previous = self._latest(connection, user.tenant, pipeline.prepared_dataset_id)
                prior_events = []
                prior_state = {}
                existing_ids = set()
                if previous:
                    prior_events = connection.execute("""SELECT source_event_id,business_key,operation,event_timestamp,
                        source_position,timestamp_ambiguous,after_image FROM prepared.version_events
                        WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s ORDER BY ordinal""",                        (user.tenant, pipeline.prepared_dataset_id, previous["version_id"])).fetchall()
                    existing_ids = {row["source_event_id"] for row in prior_events}
                    prior_state_rows = connection.execute("""SELECT business_key,after_image,last_event_id
                        FROM prepared.current_sales_state WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s""",                        (user.tenant, pipeline.prepared_dataset_id, previous["version_id"])).fetchall()
                    prior_state = {int(row["business_key"]): {"after_image": row["after_image"],
                                                                  "last_event_id": row["last_event_id"]}
                                   for row in prior_state_rows}

                validation = validate_and_order_events(raw_events, tenant_id=user.tenant,
                                                       existing_event_ids=existing_ids)
                summary = self._quality_summary(validation)
                connection.execute("""INSERT INTO prepared.preparation_runs(
                    tenant_id,pipeline_id,run_id,retry_of_run_id,origin,status,actor_id,request_id,started_at,event_count,
                    insert_count,update_count,delete_count,rejected_count,quality_results,source_range_start,source_range_end,
                    latest_successful_version_id)
                    VALUES(%s,%s,%s,%s,%s,'processing',%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s)""",                    (user.tenant, pipeline.id, run_id, retry_of, origin, user.subject, request_id, started, event_count,
                     validation.insert_count, validation.update_count, validation.delete_count, validation.rejected_count,
                     _json(summary), range_start, range_end, previous["version_id"] if previous else None))

                if validation.blocked:
                    ended = _now()
                    quality_error = "No se publicÃ³ la versiÃ³n porque uno o mÃ¡s controles de calidad rechazaron el lote."
                    connection.execute("""UPDATE prepared.preparation_runs SET status='quality_rejected',ended_at=%s,
                        error_code='cdc_quality_rejected',sanitized_error=%s WHERE tenant_id=%s AND run_id=%s""",                        (ended, quality_error, user.tenant, run_id))
                    return PreparationRun(
                        id=run_id, pipelineId=pipeline.id, datasetId=pipeline.prepared_dataset_id,
                        processId=pipeline.process_id, origin=origin, status="quality_rejected", startedAt=started,
                        endedAt=ended, eventCount=event_count, insertCount=validation.insert_count,
                        updateCount=validation.update_count, deleteCount=validation.delete_count,
                        rejectedCount=validation.rejected_count, qualityResults=summary,
                        latestSuccessfulVersion=self._version(previous), retryOfRunId=retry_of,
                        errorCode="cdc_quality_rejected", sanitizedError=quality_error)

                version_id = str(uuid4())
                version_number = (previous["version_number"] + 1) if previous else 1
                version_events = [dict(row) for row in prior_events]
                next_ordinal = len(version_events) + 1
                for event in validation.events:
                    version_events.append({
                        "source_event_id": event.source_event_id, "business_key": event.business_key,
                        "operation": event.operation, "event_timestamp": event.event_timestamp,
                        "source_position": event.source_position, "timestamp_ambiguous": event.timestamp_ambiguous,
                        "after_image": event.after_image,
                    })
                state = apply_events_to_state(prior_state, validation.events)
                connection.execute("""INSERT INTO prepared.dataset_versions(
                    tenant_id,dataset_id,version_id,version_number,input_dataset_id,process_id,process_config,run_id,
                    source_range_start,source_range_end,event_count)
                    VALUES(%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s)""",
                    (user.tenant, pipeline.prepared_dataset_id, version_id, version_number,
                     pipeline.input_dataset_id, pipeline.process_id, _json(pipeline.process_config), run_id,
                     range_start, range_end, len(version_events)))
                for ordinal, event in enumerate(version_events, 1):
                    connection.execute("""INSERT INTO prepared.version_events(
                        tenant_id,dataset_id,version_id,ordinal,source_event_id,business_key,operation,event_timestamp,
                        source_position,timestamp_ambiguous,after_image)
                        VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb)""",
                        (user.tenant, pipeline.prepared_dataset_id, version_id, ordinal, event["source_event_id"],
                         event["business_key"], event["operation"], event["event_timestamp"], event["source_position"],
                         event["timestamp_ambiguous"], _json(event["after_image"]) if event["after_image"] is not None else None))
                for business_key, value in state.items():
                    connection.execute("""INSERT INTO prepared.current_sales_state(
                        tenant_id,dataset_id,version_id,business_key,after_image,last_event_id)
                        VALUES(%s,%s,%s,%s,%s::jsonb,%s)""",
                        (user.tenant, pipeline.prepared_dataset_id, version_id, business_key,
                         _json(value["after_image"]), value["last_event_id"]))

                if origin == "poll" and range_end is not None:
                    connection.execute("""INSERT INTO prepared.pipeline_checkpoints(tenant_id,pipeline_id,capture_position)
                        VALUES(%s,%s,%s) ON CONFLICT(tenant_id,pipeline_id) DO UPDATE
                        SET capture_position=GREATEST(prepared.pipeline_checkpoints.capture_position,excluded.capture_position),
                            updated_at=clock_timestamp()""", (user.tenant, pipeline.id, range_end))
                ended = _now()
                connection.execute("""UPDATE prepared.preparation_runs SET status='published',ended_at=%s,
                    published_version_id=%s,latest_successful_version_id=%s WHERE tenant_id=%s AND run_id=%s""",
                    (ended, version_id, version_id, user.tenant, run_id))
                version_row = connection.execute("SELECT * FROM prepared.dataset_versions WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s",
                                                 (user.tenant, pipeline.prepared_dataset_id, version_id)).fetchone()
                return PreparationRun(
                    id=run_id, pipelineId=pipeline.id, datasetId=pipeline.prepared_dataset_id,
                    processId=pipeline.process_id, origin=origin, status="published", startedAt=started, endedAt=ended,
                    eventCount=event_count, insertCount=validation.insert_count, updateCount=validation.update_count,
                    deleteCount=validation.delete_count, rejectedCount=0, qualityResults=summary,
                    publishedVersion=self._version(version_row), latestSuccessfulVersion=self._version(version_row),
                    retryOfRunId=retry_of)
        except Exception as error:
            code, message = self._safe_error(error)
            logger.error("preparation_run_failed error_type=%s sqlstate=%s code=%s", type(error).__name__,
                         getattr(error, "sqlstate", None), getattr(error, "code", None))
            return self._record_failure(user, pipeline, source_config, run_id, request_id, origin, started,
                                        event_count, retry_of, range_start, range_end, code, message)

    @staticmethod
    def _safe_error(error):
        if isinstance(error, ApiError):
            return error.code, error.message
        return "preparation_execution_failed", "Falló la ejecución técnica. Revisa el código saneado y vuelve a intentar."

    def _record_failure(self, user, pipeline, source_config, run_id, request_id, origin, started,
                        event_count, retry_of, range_start, range_end, code, message):
        try:
            with self.writer(self.settings, source_config) as connection:
                connection.execute("SELECT set_config('app.tenant_id',%s,true)", (user.tenant,))
                previous = self._latest(connection, user.tenant, pipeline.prepared_dataset_id)
                ended = _now()
                connection.execute("""INSERT INTO prepared.preparation_runs(
                    tenant_id,pipeline_id,run_id,retry_of_run_id,origin,status,actor_id,request_id,started_at,ended_at,
                    event_count,rejected_count,quality_results,source_range_start,source_range_end,
                    latest_successful_version_id,error_code,sanitized_error)
                    VALUES(%s,%s,%s,%s,%s,'technical_failure',%s,%s,%s,%s,%s,%s,'{}'::jsonb,%s,%s,%s,%s,%s)""",
                    (user.tenant, pipeline.id, run_id, retry_of, origin, user.subject, request_id, started, ended,
                     event_count, event_count, range_start, range_end, previous["version_id"] if previous else None,
                     code, message))
                return PreparationRun(
                    id=run_id, pipelineId=pipeline.id, datasetId=pipeline.prepared_dataset_id,
                    processId=pipeline.process_id, origin=origin, status="technical_failure", startedAt=started,
                    endedAt=ended, eventCount=event_count, insertCount=0, updateCount=0, deleteCount=0,
                    rejectedCount=event_count, qualityResults={}, latestSuccessfulVersion=self._version(previous),
                    retryOfRunId=retry_of, errorCode=code, sanitizedError=message)
        except Exception as error:
            # Do not log exception text, payload values, connection strings, or credentials.
            logger.error("preparation_failure_record_unavailable tenant=%s pipeline=%s error_type=%s sqlstate=%s code=%s",
                         user.tenant, pipeline.id, type(error).__name__, getattr(error, "sqlstate", None),
                         getattr(error, "code", None))
            raise ApiError(503, "preparation_failure_record_unavailable",
                           "No se pudo guardar la evidencia saneada de la ejecuciÃ³n.") from None

    def execute_manual(self, user: Principal, pipeline_id, raw_events, request_id, *, retry_of=None):
        pipeline, source_config, _ = self._context(user, pipeline_id)
        if not raw_events:
            raise ApiError(422, "empty_cdc_batch", "EnvÃ­a al menos un evento CDC.")
        return self._execute(user, pipeline, source_config, raw_events, request_id, "manual", retry_of=retry_of)

    def poll_pipeline(self, user: Principal, pipeline_id, request_id, *, retry_of=None):
        pipeline, source_config, source = self._context(user, pipeline_id)
        run_id, started = str(uuid4()), _now()
        try:
            with self.writer(self.settings, source_config) as connection:
                connection.execute("SELECT set_config('app.tenant_id',%s,true)", (user.tenant,))
                row = connection.execute("SELECT capture_position FROM prepared.pipeline_checkpoints WHERE tenant_id=%s AND pipeline_id=%s",
                                         (user.tenant, pipeline.id)).fetchone()
                checkpoint = int(row["capture_position"]) if row else 0
            source_body, password = self.sources.stored_connection(source)
            rows = self.reader(self.settings, source_body, password, user.tenant, checkpoint, limit=1000)
            if not rows:
                return None
            capture_ids = [int(row["capture_id"]) for row in rows]
            events = [{key: value for key, value in row.items() if key != "capture_id"} for row in rows]
            return self._execute(user, pipeline, source_config, events, request_id, "poll",
                                 source_range=(min(capture_ids), max(capture_ids)), retry_of=retry_of)
        except Exception as error:
            code, message = self._safe_error(error)
            return self._record_failure(user, pipeline, source_config, run_id, request_id, "poll", started,
                                        0, retry_of, None, None, None, code, message)

    def _run_from_row(self, connection, row, pipeline):
        latest = None
        if row["latest_successful_version_id"]:
            latest = connection.execute("SELECT * FROM prepared.dataset_versions WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s",
                                        (row["tenant_id"], pipeline.prepared_dataset_id, row["latest_successful_version_id"])).fetchone()
        published = None
        if row["published_version_id"]:
            published = connection.execute("SELECT * FROM prepared.dataset_versions WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s",
                                           (row["tenant_id"], pipeline.prepared_dataset_id, row["published_version_id"])).fetchone()
        return PreparationRun(id=row["run_id"], pipelineId=row["pipeline_id"], datasetId=pipeline.prepared_dataset_id,
            processId=pipeline.process_id, origin=row["origin"], status=row["status"], startedAt=row["started_at"],
            endedAt=row["ended_at"], eventCount=row["event_count"], insertCount=row["insert_count"],
            updateCount=row["update_count"], deleteCount=row["delete_count"], rejectedCount=row["rejected_count"],
            qualityResults=row["quality_results"], publishedVersion=self._version(published),
            latestSuccessfulVersion=self._version(latest), retryOfRunId=row["retry_of_run_id"],
            errorCode=row["error_code"], sanitizedError=row["sanitized_error"])

    def list_runs(self, user, *, limit=50, offset=0, pipeline_id=None):
        with self.db.connect() as connection:
            repository = PreparationRepository(connection, user)
            pipelines = [repository.get(pipeline_id)] if pipeline_id else repository.list()
        records = []
        for pipeline in pipelines:
            _, source_config, _ = self._context(user, pipeline.id)
            with self.writer(self.settings, source_config) as connection:
                connection.execute("SELECT set_config('app.tenant_id',%s,true)", (user.tenant,))
                rows = connection.execute("SELECT * FROM prepared.preparation_runs WHERE tenant_id=%s AND pipeline_id=%s ORDER BY started_at DESC",
                                          (user.tenant, pipeline.id)).fetchall()
                records.extend((row["started_at"], self._run_from_row(connection, row, pipeline)) for row in rows)
        records.sort(key=lambda item: item[0], reverse=True)
        page = records[offset:offset+limit]
        return {"items": [item[1] for item in page], "total": len(records), "limit": limit, "offset": offset}

    def get_run(self, user, run_id):
        with self.db.connect() as connection:
            pipelines = PreparationRepository(connection, user).list()
        for pipeline in pipelines:
            _, source_config, _ = self._context(user, pipeline.id)
            with self.writer(self.settings, source_config) as connection:
                connection.execute("SELECT set_config('app.tenant_id',%s,true)", (user.tenant,))
                row = connection.execute("SELECT * FROM prepared.preparation_runs WHERE tenant_id=%s AND run_id=%s AND pipeline_id=%s",
                                         (user.tenant, run_id, pipeline.id)).fetchone()
                if row:
                    return self._run_from_row(connection, row, pipeline)
        raise ApiError(404, "preparation_run_not_found", "Ejecución no disponible.")

    def retry_run(self, user, run_id, request_id, events=None):
        previous = self.get_run(user, run_id)
        if previous.status not in {"quality_rejected", "technical_failure"}:
            raise ApiError(409, "preparation_run_not_retryable", "La ejecución no requiere reintento.")
        if previous.origin == "manual":
            if not events:
                raise ApiError(422, "retry_events_required", "El reintento manual requiere reenviar el lote CDC.")
            return self.execute_manual(user, previous.pipeline_id, events, request_id, retry_of=run_id)
        return self.poll_pipeline(user, previous.pipeline_id, request_id, retry_of=run_id)

    def _dataset_pipeline(self, user, dataset_id):
        with self.db.connect() as connection:
            for pipeline in PreparationRepository(connection, user).list():
                if pipeline.prepared_dataset_id == dataset_id:
                    return pipeline
        raise ApiError(404, "prepared_dataset_not_found", "Dataset preparado no disponible.")

    def list_versions(self, user, dataset_id, limit, offset):
        pipeline = self._dataset_pipeline(user, dataset_id)
        _, _, source = self._context(user, pipeline.id)
        source_body, password = self.sources.stored_connection(source)
        total, rows = read_prepared_records(self.settings, source_body, password, user.tenant, dataset_id,
                                            "versions", None, limit, offset)
        return {"items": [self._version(row) for row in rows], "total": total, "limit": limit, "offset": offset}

    def read_history(self, user, dataset_id, version_id, limit, offset):
        pipeline = self._dataset_pipeline(user, dataset_id)
        _, _, source = self._context(user, pipeline.id)
        source_body, password = self.sources.stored_connection(source)
        total, rows = read_prepared_records(self.settings, source_body, password, user.tenant, dataset_id,
                                            "history", version_id, limit, offset)
        return {"items": rows, "total": total, "limit": limit, "offset": offset}

    def read_current_state(self, user, dataset_id, version_id, limit, offset):
        pipeline = self._dataset_pipeline(user, dataset_id)
        _, _, source = self._context(user, pipeline.id)
        source_body, password = self.sources.stored_connection(source)
        total, rows = read_prepared_records(self.settings, source_body, password, user.tenant, dataset_id,
                                            "current-state", version_id, limit, offset)
        return {"items": rows, "total": total, "limit": limit, "offset": offset}
