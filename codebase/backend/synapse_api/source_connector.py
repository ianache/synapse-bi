"""Bounded, read-only PostgreSQL metadata connector. Never reads business rows."""
from ipaddress import ip_address
import json
from pathlib import Path
import logging

import psycopg
from psycopg.rows import dict_row

from .errors import ApiError

logger = logging.getLogger("synapse_api.source_connector")


def approved_address(settings, body):
    targets = settings.source_targets
    if not targets and settings.environment in {"development", "test"}:
        targets = ({"host": "127.0.0.1", "port": 55432, "address": "127.0.0.1"},
                   {"host": "localhost", "port": 55432, "address": "127.0.0.1"})
    target = next((t for t in targets if t["host"] == body.host and t["port"] == body.port), None)
    if not target:
        raise ApiError(422, "destination_denied", "Destino no autorizado. Solicita al operador habilitar el host y puerto.")
    address = ip_address(target["address"])
    if body.tls_mode == "disable" and not (settings.environment in {"development", "test"} and address.is_loopback and body.laboratory):
        raise ApiError(422, "tls_required", "TLS verificado es obligatorio fuera del laboratorio local.")
    return str(address)


def observe_postgres(settings, body, password, metadata=False):
    address = approved_address(settings, body)
    kwargs = dict(host=body.host, hostaddr=address, port=body.port, dbname=body.database,
                  user=body.username, password=password, sslmode=body.tls_mode,
                  connect_timeout=3, application_name="synapse-schema-observer",
                  options="-c default_transaction_read_only=on -c statement_timeout=5000 -c lock_timeout=1000 -c search_path=pg_catalog")
    if body.tls_mode == "verify-full":
        kwargs["sslrootcert"] = settings.source_ca_file or "system"
    try:
        with psycopg.connect(**kwargs, row_factory=dict_row) as conn:
            conn.read_only = True
            conn.isolation_level = psycopg.IsolationLevel.REPEATABLE_READ
            role = conn.execute("SELECT rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user").fetchone()
            if not role or any(role.values()):
                raise ApiError(422, "privileged_role", "Usa una cuenta de lectura sin privilegios elevados.")
            # Prevent using a writable account even when this transaction is read-only.
            writable = conn.execute("""SELECT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                WHERE n.nspname=ANY(%s) AND c.relkind IN ('r','p') AND
                (has_table_privilege(c.oid,'INSERT') OR has_table_privilege(c.oid,'UPDATE') OR has_table_privilege(c.oid,'DELETE') OR has_table_privilege(c.oid,'TRUNCATE') OR has_table_privilege(c.oid,'TRIGGER'))) AS writable""", (body.schemas,)).fetchone()
            if writable["writable"]:
                raise ApiError(422, "writable_role", "La cuenta tiene permisos de escritura. Usa una cuenta de solo lectura.")
            available = conn.execute("SELECT nspname,has_schema_privilege(oid,'CREATE') AS writable FROM pg_namespace WHERE nspname=ANY(%s) AND has_schema_privilege(oid,'USAGE') ORDER BY nspname", (body.schemas,)).fetchall()
            if len(available) != len(body.schemas):
                raise ApiError(422, "schema_unavailable", "Un esquema solicitado no existe o no permite acceso.")
            if any(s["writable"] for s in available):
                raise ApiError(422, "writable_role", "La cuenta permite crear objetos. Usa una cuenta de solo lectura.")
            result = {"serverVersion": conn.info.server_version, "schemas": [r["nspname"] for r in available]}
            if not metadata:
                return result
            objects = conn.execute("""SELECT c.oid, n.nspname AS schema, c.relname AS name,
                CASE WHEN c.relkind IN ('v','m') THEN 'view' ELSE 'table' END AS kind,
                left(obj_description(c.oid,'pg_class'),2000) AS comment
                FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                WHERE n.nspname=ANY(%s) AND c.relkind IN ('r','p','v','m') AND has_table_privilege(c.oid,'SELECT')
                ORDER BY n.nspname,c.relname LIMIT 201""", (body.schemas,)).fetchall()
            if len(objects) > 200:
                raise ApiError(413, "metadata_limit", "El esquema supera el límite de 200 objetos. Reduce el alcance.")
            oids = [o["oid"] for o in objects]
            columns = conn.execute("""SELECT a.attrelid AS oid,a.attname AS name,a.attnum AS position,
                format_type(a.atttypid,a.atttypmod) AS type, NOT a.attnotnull AS nullable,
                a.attgenerated <> '' AS generated, left(col_description(a.attrelid,a.attnum),2000) AS comment
                FROM pg_attribute a WHERE a.attrelid=ANY(%s::oid[]) AND a.attnum>0 AND NOT a.attisdropped
                ORDER BY a.attrelid,a.attnum LIMIT 5001""", (oids,)).fetchall()
            if len(columns) > 5000:
                raise ApiError(413, "metadata_limit", "El esquema supera el límite de columnas.")
            constraints = conn.execute("""SELECT k.conrelid AS oid,k.conname AS name,k.contype AS kind,
                ARRAY(SELECT a.attname FROM unnest(k.conkey) WITH ORDINALITY AS x(num,ord)
                  JOIN pg_attribute a ON a.attrelid=k.conrelid AND a.attnum=x.num ORDER BY x.ord) AS columns,
                rn.nspname AS "referencedSchema",rc.relname AS "referencedTable",
                ARRAY(SELECT a.attname FROM unnest(k.confkey) WITH ORDINALITY AS x(num,ord)
                  JOIN pg_attribute a ON a.attrelid=k.confrelid AND a.attnum=x.num ORDER BY x.ord) AS "referencedColumns"
                FROM pg_constraint k LEFT JOIN pg_class rc ON rc.oid=k.confrelid
                LEFT JOIN pg_namespace rn ON rn.oid=rc.relnamespace
                WHERE k.conrelid=ANY(%s::oid[]) AND k.contype IN ('p','u','f','c') ORDER BY k.conname LIMIT 5001""", (oids,)).fetchall()
            if len(constraints) > 5000:
                raise ApiError(413, "metadata_limit", "El esquema supera el límite de restricciones.")
            for obj in objects:
                oid = obj.pop("oid")
                obj["columns"] = [{k: v for k, v in c.items() if k != "oid"} for c in columns if c["oid"] == oid]
                obj["constraints"] = [{k: v for k, v in c.items() if k != "oid"} for c in constraints if c["oid"] == oid]
            result["objects"] = objects
            if len(json.dumps(result).encode()) > 2_000_000:
                raise ApiError(413, "metadata_limit", "La observación supera el límite de 2 MB.")
            return result
    except psycopg.Error as error:
        code = getattr(error, "sqlstate", None)
        if code in {"28P01", "28000"}:
            raise ApiError(422, "connection_rejected", "PostgreSQL rechazó las credenciales.") from None
        if code == "42501":
            raise ApiError(422, "access_denied", "La cuenta no tiene los permisos de lectura necesarios.") from None
        raise ApiError(422, "connection_failed", "No se pudo conectar u observar PostgreSQL. Revisa disponibilidad, TLS y permisos.") from None


def _laboratory_connect_kwargs(settings, body, username, password, application_name):
    address = approved_address(settings, body)
    kwargs = dict(host=body.host, hostaddr=address, port=body.port, dbname=body.database,
                  user=username, password=password, sslmode=body.tls_mode,
                  connect_timeout=3, application_name=application_name,
                  options="-c statement_timeout=15000 -c lock_timeout=2000 -c search_path=pg_catalog")
    if body.tls_mode == "verify-full":
        kwargs["sslrootcert"] = settings.source_ca_file or "system"
    return kwargs


def read_cdc_events(settings, body, password, tenant_id, after_capture, *, through_capture=None, limit=1000):
    """Read only the fixed lab CDC relation through the registered tenant reader."""
    if "gold" not in body.schemas or not 1 <= limit <= 5000:
        raise ApiError(422, "cdc_source_unavailable", "La fuente no tiene el alcance CDC autorizado.")
    upper = "AND capture_id <= %s" if through_capture is not None else ""
    parameters = (tenant_id, after_capture, through_capture, limit) if through_capture is not None else (tenant_id, after_capture, limit)
    query = f"""SELECT capture_id,source_event_id,business_key,operation,event_timestamp,source_position,after_image
        FROM gold.cdc_sales_events WHERE tenant_id=%s AND capture_id>%s {upper}
        ORDER BY capture_id LIMIT %s"""
    kwargs = _laboratory_connect_kwargs(settings, body, body.username, password, "synapse-cdc-reader")
    try:
        with psycopg.connect(**kwargs, row_factory=dict_row) as conn:
            conn.read_only = True
            rows = conn.execute(query, parameters).fetchall()
            return [dict(row) for row in rows]
    except psycopg.Error as error:
        sqlstate = getattr(error, "sqlstate", None)
        logger.error("cdc_source_read_failed error_type=%s sqlstate=%s", type(error).__name__, sqlstate)
        if sqlstate in {"28P01", "28000"}:
            raise ApiError(503, "cdc_source_credentials", "No se pudieron validar las credenciales lectoras de CDC.") from None
        if sqlstate == "42501":
            raise ApiError(503, "cdc_source_access_denied", "La cuenta lectora no tiene acceso a la tabla CDC del laboratorio.") from None
        if sqlstate in {"42P01", "42703"}:
            raise ApiError(503, "cdc_source_contract_unavailable", "La tabla CDC del laboratorio no coincide con el contrato esperado.") from None
        if sqlstate == "57014":
            raise ApiError(503, "cdc_source_timeout", "La lectura de CDC superó el límite de tiempo del laboratorio.") from None
        raise ApiError(503, "cdc_source_unavailable", "La lectura de CDC no está disponible; conserva el checkpoint para reintentar.") from None


def connect_prepared_writer(settings, body):
    """Open a separate lab writer connection; caller owns transaction and close."""
    if settings.environment == "production":
        raise ApiError(503, "prepared_writer_disabled", "La escritura CDC solo está habilitada en el laboratorio.")
    secret_path = Path(settings.prepared_writer_secret_file) if settings.prepared_writer_secret_file else None
    if secret_path is None:
        raise ApiError(503, "prepared_writer_unconfigured", "El operador debe configurar la credencial escritora del laboratorio.")
    try:
        password = secret_path.read_text(encoding="utf-8").strip()
        if not password:
            raise OSError("empty secret")
    except OSError:
        raise ApiError(503, "prepared_writer_unavailable", "La credencial escritora del laboratorio no está disponible.") from None
    kwargs = _laboratory_connect_kwargs(settings, body, "bi_prepared_writer", password, "synapse-prepared-writer")
    try:
        return psycopg.connect(**kwargs, row_factory=dict_row)
    except psycopg.Error:
        raise ApiError(503, "prepared_writer_unavailable", "No se pudo conectar al almacén preparado del laboratorio.") from None


def read_prepared_records(settings, body, password, tenant_id, dataset_id, relation, version_id, limit, offset):
    """Read fixed prepared relations using the registered tenant reader role."""
    if relation == "versions":
        count_sql = "SELECT count(*) AS n FROM prepared.dataset_versions WHERE tenant_id=%s AND dataset_id=%s"
        data_sql = "SELECT * FROM prepared.dataset_versions WHERE tenant_id=%s AND dataset_id=%s ORDER BY version_number DESC LIMIT %s OFFSET %s"
        params = (tenant_id, dataset_id)
        version_params = None
    elif relation == "history":
        count_sql = "SELECT count(*) AS n FROM prepared.version_events WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s"
        data_sql = "SELECT source_event_id,business_key,operation,event_timestamp,source_position,timestamp_ambiguous,after_image FROM prepared.version_events WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s ORDER BY ordinal LIMIT %s OFFSET %s"
        params = (tenant_id, dataset_id, version_id)
        version_params = params
    elif relation == "current-state":
        count_sql = "SELECT count(*) AS n FROM prepared.current_sales_state WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s"
        data_sql = "SELECT business_key,after_image,last_event_id FROM prepared.current_sales_state WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s ORDER BY business_key LIMIT %s OFFSET %s"
        params = (tenant_id, dataset_id, version_id)
        version_params = params
    else:
        raise ApiError(422, "prepared_relation_unavailable", "La relación preparada no está disponible.")
    if not 1 <= limit <= 500 or offset < 0:
        raise ApiError(422, "invalid_page", "La página solicitada no está disponible.")
    kwargs = _laboratory_connect_kwargs(settings, body, body.username, password, "synapse-prepared-reader")
    try:
        with psycopg.connect(**kwargs, row_factory=dict_row) as conn:
            conn.read_only = True
            if version_params and conn.execute("SELECT 1 FROM prepared.dataset_versions WHERE tenant_id=%s AND dataset_id=%s AND version_id=%s", version_params).fetchone() is None:
                raise ApiError(404, "prepared_version_not_found", "Versión preparada no disponible.")
            total = conn.execute(count_sql, params).fetchone()["n"]
            rows = conn.execute(data_sql, (*params, limit, offset)).fetchall()
            return total, [dict(row) for row in rows]
    except ApiError:
        raise
    except psycopg.Error as error:
        sqlstate = getattr(error, "sqlstate", None)
        logger.error("prepared_data_read_failed error_type=%s sqlstate=%s", type(error).__name__, sqlstate)
        if sqlstate in {"28P01", "28000"}:
            raise ApiError(503, "prepared_reader_credentials", "No se pudieron validar las credenciales lectoras del dataset preparado.") from None
        if sqlstate == "42501":
            raise ApiError(503, "prepared_reader_access_denied", "La cuenta lectora no tiene acceso a la salida preparada.") from None
        if sqlstate in {"42P01", "42703"}:
            raise ApiError(503, "prepared_schema_unavailable", "El esquema preparado no está disponible.") from None
        raise ApiError(503, "prepared_data_unavailable", "La lectura del dataset preparado no está disponible.") from None
