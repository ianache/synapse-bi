# US-005 PostgreSQL Gold Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in lab path from `POST /api/v1/queries` to one synthetic PostgreSQL Gold KPI and provide a repeatable end-to-end baseline tool without implying production readiness.

**Architecture:** Preserve SQLite as the default and dispatch only the fixed `kpi_fin_net_revenue` query to a PostgreSQL adapter when `BI_SERVING_BACKEND=postgres_gold_lab`. Resolve the fixed lab tenant to a server-configured reader credential, use parameterized read-only SQL against `gold.v_kpi_daily`, and reject this mode in production.

**Tech Stack:** Python 3.12+, FastAPI, psycopg 3.3.6 (already pinned), PostgreSQL 18.6 case study, pytest, Python standard-library HTTP/concurrency for the baseline script.

**Spec:** `docs/superpowers/specs/2026-10-18-us-005-postgres-gold-pilot-design.md`

## Global Constraints

- `BI_ENVIRONMENT=production` must reject the `postgres_gold_lab` backend.
- The backend selection defaults to the existing SQLite demo; PostgreSQL is opt-in.
- Only `kpi_fin_net_revenue` → `gold.v_kpi_daily.net_revenue` is supported in this pilot.
- Tenant comes from the authenticated principal and maps only to configured lab reader credentials; never accept tenant credentials or SQL from the request.
- `product` grouping is unsupported by the pilot view and must be rejected; API channel names `Digital`/`Tienda` are resolved by a tenant-and-key join to `gold.dim_channel`, then filter/group on `channel_name`.
- Do not use `bi_admin`; reader credentials are read-only and isolated by PostgreSQL role/RLS.
- Do not log or return passwords, DSNs, bearer tokens, request bodies, or SQL values.
- Preserve the API response contract, `dataMode: synthetic`, and quality/freshness `not_evaluated`.
- On PostgreSQL error, fail closed; never fall back to SQLite or fixtures.
- The baseline is observational only: no pass/fail threshold, SLA, production claim, or modification of Gold data.
- Do not implement Data Steward approval, generic engine abstraction, arbitrary KPI/model execution, or client-provided SQL.

## Review Focus

1. Tenant/credential mismatch or missing mapping could expose another tenant — test both reader roles and unmapped tenants.
2. SQL identifiers or filters from input could escape the fixed query — test unsupported KPI/grouping and bound date/channel parameters.
3. PostgreSQL failures could silently return demo data — test connection/timeout failure and absence of fallback.
4. Production could start with a lab reader backend — test settings validation rejects this configuration.
5. Baseline output could leak credentials or imply an SLA — test redaction and report labels/fields.

---

### Task 1: Backend selection and tenant reader configuration

**Files:**
- Modify: `codebase/backend/synapse_api/config.py`
- Test: `codebase/backend/tests/test_config.py`
- Modify: `codebase/backend/README.md`

**Interfaces:**
- `Settings.serving_backend: Literal["sqlite_demo", "postgres_gold_lab"]`, sourced from `BI_SERVING_BACKEND`, default `sqlite_demo`.
- Add `@dataclass(frozen=True) GoldReaderConfig(username: str, password_file: Path)` and `Settings.gold_readers: dict[str, GoldReaderConfig]`. Parse `BI_GOLD_READERS` as JSON mapping only `demo-global`→`bi_reader_global` and/or `demo-other`→`bi_reader_other`, each to `{"username": ..., "password_file": "..."}`; a partial map is allowed, unknown tenants or role mismatches are rejected. Common connection settings use `BI_GOLD_HOST`, `BI_GOLD_PORT`, and `BI_GOLD_DATABASE`, defaulting to `127.0.0.1:55432/bi_analytics`.
- `Settings.validate()` rejects an unknown backend, rejects `postgres_gold_lab` when `environment == "production"`, rejects malformed configured entries, and permits a partial tenant map so an unmapped tenant can fail closed at request time. It must not read or expose password contents.

- [ ] **Step 1: Write failing configuration tests** for SQLite default, unknown backend, production rejection, fixed tenant/user mapping, partial map accepted, and malformed or configured-but-missing password file rejected in lab mode.
- [ ] **Step 2: Run the focused tests and verify they fail** with missing setting/validation behavior.
- [ ] **Step 3: Implement the Settings fields and validation**; keep `BI_DATABASE_PATH`, authentication, and source-connector settings unchanged.
- [ ] **Step 4: Run the focused tests and verify they pass.**
- [ ] **Step 5: Document safe local configuration** in `codebase/backend/README.md`, refer to existing `.docker-secrets` password files without reading, copying, or printing their contents.
- [ ] **Step 6: Commit** as `feat: configure opt-in gold serving backend`.

### Task 2: Fixed PostgreSQL Gold query adapter

**Files:**
- Create: `codebase/backend/synapse_api/postgres_gold.py`
- Test: `codebase/backend/tests/test_postgres_gold.py`
- Reuse: `codebase/backend/synapse_api/config.py`, `schemas.py`

**Interfaces:**
- `fetch_net_revenue(settings: Settings, tenant_id: str, query: SemanticQuery) -> GoldQueryResult`
- `GoldQueryResult` contains `rows: list[QueryRow]` and `source_updated_at: str | None`.
- The module resolves the tenant to a fixed reader role and password file, reads the credential only at connection time, and returns generic `ApiError(503, "serving_unavailable", ...)` for unavailable/invalid connections.

- [ ] **Step 1: Write failing unit tests** for fixed KPI path, date/channel-name parameter binding, tenant-to-reader mapping, no mapping denial, channel/no-group results, unsupported `product`, and connection exception redaction.
- [ ] **Step 2: Run the new tests and verify they fail** because the adapter/interface is absent.
- [ ] **Step 3: Implement the adapter** using psycopg, a fixed statement joining `gold.v_kpi_daily` to `gold.dim_channel` on `(tenant_id, channel_key)`, inclusive `YYYYMMDD` date keys, parameterized tenant/channel name, and a read-only transaction. Never interpolate client values as identifiers or expressions.
- [ ] **Step 4: Run focused tests and verify they pass.**
- [ ] **Step 5: Commit** as `feat: add fixed PostgreSQL Gold query adapter`.

### Task 3: API serving dispatch and compatible responses

**Files:**
- Modify: `codebase/backend/synapse_api/serving.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Test: `codebase/backend/tests/test_api.py`
- Test: `codebase/backend/tests/test_serving_metadata.py`

**Interfaces:**
- Extend `execute_query(database: Database, user: Principal, body: SemanticQuery, request_id: str, settings: Settings) -> QueryResult` and choose SQLite or PostgreSQL from `settings.serving_backend` after existing KPI visibility and `queries:execute` checks.
- `create_app` passes the same validated `Settings` to the route/executor; no new public endpoint or request field.

- [ ] **Step 1: Write failing API tests** for unchanged SQLite behavior, PostgreSQL dispatch, tenant from authenticated principal (not `X-Tenant-ID`), inclusive dates, channel filter/grouping, `product` rejection, metadata compatibility, and no fallback after adapter failure.
- [ ] **Step 2: Run the focused API tests and verify the new cases fail.**
- [ ] **Step 3: Implement dispatch and result construction** while preserving current authorization ordering, response model, `dataMode`, confidence metadata, audit event, and request ID handling.
- [ ] **Step 4: Run focused API and metadata tests; verify existing SQLite tests remain unchanged and the new dispatch tests pass.**
- [ ] **Step 5: Commit** as `feat: route lab KPI queries to PostgreSQL Gold`.

### Task 4: Opt-in PostgreSQL integration and tenant isolation tests

**Files:**
- Create: `codebase/backend/tests/test_postgres_gold_integration.py`
- Modify: `codebase/backend/README.md`
- Reuse: `codebase/case-study/docker-compose.yml`, `init/00-roles.sh`, `init/30-gold-views.sql`

**Interfaces:**
- Integration suite is skipped unless `BI_TEST_POSTGRES_GOLD=1`; it uses the same reader-only configuration as the API and never accepts an admin DSN.
- The integration fixture makes real HTTP requests through `TestClient` to `/api/v1/queries` with authenticated development test principals and the real local PostgreSQL case study.

- [ ] **Step 1: Write opt-in integration tests** for known `demo-global` and `demo-other` distinct totals, tenant mismatch denial, no write privilege, security-invoker/RLS behavior through the reader, empty date range, and database unavailable behavior.
- [ ] **Step 2: Verify the suite is skipped by default** and fails clearly when opted in without required safe reader configuration.
- [ ] **Step 3: Implement only test fixtures/configuration needed**; do not alter initialization SQL, Gold tables/views, secrets, or case-study credentials.
- [ ] **Step 4: Document the explicit opt-in command and expected safeguards.** Tests are not run as part of this plan unless separately requested; no PostgreSQL restart or data reset.
- [ ] **Step 5: Commit** as `test: cover PostgreSQL Gold serving isolation`.

### Task 5: Repeatable end-to-end baseline tool

**Files:**
- Create: `codebase/backend/scripts/measure_query_baseline.py`
- Test: `codebase/backend/tests/test_query_baseline.py`
- Modify: `codebase/backend/README.md`
- Modify: `docs/ux/us-005/verification.md`

**Interfaces:**
- CLI accepts API base URL, KPI/date/channel request, bearer token from environment, warmup count, sample count, and concurrency; token is never accepted as a command-line argument.
- Each measured request calls the actual `POST /api/v1/queries` endpoint. Output includes latency p50/p95, throughput, errors, timestamp, commit/version, tenant label, and run parameters; output excludes token, password, DSN, response payload, and SQL.
- Exit status indicates tool/transport failure only, not performance threshold failure.

- [ ] **Step 1: Write failing tests** for percentile/throughput calculations, warmup exclusion, serial/concurrent calls, HTTP error accounting, secret redaction, and explicit “synthetic lab baseline — no SLA” report labeling.
- [ ] **Step 2: Run the focused tests and verify they fail** before implementation.
- [ ] **Step 3: Implement the CLI and metrics** with Python standard library HTTP and concurrency; require the bearer token from an environment variable and never print it.
- [ ] **Step 4: Run unit tests** using a local fake HTTP server; do not call production or live PostgreSQL in these tests.
- [ ] **Step 5: Document manual baseline procedure and interpretation** in the backend README and US-005 verification guide, stating the fixture size and lab-only limitation.
- [ ] **Step 6: Commit** as `feat: measure synthetic serving baseline`.

### Task 6: Contract, security, and handoff verification

**Files:**
- Modify: `knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md`
- Modify: `knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md`
- Modify: `knowledge-base/changelog.md`
- Modify: `knowledge-base/index.md`

- [ ] **Step 1: Update API-001** with opt-in lab mode, fixed mapping, error/fallback behavior, and tenant reader boundary; keep contract `REQUIRES_REVIEW` unless a human changes its gate.
- [ ] **Step 2: Update US-005 evidence** to distinguish implementation evidence from manual/human acceptance, keep `US-005-Q2` open for production and `US-005` `CONDITIONAL`.
- [ ] **Step 3: Record the increment** in changelog and index; do not alter ADR/ASR statuses or claim production readiness.
- [ ] **Step 4: Run final verification** after a separate user request to execute tests: backend unit suite, opt-in PostgreSQL suite only with the explicit lab authorization/configuration, baseline script unit tests, `git diff --check`, and an independent security/code review.
- [ ] **Step 5: Commit** documentation and verification evidence as `docs: record US-005 PostgreSQL lab pilot`.

## Execution Notes

- Implementation should start in an isolated worktree because `master` contains unrelated and user-owned dirty files. Create that worktree only after the plan is approved and the user selects an execution method.
- This plan creates no schema migration and changes no Gold data.
- No commands in the plan may display secret file contents or restart/reset PostgreSQL.
- The opt-in integration tests and actual baseline require a running lab PostgreSQL service and user-approved execution; they must not run implicitly.
