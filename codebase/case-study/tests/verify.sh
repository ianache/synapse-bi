#!/usr/bin/env bash
set -euo pipefail

export PGUSER=bi_admin
export PGPASSWORD="$(cat /run/secrets/admin_password)"
psql -X --set ON_ERROR_STOP=1 --file /study/admin-checks.sql

export PGUSER=bi_reader_global
export PGPASSWORD="$(cat /run/secrets/reader_global_password)"
psql -X --set ON_ERROR_STOP=1 --set tenant=demo-global --set other_role=bi_reader_other --file /study/reader-checks.sql

export PGUSER=bi_reader_other
export PGPASSWORD="$(cat /run/secrets/reader_other_password)"
psql -X --set ON_ERROR_STOP=1 --set tenant=demo-other --set other_role=bi_reader_global --file /study/reader-checks.sql
printf 'PASS: model, reconciliation, grants and both tenant logins verified.\n'
