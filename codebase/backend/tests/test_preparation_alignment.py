from types import SimpleNamespace

from synapse_api.auth import Principal
from synapse_api.preparation.schemas import PreparationRunCreate
from synapse_api.preparation.service import PreparationService


USER = Principal("de", "tenant-a", "DE", frozenset({"datasets:read", "datasets:write", "sources:read"}))


def test_manual_retry_for_poll_is_bounded_by_failed_capture_range(monkeypatch):
    service = PreparationService.__new__(PreparationService)
    failed = SimpleNamespace(status="technical_failure", origin="poll", pipeline_id="pipe-a", source_range_end=845)
    monkeypatch.setattr(service, "get_run", lambda *_: failed)
    captured = {}

    def poll_pipeline(*args, **kwargs):
        captured.update(kwargs)
        return "retried"

    monkeypatch.setattr(service, "poll_pipeline", poll_pipeline)

    assert service.retry_run(USER, "run-failed", "request-retry") == "retried"
    assert captured == {"retry_of": "run-failed", "through_capture": 845}


def test_manual_and_poll_share_tenant_pipeline_advisory_lock(monkeypatch):
    service = PreparationService.__new__(PreparationService)
    service.settings = object()
    pipeline = SimpleNamespace(id="pipe-a")
    source = object()
    calls = []

    class Connection:
        def __enter__(self):
            return self
        def __exit__(self, *_):
            return False
        def execute(self, query, params):
            calls.append((query, params))

    service.writer = lambda *_: Connection()
    with service._pipeline_lock(USER, pipeline, source):
        calls.append(("inside", None))

    assert calls[0][0] == "SELECT pg_advisory_lock(hashtextextended(%s,0))"
    assert calls[0][1] == ("tenant-a:pipe-a",)
    assert calls[1][0] == "inside"
    assert calls[2][0] == "SELECT pg_advisory_unlock(hashtextextended(%s,0))"


def test_manual_event_batch_limit_is_500():
    event = {"sourceEventId": "event", "businessKey": 1, "operation": "delete",
             "eventTimestamp": "2026-11-14T00:00:00Z"}
    PreparationRunCreate(pipelineId="pipeline", events=[event] * 500)

    try:
        PreparationRunCreate(pipelineId="pipeline", events=[event] * 501)
    except ValueError:
        return
    raise AssertionError("501 events should exceed the API batch limit")


def test_run_pagination_fetches_only_offset_plus_limit_per_pipeline(monkeypatch):
    service = PreparationService.__new__(PreparationService)
    pipeline = SimpleNamespace(id="pipe-a")
    captured_limits = []

    class Connection:
        def __enter__(self):
            return self
        def __exit__(self, *_):
            return False
        def execute(self, query, params=()):
            if "count(*)" in query:
                return SimpleNamespace(fetchone=lambda: {"total": 1000})
            if "SELECT * FROM prepared.preparation_runs" in query:
                captured_limits.append(params[-1])
                rows = [{"started_at": 100 - index, "run_id": f"run-{index}"} for index in range(params[-1])]
                return SimpleNamespace(fetchall=lambda: rows)
            return SimpleNamespace(fetchone=lambda: {})

    monkeypatch.setattr("synapse_api.preparation.service.PreparationRepository",
                        lambda *_: SimpleNamespace(list=lambda: [pipeline]))
    service.db = SimpleNamespace(connect=lambda: Connection())
    service.settings = object()
    service._context = lambda *_: (pipeline, object(), object())
    service.writer = lambda *_: Connection()
    service._run_from_row = lambda _connection, row, _pipeline: row["run_id"]

    page = service.list_runs(USER, limit=5, offset=10)

    assert captured_limits == [15]
    assert page["total"] == 1000
    assert page["items"] == [f"run-{index}" for index in range(10, 15)]
