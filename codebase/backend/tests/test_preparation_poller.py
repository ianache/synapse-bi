from types import SimpleNamespace

import pytest

from synapse_api.config import Settings
from synapse_api.preparation.poller import poll_enabled


def test_polling_configuration_is_rejected_in_production(tmp_path):
    settings = Settings(database_path=tmp_path / "db.sqlite", environment="production", auth_mode="oidc",
                        issuer="https://issuer.example", public_key="key", preparation_polling_enabled=True)
    with pytest.raises(ValueError, match="laboratory-only"):
        settings.validate()


def test_poller_delegates_pause_check_and_serialization_to_service():
    class SqliteConnection:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            return False
        def execute(self, *_):
            return self
        def fetchall(self):
            return [{"tenant_id": "tenant-a", "id": "pipe-a"}]

    service = SimpleNamespace(db=SimpleNamespace(connect=lambda: SqliteConnection()), calls=[],
                              poll_pipeline=lambda *args, **kwargs: service.calls.append(args))

    poll_enabled(service)

    assert len(service.calls) == 1
    assert service.calls[0][1] == "pipe-a"
