from dataclasses import replace
import time

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from fastapi.testclient import TestClient
import jwt
import pytest

from synapse_api.app import create_app


@pytest.fixture
def identity(settings):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public = key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    app = create_app(replace(settings, auth_mode="oidc", issuer="https://identity.example/realms/bi", public_key=public))
    claims = {"sub": "ana", "tenant_id": "demo-global", "name": "Ana Rivas", "scope": "catalog:read", "iss": "https://identity.example/realms/bi", "aud": "synapse-bi-api", "iat": int(time.time()), "exp": int(time.time()) + 300}
    with TestClient(app, client=("127.0.0.1", 50001)) as client:
        yield client, key, claims


def test_oidc_validates_signed_identity(identity):
    client, key, claims = identity
    token = jwt.encode(claims, key, algorithm="RS256")
    assert client.get("/api/v1/kpis", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    assert client.post("/api/v1/auth/dev-session", json={}).status_code == 404


@pytest.mark.parametrize("overrides", [{"iss": "https://wrong.example"}, {"aud": "wrong-api"}, {"exp": 1}, {"tenant_id": ""}, {"scope": ["catalog:read"]}])
def test_oidc_rejects_invalid_claims(identity, overrides):
    client, key, claims = identity
    token = jwt.encode({**claims, **overrides}, key, algorithm="RS256")
    assert client.get("/api/v1/kpis", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_oidc_rejects_unsigned_tokens_and_missing_tenant(identity):
    client, key, claims = identity
    for token in [jwt.encode(claims, "", algorithm="none"), jwt.encode({k: v for k, v in claims.items() if k != "tenant_id"}, key, algorithm="RS256")]:
        assert client.get("/api/v1/kpis", headers={"Authorization": f"Bearer {token}"}).status_code == 401
