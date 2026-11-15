"""Opt-in lab scheduler; the shared service lock serializes each pipeline."""
import asyncio
import logging
import uuid

from ..auth import Principal
from ..errors import ApiError

logger = logging.getLogger("synapse_api.preparation.poller")
POLL_SCOPES = frozenset({"datasets:read", "datasets:write", "sources:read"})


def poll_enabled(service):
    with service.db.connect() as connection:
        rows = connection.execute("SELECT tenant_id,id FROM preparation_pipelines WHERE enabled=1 ORDER BY tenant_id,id").fetchall()
    for row in rows:
        user = Principal("preparation-poller", row["tenant_id"], "Preparation poller", POLL_SCOPES)
        try:
            # Pause evaluation happens under the same advisory lock as manual/poll runs.
            service.poll_pipeline(user, row["id"], str(uuid.uuid4()))
        except Exception as error:
            # Do not expose exception strings, source payloads, or connection details.
            logger.error("preparation_poller_pipeline_failed tenant=%s pipeline=%s error_type=%s sqlstate=%s",
                         row["tenant_id"], row["id"], type(error).__name__, getattr(error, "sqlstate", None))


async def poller_loop(service):
    while True:
        await asyncio.to_thread(poll_enabled, service)
        await asyncio.sleep(60)
