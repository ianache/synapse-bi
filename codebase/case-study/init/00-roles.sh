#!/usr/bin/env bash
(
set -euo pipefail

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 \
  --set db_name="$POSTGRES_DB" \
  --set global_password="$(cat /run/secrets/reader_global_password)" \
  --set other_password="$(cat /run/secrets/reader_other_password)" <<'SQL'
CREATE ROLE bi_reader_global LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD :'global_password';
CREATE ROLE bi_reader_other LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD :'other_password';
REVOKE ALL ON DATABASE :"db_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO bi_reader_global, bi_reader_other;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
ALTER ROLE bi_reader_global SET default_transaction_read_only = on;
ALTER ROLE bi_reader_other SET default_transaction_read_only = on;
ALTER ROLE bi_reader_global SET statement_timeout = '5s';
ALTER ROLE bi_reader_other SET statement_timeout = '5s';
ALTER ROLE bi_reader_global SET search_path = pg_catalog, gold;
ALTER ROLE bi_reader_other SET search_path = pg_catalog, gold;
SQL
)
