from dataclasses import dataclass, field
import os
import json
from ipaddress import ip_address
import re
from pathlib import Path
from urllib.parse import urlparse


@dataclass(frozen=True)
class Settings:
    database_path: Path = Path("data/synapse.db")
    environment: str = "production"
    auth_mode: str = "oidc"
    seed_demo: bool = False
    issuer: str = ""
    audience: str = "synapse-bi-api"
    jwks_url: str = ""
    # Public key for offline verification, otherwise a configured JWKS endpoint.
    public_key: str = ""
    source_targets: tuple = ()
    source_key_file: str = ""
    source_ca_file: str = ""
    allowed_origins: tuple[str, ...] = field(default_factory=lambda: (
        "http://127.0.0.1:5173", "http://localhost:5173",
        "http://127.0.0.1:4173", "http://localhost:4173",
    ))

    @classmethod
    def from_env(cls):
        return cls(
            database_path=Path(os.getenv("BI_DATABASE_PATH", "data/synapse.db")),
            environment=os.getenv("BI_ENVIRONMENT", "production"),
            auth_mode=os.getenv("BI_AUTH_MODE", "oidc"),
            seed_demo=os.getenv("BI_SEED_DEMO", "false").lower() == "true",
            source_targets=tuple(json.loads(os.getenv("BI_SOURCE_TARGETS", "[]"))),
            source_key_file=os.getenv("BI_SOURCE_KEY_FILE", ""),
            source_ca_file=os.getenv("BI_SOURCE_CA_FILE", ""),
            issuer=os.getenv("BI_OIDC_ISSUER", ""),
            audience=os.getenv("BI_OIDC_AUDIENCE", "synapse-bi-api"),
            jwks_url=os.getenv("BI_OIDC_JWKS_URL", ""),
            public_key=os.getenv("BI_OIDC_PUBLIC_KEY", "").replace('\\n', '\n'),
            allowed_origins=tuple(x.strip() for x in os.getenv("BI_ALLOWED_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173").split(",") if x.strip()),
        )

    def validate(self):
        if len(self.source_targets) > 64:
            raise ValueError("At most 64 explicit source destinations are permitted")
        for target in self.source_targets:
            if not isinstance(target, dict) or set(target) != {"host", "port", "address"}:
                raise ValueError("Source targets require host, port and pinned address")
            if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9.:-]{0,252}", target["host"]) or type(target["port"]) is not int or not 1 <= target["port"] <= 65535:
                raise ValueError("Invalid source destination")
            ip_address(target["address"])
        if self.environment not in {"development", "test", "production"}:
            raise ValueError("Unknown BI_ENVIRONMENT")
        if self.auth_mode not in {"development", "oidc"}:
            raise ValueError("Unknown BI_AUTH_MODE")
        if self.auth_mode == "development" and self.environment not in {"development", "test"}:
            raise ValueError("Development authentication is forbidden in production")
        if self.seed_demo and self.environment == "production":
            raise ValueError("Demo seeding is forbidden in production")
        if self.auth_mode == "oidc" and (not self.issuer or not self.audience or not (self.public_key or self.jwks_url)):
            raise ValueError("OIDC issuer, audience and a public key or JWKS URL are required")
        if self.jwks_url and urlparse(self.jwks_url).scheme != "https":
            raise ValueError("JWKS must use HTTPS")
        for origin in self.allowed_origins:
            parsed = urlparse(origin)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment:
                raise ValueError("Explicit HTTP(S) origins are required")
