"""Opt-in lab scheduler; PostgreSQL advisory locks serialize poller ticks."""
import asyncio
import logging
import uuid

from ..auth import Principal
from ..errors import ApiError
from ..source_connector import connect_prepared_writer
from .repository import PreparationRepository

logger = logging.getLogger("synapse_api.preparation.poller")
POLL_SCOPES = frozenset({"datasets:read", "datasets:write", "sources:read"})


def poll_enabled(service):
    with service.db.connect() as connection:
        rows = connection.execute("SELECT tenant_id,id FROM preparation_pipelines WHERE enabled=1 ORDER BY tenant_id,id").fetchall()
    for row in rows:
        user = Principal("preparation-poller", row["tenant_id"], "Preparation poller", POLL_SCOPES)
        try:
            pipeline, source_config, _ = service._context(user, row["id"])
            with connect_prepared_writer(service.settings, source_config) as connection:
                connection.execute("SELECT set_config('app.tenant_id',%s,true)", (user.tenant,))
                latest_poll = connection.execute("SELECT status FROM prepared.preparation_runs WHERE tenant_id=%s AND pipeline_id=%s AND origin='poll' ORDER BY started_at DESC LIMIT 1",
                                                 (user.tenant, pipeline.id)).fetchone()
                if latest_poll and latest_poll["status"] in {"quality_rejected", "technical_failure"}:
                    # A held range is retried only by an explicit linked API call.
                    continue
            lock_key = f"{user.tenant}:{pipeline.id}"
            with connect_prepared_writer(service.settings, source_config) as connection:
                acquired = connection.execute("SELECT pg_try_advisory_lock(hashtextextended(%s,0)) AS locked", (lock_key,)).fetchone()["locked"]
                if not acquired:
                    continue
                try:
                    service.poll_pipeline(user, pipeline.id, str(uuid.uuid4()))
                finally:
                    connection.execute("SELECT pg_advisory_unlock(hashtextextended(%s,0))", (lock_key,))
        except Exception as error:
            # Do not expose exception strings, source payloads, or connection details.
            logger.error("preparation_poller_pipeline_failed tenant=%s pipeline=%s error_type=%s sqlstate=%s",
                         row["tenant_id"], row["id"], type(error).__name__, getattr(error, "sqlstate", None))


async def poller_loop(service):
    while True:
        await asyncio.to_thread(poll_enabled, service)
        await asyncio.sleep(60)
