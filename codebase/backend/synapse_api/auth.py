from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt

from .config import Settings
from .errors import ApiError

bearer = HTTPBearer(auto_error=False)
ALL_SCOPES = frozenset({"catalog:read", "queries:execute", "dashboards:read", "dashboards:write"})
SOURCE_SCOPES = frozenset({"sources:read", "sources:write", "sources:observe"})
DATASET_SCOPES = frozenset({"datasets:read", "datasets:write"})
SEMANTIC_SCOPES = frozenset({"semantic:read", "semantic:write"})
MODEL_SCOPES = frozenset({"models:read", "models:write"})


@dataclass(frozen=True)
class Principal:
    subject: str
    tenant: str
    name: str
    scopes: frozenset[str]


class Authenticator:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.dev_secret = secrets.token_bytes(48)
        self.jwks = jwt.PyJWKClient(settings.jwks_url, timeout=5) if settings.jwks_url else None

    def development_token(self, persona: str) -> str:
        identities = {
            "data-admin": ("admin", "demo-global", "Administrador de datos", ALL_SCOPES | SOURCE_SCOPES | DATASET_SCOPES | SEMANTIC_SCOPES | MODEL_SCOPES),
            "other-data-admin": ("other-admin", "demo-other", "Administrador de otro tenant", ALL_SCOPES | SOURCE_SCOPES | DATASET_SCOPES | SEMANTIC_SCOPES | MODEL_SCOPES),
            "analyst": ("ana", "demo-global", "Ana Rivas", ALL_SCOPES),
            "viewer": ("viewer", "demo-global", "Lector de ejemplo", ALL_SCOPES - {"dashboards:write"}),
            "other-tenant": ("otro", "demo-other", "Analista de otro tenant", ALL_SCOPES),
        }
        subject, tenant, name, scopes = identities[persona]
        now = datetime.now(timezone.utc)
        return jwt.encode({"sub": subject, "tenant_id": tenant, "name": name, "scope": " ".join(sorted(scopes)), "iss": "synapse-development", "aud": self.settings.audience, "iat": now, "exp": now + timedelta(hours=1)}, self.dev_secret, algorithm="HS256")

    def verify(self, token: str) -> Principal:
        try:
            if self.settings.auth_mode == "development":
                key, algorithms, issuer = self.dev_secret, ["HS256"], "synapse-development"
            else:
                key = self.settings.public_key or self.jwks.get_signing_key_from_jwt(token).key
                algorithms, issuer = ["RS256"], self.settings.issuer
            claims = jwt.decode(token, key, algorithms=algorithms, issuer=issuer, audience=self.settings.audience, options={"require": ["exp", "iat", "sub", "iss", "aud", "tenant_id"]})
            subject, tenant, scope = claims["sub"], claims["tenant_id"], claims.get("scope", "")
            if not isinstance(subject, str) or not subject.strip() or len(subject) > 200 or not isinstance(tenant, str) or not tenant.strip() or len(tenant) > 100 or not isinstance(scope, str):
                raise ValueError("Invalid identity claims")
            name = claims.get("name", subject)
            return Principal(subject, tenant, name if isinstance(name, str) else subject, frozenset(scope.split()))
        except jwt.PyJWKClientConnectionError:
            raise ApiError(503, "identity_unavailable", "El proveedor de identidad no está disponible.") from None
        except (jwt.PyJWTError, ValueError, TypeError, KeyError):
            raise ApiError(401, "invalid_token", "El token no es válido o ha vencido.") from None


def principal(request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Principal:
    if credentials is None:
        raise ApiError(401, "authentication_required", "Se requiere autenticación.")
    return request.app.state.auth.verify(credentials.credentials)


def require(scope: str):
    def dependency(user: Principal = Depends(principal)):
        if scope not in user.scopes:
            raise ApiError(403, "permission_denied", "No tienes permiso para realizar esta operación.")
        return user
    return dependency
