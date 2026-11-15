# US-007 Backend CDC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize tenant-scoped, immutable prepared sales dataset versions from manual or one-minute PostgreSQL CDC ingestion, preserving complete history, current state, run evidence, catalog visibility, and lineage.

**Architecture:** PostgreSQL is the sole persistence authority for US-007 pipelines, runs, checkpoints, versions, lineage, and prepared catalog records. Existing source and input-dataset records remain in SQLite; pipeline creation reads them to validate references and snapshot metadata. Existing dataset catalog GET routes combine SQLite entries with PostgreSQL prepared entries; they never copy prepared records into SQLite.

**Tech Stack:** Python, FastAPI, Pydantic, SQLite read-only lookups for registered inputs, PostgreSQL 18, psycopg, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-11-02-us-007-backend-cdc-design.md`

## Global Constraints

- Keep the UI out of this increment; no frontend routes, React pages, or visual assets change.
- Keep CDC history, prepared versions, execution records, and sanitized failure evidence without expiry in this lab.
- Do not modify `gold` sales facts; source credentials are read-only and prepared writer credentials are separate and tenant-fixed.
- Persist all US-007 state and publication in PostgreSQL only. Do not write a publication/catalog mirror to SQLite.
- Tenant is derived from the authenticated principal; deny unresolved tenant and cross-tenant access.
- Do not accept SQL, tenant IDs, database identifiers, role names, schema names, or relation names from API input.
- Do not include raw payloads, secrets, or personal data in error messages, logs, or consumer responses.
- Commit run outcome, version, lineage, latest-version pointer, and successful poll checkpoint atomically in PostgreSQL.
- On poll failure, pause the pipeline durably; scheduled ticks skip it until a manual retry succeeds.
- Use `sources:write` for source administration, `datasets:write` plus `sources:read` for pipeline writes, and `datasets:read` for consumer reads.
- Existing SQLite dataset records remain unchanged. Combined catalog reads fail closed if either backing store is unavailable.

## Review Focus

- Source position and fallback timestamps are not comparable values: require one ordering mode per batch and quality-reject mixed-presence batches; preserve equal-timestamp events in timestamp mode and mark their order ambiguous.
- Invalid operation, absent business key/required fields, duplicate source event ID, or malformed after-image rejects publication while retaining the previous version.
- Failure during version publication leaves neither a partial version nor an advanced checkpoint/latest-version pointer.
- Tenant mismatch or absent tenant context across manual submission, polling, retry, catalog, history, and current-state reads is denied by API predicates and PostgreSQL RLS.
- Empty polls create no run/version; failed ranges pause and are not retried by later scheduled ticks.
- Failure to read PostgreSQL prepared catalog data returns an error, never a successful partial page from SQLite alone.

---

### Task 1: PostgreSQL CDC source and prepared schema

**Files:**
- Create: `codebase/case-study/init/40-cdc-prepared-schema.sql`
- Modify: `codebase/case-study/init/00-roles.sh`
- Modify: `codebase/case-study/prepare.py`
- Modify: `codebase/case-study/docker-compose.yml`
- Modify: `codebase/case-study/tests/verify.sh`
- Create: `codebase/case-study/tests/cdc-prepared.sql`

**Interfaces:**
- Source relation: `gold.cdc_sales_events(capture_id, tenant_id, source_event_id, business_key, operation, event_at, source_position, after_image)`.
- Prepared relations: `pipelines`, `runs`, `versions`, `version_events`, `current_state`, `lineage`, and `catalog_datasets` in schema `prepared`.
- Tenant-fixed lab roles: source readers remain read-only; separate prepared readers have SELECT only; separate prepared writers can write only their tenant's `prepared` rows and cannot write `gold`.
- Test fixture: deterministic insert/update/delete events for both seeded tenants and distinct prepared reader/writer secret files created without printing or overwriting existing secrets.

- [ ] Implement versioned DDL with forced RLS, tenant-safe keys/FKs, append-only event/version/lineage guards, indexes, and grants. Assert prepared writers cannot mutate `gold` or read/write another tenant.
- [ ] Seed deterministic CDC rows from the synthetic sales case without changing `gold.fact_sales`; use generated `capture_id` only as a polling cursor, not event order.
- [ ] Wire initialization after the Gold seed and update `verify.sh` to check both tenant roles, writer isolation, reader SELECT-only access, event shape, RLS, and unchanged Gold counts.
- [ ] Run the case-study verification against a fresh local database and record exact output before completing this task.

### Task 2: PostgreSQL repositories, tenant credentials, and pipeline configuration

**Files:**
- Create: `codebase/backend/synapse_api/preparation/__init__.py`
- Create: `codebase/backend/synapse_api/preparation/database.py`
- Create: `codebase/backend/synapse_api/preparation/repository.py`
- Create: `codebase/backend/synapse_api/preparation/service.py`
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Create: `codebase/backend/tests/test_preparation_repository.py`

**Interfaces:**
- `PreparedDatabase` opens a PostgreSQL connection using an explicitly configured tenant-to-reader/writer role and secret-file mapping; it does not accept connection settings from request bodies.
- Pipeline configuration is stored in PostgreSQL and binds tenant, registered source ID, input dataset ID, process reference, system-generated prepared dataset ID, polling enabled/paused state, and timestamps.
- `PreparationService.create_pipeline(user, body, request_id)` validates tenant-owned source and input dataset using existing SQLite services, snapshots declared governance metadata, then writes pipeline plus prepared catalog record in one PostgreSQL transaction.
- No SQLite migration is added for US-007.

- [ ] Add lab-only configuration for prepared reader/writer roles and secret-file mapping; validate that production refuses lab-only poller/writer settings and that secrets never enter logs or API responses.
- [ ] Add repository operations for create/get/list pipeline, duplicate-binding rejection, catalog record lookup, and latest-version pointer update.
- [ ] Test configuration validation, tenant mapping, missing/malformed secret files, no cross-tenant role selection, source/dataset lookup failures, and atomic pipeline/catalog creation.
- [ ] Test the new repository against PostgreSQL and the existing SQLite version-6 fixture; confirm SQLite schema and rows are unchanged.

### Task 3: CDC contract, validation, and materialization

**Files:**
- Create: `codebase/backend/synapse_api/preparation/schemas.py`
- Create: `codebase/backend/synapse_api/preparation/processor.py`
- Modify: `codebase/backend/synapse_api/preparation/service.py`
- Create: `codebase/backend/tests/test_preparation_processor.py`

**Interfaces:**
- `CdcEvent`: strict event ID, business key, operation (`insert|update|delete`), timezone-aware event timestamp, optional source position, and operation-specific after-image.
- `process_batch(tenant_id, pipeline_id, events, origin, actor, request_id, source_range=None, retry_of=None)` persists a `Recibida` run, transitions it to `Procesando`, and returns a sanitized execution DTO with status, operation/rejection counts, quality results, published version, and last successful version.
- Poll-origin source range and checkpoint are capture IDs; event ordering is by source position when present, else event timestamp. Every event in a batch must use the same mode. Mixed-position batches are quality-rejected. Equal fallback timestamps are retained and marked ambiguous.

- [ ] Add failing unit tests for required fields, supported operations, insert/update full after-image, delete key-only behavior, duplicate event IDs, and ambiguous timestamp ties; then implement validation with no raw values in raised errors.
- [ ] Add a failing test proving a batch mixing positioned and unpositioned events is rejected before materialization; then implement the homogeneous ordering-mode gate.
- [ ] Add tests proving insert/update update current state, delete removes the current row but remains in immutable history, and equivalent manual/poll batches produce equivalent output.
- [ ] Add transaction tests proving successful version, run outcome, lineage, latest-version pointer, and poll checkpoint commit together; injected failure leaves the previous latest version/checkpoint untouched.
- [ ] Persist sanitized technical failure evidence and quality rejection counts in PostgreSQL. Keep raw event payload out of evidence text and logs; preserve only contract-approved history for successful events.

### Task 4: Pipeline, run, and retry APIs

**Files:**
- Create: `codebase/backend/synapse_api/preparation/router.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Create: `codebase/backend/synapse_api/preparation/body_limit.py`
- Create: `codebase/backend/tests/test_preparation_api.py`

**Interfaces:**
- `POST/GET /api/v1/preparation-pipelines` creates/lists tenant-owned pipelines.
- `POST /api/v1/preparation-runs` submits a manual batch; `GET /api/v1/preparation-runs` and `GET /api/v1/preparation-runs/{runId}` list/detail runs.
- `POST /api/v1/preparation-runs/{runId}/retry` creates a new linked manual attempt; manual-origin retries resubmit the batch, poll-origin retries read the held capture range.
- Pipeline/manual/retry writes require `datasets:write` and `sources:read`; pipeline source administration continues to use `sources:write`; run and output reads require `datasets:read`.
- Request-body cap is 1 MiB and a batch contains at most 500 events. Response collections use stable bounded pagination.

- [ ] Add strict Pydantic request/response schemas and routes. Derive tenant and actor from `Principal`; reject client-supplied tenant, role, source SQL, schema, or relation identifiers.
- [ ] Return technical error code/message and counts only to authorized Data Engineering; consumer responses expose status and publication outcome without failure evidence or event payloads.
- [ ] Test all required/forbidden scopes, missing tenant, cross-tenant IDs, quality rejection, successful run, linked retry, idempotent retry protection, pagination, and body/event-count limits.
- [ ] Verify stored source credentials are resolved through `SourceService`; source polling uses the allowlisted address and fixed parameterized CDC query with the source reader only.

### Task 5: Existing dataset-catalog read projection

**Files:**
- Modify: `codebase/backend/synapse_api/datasets/schemas.py`
- Modify: `codebase/backend/synapse_api/datasets/service.py`
- Modify: `codebase/backend/synapse_api/datasets/repository.py`
- Modify: `codebase/backend/synapse_api/preparation/repository.py`
- Modify: `codebase/backend/tests/test_datasets_api.py`
- Create: `codebase/backend/tests/test_prepared_catalog_projection.py`

**Interfaces:**
- Add optional `materialization` to dataset summary/detail for PostgreSQL-backed prepared datasets: schema, relation, latest published version ID, and publication timestamp; existing SQLite-backed response fields remain unchanged.
- `GET /api/v1/datasets` combines SQLite and PostgreSQL candidates, then applies the existing query/kind/registration/completeness filters, stable `updatedAt DESC, id ASC` ordering, total count, and page slice over the combined set.
- `GET /api/v1/datasets/{id}` resolves the tenant-scoped SQLite record first, then PostgreSQL prepared catalog record; both use the existing generic not-found behavior.
- Prepared catalog metadata snapshots the source dataset's declared governance fields and never populates missing values. The generated catalog record is visible as `draft` until its governance metadata qualifies under existing registration rules; publication status remains separate in `materialization`.

- [ ] Add tests for a mixed SQLite/PostgreSQL catalog page, every existing filter, stable tie ordering, correct total/offset/limit, detail lookup, metadata incompleteness, and tenant isolation.
- [ ] Add a test proving a PostgreSQL read failure returns a service error rather than a partial SQLite-only success.
- [ ] Run all existing dataset API tests and verify direct/registered dataset behavior and response contracts remain unchanged apart from the optional additive `materialization` field.

### Task 6: Opt-in one-minute poller with durable pause

**Files:**
- Create: `codebase/backend/synapse_api/preparation/poller.py`
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Modify: `codebase/backend/synapse_api/preparation/repository.py`
- Modify: `codebase/backend/tests/test_preparation_api.py`

**Interfaces:**
- Poller is disabled by default and forbidden in production; interval is fixed at 60 seconds.
- Each tick takes a PostgreSQL advisory lock, loads only enabled/unpaused pipelines, reads fixed CDC SQL after the capture checkpoint using the registered source reader, and calls the shared processor.
- A failed poll persists `paused=true` with its failed run and unchanged checkpoint; later ticks skip it. Only a successful manual retry commits the held range, advances checkpoint, and clears pause.

- [ ] Test disabled/default and production configuration, lock exclusion between concurrent poller instances, empty poll, successful checkpoint advance, pause after failure, skip on later ticks, retry success/resume, retry failure/remain paused, and unavailable source/writer credentials.
- [ ] Test that a process restart preserves paused state and does not schedule the failed range again.
- [ ] Keep polling and writer roles opt-in to the synthetic lab; do not add production scheduling or automatic retry behavior.

### Task 7: End-to-end acceptance and operational note

**Files:**
- Modify: `codebase/backend/tests/test_preparation_api.py`
- Modify: `codebase/case-study/tests/verify.sh`
- Modify: `knowledge-base/changelog.md`
- Create: `docs/ux/us-007/backend-manual-validation.md`

**Interfaces:**
- Manual and polled ingestion use the same processor and produce equivalent history/current-state contents for equivalent batches.
- Operational instructions cover local lab secrets/roles, explicit poller enablement, API examples, prepared-catalog projection, failure pause/retry, and synthetic-data limitations.

- [ ] Validate successful manual and poll runs, the four publication blockers, retry lineage, immutable history, current-state deletion, cross-tenant denial, catalog merge, and unchanged Gold facts.
- [ ] Validate no API/log response contains credentials or raw payload, and consumers cannot read technical failure evidence.
- [ ] Record exact test/verification output and explicitly defer Stitch/UI visual comparison to the later UI increment.
