# US-007 Backend CDC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize tenant-scoped, immutable prepared sales dataset versions from manual or one-minute PostgreSQL CDC ingestion, preserving complete history, current state, run evidence, catalog visibility, and lineage.

**Architecture:** Continue the existing split. SQLite remains authoritative for pipeline configuration and prepared-dataset catalog metadata, using `preparation_pipelines` and `dataset_registry`. PostgreSQL remains authoritative for CDC runs, checkpoints, immutable versions, event history, and versioned current state. Pipeline creation writes the pipeline and its catalog record in one SQLite transaction. Each CDC attempt, publication, and checkpoint update stays within one PostgreSQL transaction. Dataset reads may add a read-only materialization projection from PostgreSQL; do not mirror catalog metadata or pipeline configuration into PostgreSQL.

**Tech Stack:** Python, FastAPI, Pydantic, SQLite for source/input registries, pipeline configuration, and dataset catalog; PostgreSQL 18 and psycopg for CDC execution and prepared versions; Docker Compose.

**Spec:** `docs/superpowers/specs/2026-11-02-us-007-backend-cdc-design.md`

> **Scope note (2026-11-14):** This plan follows the latest user direction to continue with SQLite for pipelines and catalog metadata. The linked design has been reconciled to this persistence boundary and remains a draft for human review.

## Global Constraints

- Keep the UI out of this increment; no frontend routes, React pages, or visual assets change.
- Keep CDC history, prepared versions, execution records, and sanitized failure evidence without expiry in this lab.
- Do not modify `gold` sales facts; source credentials are read-only, and the separate prepared-writer credential is tenant-restricted by PostgreSQL RLS.
- Keep pipeline configuration and prepared-dataset catalog metadata in SQLite. Do not create PostgreSQL mirrors of those records.
- Keep run outcomes, checkpoints, versions, event history, and current-state snapshots in PostgreSQL. Do not split a CDC publication across SQLite and PostgreSQL transactions.
- Tenant is derived from the authenticated principal; deny unresolved tenant and cross-tenant access.
- Do not accept SQL, tenant IDs, database identifiers, role names, schema names, or relation names from API input.
- Do not include raw payloads, secrets, or personal data in error messages, logs, or consumer responses.
- Commit run outcome, version, lineage, and successful poll checkpoint atomically in PostgreSQL.
- Derive the durable poll pause from the latest poll-origin run in PostgreSQL: a failed poll blocks later scheduled ticks until a linked poll retry succeeds. Do not add a separate pause flag to SQLite.
- Use `sources:write` for source administration, `datasets:write` plus `sources:read` for pipeline writes, and `datasets:read` for consumer reads.
- Existing SQLite dataset records remain unchanged; creating a pipeline adds its prepared catalog record there. Catalog reads that need the materialization projection fail closed if PostgreSQL is unavailable.

## Review Focus

- Source position and fallback timestamps are not comparable values: require one ordering mode per batch and quality-reject mixed-presence batches; preserve equal-timestamp events in timestamp mode and mark their order ambiguous.
- Invalid operation, absent business key/required fields, duplicate source event ID, or malformed after-image rejects publication while retaining the previous version.
- Failure during version publication leaves no partial version and does not advance the checkpoint or replace the previous published version.
- Tenant mismatch or absent tenant context across SQLite pipeline/catalog predicates and PostgreSQL run, poll, retry, history, and current-state access is denied; PostgreSQL reads/writes also enforce RLS.
- Empty polls create no run/version; failed ranges pause and are not retried by later scheduled ticks.
- Failure to read PostgreSQL materialization data returns an error, never a successful catalog response with an omitted or stale materialization projection.

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
- Prepared relations: `preparation_runs`, `pipeline_checkpoints`, `dataset_versions` (including immutable lineage fields), `version_events`, and `current_sales_state` in schema `prepared`. Pipeline and dataset catalog records remain in SQLite.
- Tenant-fixed lab roles: registered source readers remain read-only and can SELECT prepared rows under tenant RLS; a distinct prepared writer can write only its tenant's `prepared` rows and cannot write `gold`.
- Test fixture: deterministic insert/update/delete events for both seeded tenants, using the registered tenant reader credential and a separate prepared-writer secret file without printing or overwriting existing secrets.

- [ ] Implement versioned DDL with forced RLS, tenant-safe keys/FKs, append-only event/version/lineage guards, indexes, and grants. Assert prepared writers cannot mutate `gold` or read/write another tenant.
- [ ] Seed deterministic CDC rows from the synthetic sales case without changing `gold.fact_sales`; use generated `capture_id` only as a polling cursor, not event order.
- [ ] Wire initialization after the Gold seed and update `verify.sh` to check both tenant roles, writer isolation, reader SELECT-only access, event shape, RLS, and unchanged Gold counts.
- [ ] Run the case-study verification against a fresh local database and record exact output before completing this task.

### Task 2: SQLite pipeline/catalog boundary and PostgreSQL runtime repositories

**Files:**
- Keep: `codebase/backend/synapse_api/preparation/repository.py` as the SQLite pipeline repository.
- Keep: `codebase/backend/synapse_api/preparation/migration.py` and the existing SQLite v7/v8 pipeline schema.
- Modify: `codebase/backend/synapse_api/preparation/service.py` for PostgreSQL execution state and retry behavior.
- Modify: `codebase/backend/synapse_api/source_connector.py` for fixed PostgreSQL prepared-data access.
- Modify: `codebase/backend/synapse_api/datasets/repository.py` for the SQLite catalog record and PostgreSQL materialization projection.
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Create: `codebase/backend/tests/test_preparation_repository.py`

**Interfaces:**
- `PreparationRepository` validates tenant-owned source/input rows and writes the pipeline plus prepared dataset metadata to SQLite in one transaction. Preserve the system-generated IDs and existing v7/v8 records.
- PostgreSQL writer/reader connections use fixed laboratory configuration and existing source credential resolution; request bodies never supply connection settings or database identifiers.
- PostgreSQL stores no second copy of pipeline configuration or prepared catalog metadata. CDC runs, checkpoints, versions, event history, and current-state snapshots remain PostgreSQL-owned.
- Do not add a SQLite migration solely to move these records. Add a migration only if a separately approved SQLite behavior requires it.

- [ ] Validate registered source-reader resolution and the lab-only prepared-writer secret file; production must refuse lab-only poller/writer settings, and secrets must never enter logs or API responses.
- [ ] Preserve tenant-filtered pipeline create/get/list and duplicate-binding rejection in SQLite; verify pipeline plus catalog creation rolls back together on failure.
- [ ] Test PostgreSQL configuration, missing/malformed secret files, tenant context/RLS, source/dataset lookup failures, and independent SQLite/PostgreSQL failure handling.
- [ ] Verify existing SQLite v7/v8 data remains readable and no PostgreSQL pipeline/catalog mirror is created.

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
- [ ] Add transaction tests proving successful version, run outcome, lineage, latest-success reference, and poll checkpoint commit together; injected failure leaves the previous version/checkpoint untouched.
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

### Task 5: SQLite dataset catalog with PostgreSQL materialization projection

**Files:**
- Modify: `codebase/backend/synapse_api/datasets/schemas.py`
- Modify: `codebase/backend/synapse_api/datasets/service.py`
- Modify: `codebase/backend/synapse_api/datasets/repository.py`
- Modify: `codebase/backend/synapse_api/preparation/repository.py`
- Modify: `codebase/backend/tests/test_datasets_api.py`
- Create: `codebase/backend/tests/test_prepared_catalog_projection.py`

**Interfaces:**
- Keep one catalog record per prepared dataset in SQLite, with tenant-scoped source/input references and the declared governance snapshot. Do not create a PostgreSQL catalog-metadata table.
- Add optional `materialization` to prepared dataset summary/detail, projected from PostgreSQL with schema/relation and latest published version ID/time; existing SQLite-backed dataset fields remain unchanged.
- `GET /api/v1/datasets` applies its existing filters, stable ordering, total, and pagination to SQLite catalog records, then adds the PostgreSQL projection to the returned prepared-dataset rows.
- `GET /api/v1/datasets/{id}` resolves the tenant-scoped SQLite catalog row and attaches its PostgreSQL materialization projection. Preserve generic not-found behavior for unknown or cross-tenant IDs.
- Prepared catalog metadata snapshots only declared source governance fields and never populates missing values. The record remains `draft` or `registered` under current registration rules; publication status remains separate in `materialization`.

- [ ] Add tests for SQLite catalog filtering/order/pagination, PostgreSQL materialization projection on list/detail, metadata incompleteness, and tenant isolation.
- [ ] Add a test proving a PostgreSQL projection failure returns a service error rather than a catalog response with missing/stale materialization.
- [ ] Run all existing dataset API tests and verify direct/registered dataset behavior and response contracts remain unchanged apart from the optional additive `materialization` field.

### Task 6: Opt-in one-minute poller with durable failure-derived pause

**Files:**
- Create: `codebase/backend/synapse_api/preparation/poller.py`
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Modify: `codebase/backend/synapse_api/preparation/repository.py`
- Modify: `codebase/backend/tests/test_preparation_api.py`

**Interfaces:**
- Poller is disabled by default and forbidden in production; interval is fixed at 60 seconds.
- Each tick loads enabled pipelines from SQLite, takes a PostgreSQL advisory lock per pipeline, checks the latest poll-origin run, reads fixed CDC SQL after the PostgreSQL checkpoint, and calls the shared processor. A poll-origin failure in PostgreSQL is the durable pause signal; no separate SQLite pause column is introduced.
- A failed poll leaves the PostgreSQL checkpoint unchanged and later scheduled ticks skip the pipeline. A linked retry is bounded by the failed run's recorded capture range; only successful publication advances the checkpoint, after which polling resumes.
- Use the same per-pipeline serialization for manual and polled publication so concurrent runs cannot allocate the same version number.

- [ ] Test disabled/default and production configuration, lock exclusion, empty poll, successful checkpoint advance, durable failure-derived pause, skip on later ticks, bounded retry, retry success/resume, retry failure/remain paused, and unavailable source/writer credentials.
- [ ] Test concurrent manual/poll publication for one pipeline and verify unique, sequential version allocation.
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

- [ ] Validate successful manual and poll runs, the four publication blockers, retry lineage, immutable history, current-state deletion, cross-tenant denial, SQLite catalog plus PostgreSQL materialization projection, and unchanged Gold facts.
- [ ] Validate no API/log response contains credentials or raw payload, and consumers cannot read technical failure evidence.
- [ ] Record exact test/verification output and explicitly defer Stitch/UI visual comparison to the later UI increment.
