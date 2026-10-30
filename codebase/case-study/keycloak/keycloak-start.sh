#!/usr/bin/env bash
set -euo pipefail
export KCRAW_DB_PASSWORD="$(cat /run/secrets/keycloak_db_password)"
export KC_BOOTSTRAP_ADMIN_PASSWORD="$(cat /run/secrets/keycloak_admin_password)"
test -n "$KCRAW_DB_PASSWORD" && test -n "$KC_BOOTSTRAP_ADMIN_PASSWORD"
exec /opt/keycloak/bin/kc.sh start-dev
