#!/usr/bin/env bash
set -euo pipefail

export PGPASSWORD="$(cat /run/secrets/admin_password)"
export KEYCLOAK_DB_PASSWORD="$(cat /run/secrets/keycloak_db_password)"
test -n "$PGPASSWORD" && test -n "$KEYCLOAK_DB_PASSWORD"

psql -X --set ON_ERROR_STOP=1 --quiet <<'SQL'
\getenv db_password KEYCLOAK_DB_PASSWORD
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('synapse-keycloak-schema-init'));
SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD %L', 'keycloak', :'db_password')
 WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'keycloak') \gexec
SELECT format('CREATE SCHEMA %I AUTHORIZATION %I', 'keycloak', 'keycloak')
 WHERE NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'keycloak') \gexec
DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='keycloak' AND rolcanlogin
                  AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls AND NOT rolinherit)
     OR NOT EXISTS (SELECT 1 FROM pg_namespace n JOIN pg_roles r ON r.oid=n.nspowner
                    WHERE n.nspname='keycloak' AND r.rolname='keycloak')
     OR EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
                WHERE r.rolname='keycloak') THEN
    RAISE EXCEPTION 'Existing keycloak role or schema has incompatible ownership or privileges';
  END IF;
END
$body$;
GRANT CONNECT ON DATABASE bi_analytics TO keycloak;
COMMIT;
SQL

# Existing roles are never reset; fail if their password differs from the local secret.
export PGUSER=keycloak
export PGPASSWORD="$KEYCLOAK_DB_PASSWORD"
unset KEYCLOAK_DB_PASSWORD
psql -X --set ON_ERROR_STOP=1 --quiet --tuples-only --no-align -c 'SELECT 1' >/dev/null
echo 'Keycloak schema and role are ready.'
