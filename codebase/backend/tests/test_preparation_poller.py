from types import SimpleNamespace

import pytest

from synapse_api.config import Settings
from synapse_api.preparation.poller import poll_enabled


def test_polling_configuration_is_rejected_in_production(tmp_path):
    settings = Settings(database_path=tmp_path / "db.sqlite", environment="production", auth_mode="oidc",
                        issuer="https://issuer.example", public_key="key", preparation_polling_enabled=True)
    with pytest.raises(ValueError, match="laboratory-only"):
        settings.validate()


def test_poller_does_not_automatically_retry_a_failed_range(monkeypatch):
    class Cursor:
        def fetchone(self):
            return {"status": "technical_failure"}

    class PgConnection:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            return False
        def execute(self, query, params=()):
            assert "latest" not in query.lower()
            return Cursor()

    class SqliteConnection:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            return False
        def execute(self, *_):
            return self
        def fetchall(self):
            return [{"tenant_id": "tenant-a", "id": "pipe-a"}]

    service = SimpleNamespace(
        db=SimpleNamespace(connect=lambda: SqliteConnection()), settings=object(), calls=[],
        _context=lambda user, pipeline_id: (SimpleNamespace(id=pipeline_id), object(), object()),
        poll_pipeline=lambda *args, **kwargs: service.calls.append(args),
    )
    monkeypatch.setattr("synapse_api.preparation.poller.connect_prepared_writer", lambda *args: PgConnection())

    poll_enabled(service)

    assert service.calls == []
