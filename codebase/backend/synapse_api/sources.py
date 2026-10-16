"""Tenant-scoped source registry, encrypted credentials and immutable observations."""
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
import os
from pathlib import Path
import sqlite3
from typing import Literal
from uuid import uuid4

from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, Header, Request
from pydantic import Field, SecretStr, field_validator

from .auth import Principal, require
from .dashboards import audit, now
from .errors import ApiError
from .schemas import DTO
from .source_connector import approved_address, observe_postgres

SOURCE_SCHEMA = """
CREATE TABLE IF NOT EXISTS sources(
 tenant_id TEXT NOT NULL,id TEXT NOT NULL,name TEXT NOT NULL,normalized_name TEXT NOT NULL,
 description TEXT NOT NULL,connection TEXT NOT NULL,secret BLOB NOT NULL,
 status TEXT NOT NULL,tested_at TEXT,created_at TEXT NOT NULL,version INTEGER NOT NULL,
 PRIMARY KEY(tenant_id,id),UNIQUE(tenant_id,normalized_name));
CREATE TABLE IF NOT EXISTS source_probes(
 id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,subject TEXT NOT NULL,fingerprint TEXT NOT NULL,expires_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS source_observations(
 tenant_id TEXT NOT NULL,source_id TEXT NOT NULL,id TEXT NOT NULL,sequence INTEGER NOT NULL,
 source_version INTEGER NOT NULL,created_at TEXT NOT NULL,status TEXT NOT NULL,
 snapshot TEXT,error_code TEXT,PRIMARY KEY(tenant_id,source_id,id),
 FOREIGN KEY(tenant_id,source_id) REFERENCES sources(tenant_id,id));
INSERT OR IGNORE INTO schema_migrations VALUES(2);
"""


class ConnectionInput(DTO):
    host: str = Field(min_length=1, max_length=253, pattern=r"^[a-zA-Z0-9][a-zA-Z0-9.:-]*$")
    port: int = Field(ge=1, le=65535)
    database: str = Field(min_length=1, max_length=63, pattern=r"^[a-zA-Z0-9_][a-zA-Z0-9_-]*$")
    username: str = Field(min_length=1, max_length=63, pattern=r"^[a-zA-Z0-9_][a-zA-Z0-9_-]*$")
    tls_mode: Literal["verify-full", "disable"] = "verify-full"
    laboratory: bool = False
    schemas: list[str] = Field(min_length=1, max_length=10)

    @field_validator("schemas")
    @classmethod
    def safe_schemas(cls, value):
        import re
        if len(value) != len(set(value)) or any(not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]{0,62}", s) or s.startswith("pg_") or s == "information_schema" for s in value):
            raise ValueError("Explicit business schemas required")
        return value


class TestInput(ConnectionInput):
    password: SecretStr = Field(min_length=1, max_length=512)


class SaveSource(TestInput):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=1000)
    test_id: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def valid_name(cls, value):
        value = value.strip()
        if not value or any(ord(c) < 32 for c in value):
            raise ValueError("Printable name required")
        return value


class SourceService:
    def __init__(self, database, settings):
        self.db, self.settings = database, settings
        self.connector = observe_postgres

    def key(self):
        path = Path(self.settings.source_key_file) if self.settings.source_key_file else self.db.path.parent / "source-key.key"
        if not self.settings.source_key_file and self.settings.environment == "production":
            raise ApiError(503, "vault_unconfigured", "El operador debe configurar la clave de cifrado de fuentes.")
        try:
            if self.settings.environment in {"development", "test"}:
                path.parent.mkdir(parents=True, exist_ok=True)
                try:
                    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                except FileExistsError:
                    pass
                else:
                    with os.fdopen(fd, "wb") as stream:
                        stream.write(Fernet.generate_key())
            key = path.read_bytes()
            Fernet(key)
            return key
        except (OSError, ValueError):
            raise ApiError(503, "vault_unavailable", "La clave de cifrado no está disponible.") from None

    def fingerprint(self, body):
        values = ConnectionInput.model_validate(body.model_dump(include=set(ConnectionInput.model_fields))).model_dump()
        values["password"] = body.password.get_secret_value()
        return hmac.new(self.key(), json.dumps(values, sort_keys=True).encode(), hashlib.sha256).hexdigest()

    def find(self, conn, user, source_id):
        row = conn.execute("SELECT * FROM sources WHERE tenant_id=? AND id=?", (user.tenant, source_id)).fetchone()
        if not row:
            raise ApiError(404, "source_not_found", "Fuente no disponible.")
        return row

    def public(self, row):
        return {"id": row["id"], "name": row["name"], "description": row["description"],
                **json.loads(row["connection"]), "connector": "PostgreSQL", "credentialConfigured": True,
                "status": row["status"], "testedAt": row["tested_at"], "createdAt": row["created_at"], "version": row["version"]}

    def test(self, user, body, request_id):
        approved_address(self.settings, body)
        fingerprint = self.fingerprint(body)
        result = self.connector(self.settings, body, body.password.get_secret_value())
        probe_id = str(uuid4())
        expires = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
        with self.db.connect(write=True) as conn:
            conn.execute("DELETE FROM source_probes WHERE expires_at<?", (now(),))
            conn.execute("INSERT INTO source_probes VALUES(?,?,?,?,?)", (probe_id, user.tenant, user.subject, fingerprint, expires))
            audit(conn, user, "source.test", probe_id, request_id)
        return {"testId": probe_id, "validUntil": expires, **result}

    def save(self, user, body, request_id, source_id=None, if_match=None):
        approved_address(self.settings, body)
        fingerprint = self.fingerprint(body)
        secret = Fernet(self.key()).encrypt(body.password.get_secret_value().encode())
        connection = json.dumps(ConnectionInput.model_validate(body.model_dump(include=set(ConnectionInput.model_fields))).model_dump(by_alias=True))
        try:
            with self.db.connect(write=True) as conn:
                old = self.find(conn, user, source_id) if source_id else None
                if old and if_match != f'"{old["version"]}"':
                    raise ApiError(412, "source_changed", "La fuente cambió. Recarga y vuelve a validar la conexión.")
                proof = conn.execute("SELECT * FROM source_probes WHERE id=? AND tenant_id=? AND subject=?", (body.test_id, user.tenant, user.subject)).fetchone()
                if not proof or proof["expires_at"] < now() or not hmac.compare_digest(proof["fingerprint"], fingerprint):
                    raise ApiError(409, "test_required", "Prueba nuevamente la conexión antes de registrar estos datos.")
                source_id = source_id or str(uuid4())
                if old:
                    conn.execute("UPDATE sources SET name=?,normalized_name=?,description=?,connection=?,secret=?,status='connected',tested_at=?,version=version+1 WHERE tenant_id=? AND id=?", (body.name, body.name.casefold(), body.description, connection, secret, now(), user.tenant, source_id))
                else:
                    conn.execute("INSERT INTO sources VALUES(?,?,?,?,?,?,?,?,?,?,?)", (user.tenant, source_id, body.name, body.name.casefold(), body.description, connection, secret, "connected", now(), now(), 1))
                conn.execute("DELETE FROM source_probes WHERE id=?", (body.test_id,))
                audit(conn, user, "source.update" if old else "source.create", source_id, request_id)
                return self.public(self.find(conn, user, source_id))
        except sqlite3.IntegrityError:
            raise ApiError(409, "source_exists", "Ya existe una fuente con ese nombre.") from None

    def stored_connection(self, row):
        try:
            password = Fernet(self.key()).decrypt(row["secret"]).decode()
        except InvalidToken:
            raise ApiError(503, "vault_unavailable", "No se pudo abrir la credencial. Solicita revisión de la clave al operador.") from None
        return ConnectionInput.model_validate(json.loads(row["connection"])), password

    def run(self, user, source_id, request_id, metadata):
        with self.db.connect() as conn:
            row = self.find(conn, user, source_id)
        body, password = self.stored_connection(row)
        error = None
        try:
            result = self.connector(self.settings, body, password, metadata=metadata)
        except ApiError as failure:
            result, error = None, failure
        observation_id = str(uuid4())
        with self.db.connect(write=True) as conn:
            current = self.find(conn, user, source_id)
            if current["version"] != row["version"]:
                raise ApiError(409, "source_changed", "La conexión cambió durante la operación. Vuelve a intentarlo.")
            conn.execute("UPDATE sources SET status=?,tested_at=? WHERE tenant_id=? AND id=?", ("attention" if error else "connected", now(), user.tenant, source_id))
            if metadata:
                seq = conn.execute("SELECT COALESCE(MAX(sequence),0)+1 FROM source_observations WHERE tenant_id=? AND source_id=?", (user.tenant, source_id)).fetchone()[0]
                conn.execute("INSERT INTO source_observations VALUES(?,?,?,?,?,?,?,?,?)", (user.tenant, source_id, observation_id, seq, row["version"], now(), "failed" if error else "success", json.dumps(result) if result else None, error.code if error else None))
            action = "source.observe" if metadata else "source.test"
            audit(conn, user, action + (".failed" if error else ""), source_id, request_id)
        if error:
            raise error
        return self.observation(user, source_id, observation_id) if metadata else result

    def observation(self, user, source_id, observation_id=None):
        with self.db.connect() as conn:
            self.find(conn, user, source_id)
            rows = conn.execute("SELECT * FROM source_observations WHERE tenant_id=? AND source_id=? ORDER BY sequence DESC LIMIT 100", (user.tenant, source_id)).fetchall()
        items = []
        for row in rows:
            snapshot = json.loads(row["snapshot"]) if row["snapshot"] else None
            item = {"id": row["id"], "sequence": row["sequence"], "sourceVersion": row["source_version"], "createdAt": row["created_at"], "status": row["status"], "errorCode": row["error_code"],
                    "tables": sum(o["kind"] == "table" for o in snapshot["objects"]) if snapshot else 0,
                    "views": sum(o["kind"] == "view" for o in snapshot["objects"]) if snapshot else 0}
            if observation_id == row["id"]:
                return {**item, "snapshot": snapshot}
            items.append(item)
        if observation_id:
            # Older snapshots remain addressable beyond the 100-item recent history.
            with self.db.connect() as conn:
                row = conn.execute("SELECT * FROM source_observations WHERE tenant_id=? AND source_id=? AND id=?", (user.tenant, source_id, observation_id)).fetchone()
            if row:
                return {"id": row["id"], "sequence": row["sequence"], "sourceVersion": row["source_version"], "createdAt": row["created_at"], "status": row["status"], "snapshot": json.loads(row["snapshot"]) if row["snapshot"] else None}
            raise ApiError(404, "observation_not_found", "Observación no disponible.")
        return {"items": items}


def source_router(service):
    router = APIRouter(prefix="/api/v1/sources", tags=["Data sources"])

    @router.get("")
    def listing(user: Principal = Depends(require("sources:read"))):
        with service.db.connect() as conn:
            rows = conn.execute("SELECT * FROM sources WHERE tenant_id=? ORDER BY normalized_name LIMIT 501", (user.tenant,)).fetchall()
        if len(rows) > 500:
            raise ApiError(413, "registry_limit", "El registro supera el alcance de esta vista.")
        return {"items": [service.public(r) for r in rows]}

    @router.post("/test")
    def test(body: TestInput, request: Request, user: Principal = Depends(require("sources:write"))):
        return service.test(user, body, request.state.request_id)

    @router.post("", status_code=201)
    def create(body: SaveSource, request: Request, user: Principal = Depends(require("sources:write"))):
        return service.save(user, body, request.state.request_id)

    @router.get("/{source_id}")
    def get(source_id: str, user: Principal = Depends(require("sources:read"))):
        with service.db.connect() as conn:
            return service.public(service.find(conn, user, source_id))

    @router.put("/{source_id}/connection")
    def update(source_id: str, body: SaveSource, request: Request, if_match: str | None = Header(default=None, max_length=30), user: Principal = Depends(require("sources:write"))):
        return service.save(user, body, request.state.request_id, source_id, if_match)

    @router.post("/{source_id}/test")
    def retest(source_id: str, request: Request, user: Principal = Depends(require("sources:write"))):
        return service.run(user, source_id, request.state.request_id, False)

    @router.post("/{source_id}/observations", status_code=201)
    def observe(source_id: str, request: Request, user: Principal = Depends(require("sources:observe"))):
        return service.run(user, source_id, request.state.request_id, True)

    @router.get("/{source_id}/observations")
    def history(source_id: str, user: Principal = Depends(require("sources:read"))):
        return service.observation(user, source_id)

    @router.get("/{source_id}/observations/{observation_id}")
    def snapshot(source_id: str, observation_id: str, user: Principal = Depends(require("sources:read"))):
        return service.observation(user, source_id, observation_id)

    return router
