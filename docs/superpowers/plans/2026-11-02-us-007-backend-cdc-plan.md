# US-007 Backend CDC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Materialize tenant-scoped, immutable prepared sales dataset versions from manual or one-minute PostgreSQL CDC ingestion, preserving complete history, current state, run evidence, and lineage.

**Architecture:** Keep the current SQLite API control plane for pipeline/catalog metadata and PostgreSQL as the CDC source and prepared data plane. Add one shared batch processor for manual and polled ingestion, with atomic prepared publication and checkpoint advancement; reuse existing tenant auth, source credential resolution, and dataset catalog conventions.

**Tech Stack:** Python, FastAPI, Pydantic, SQLite, PostgreSQL 18, psycopg, Docker Compose.

**Spec:** `docs/superpowers/specs/2026-11-02-us-007-backend-cdc-design.md`

## Global Constraints

- Keep the UI out of this increment; no frontend routes, React pages, or visual assets change.
- Keep CDC history, prepared versions, execution records, and sanitized failure evidence without expiry in this lab.
- Do not modify `gold` sales facts; read-only source credentials and separate prepared writer credentials only.
- Tenant is derived from the authenticated principal; deny unresolved tenant and cross-tenant access.
- Do not accept SQL or database identifiers from API input; poll fixed parameterized SQL for the CDC relation.
- Do not include raw payloads, secrets, or personal data in error messages, logs, or consumer responses.
- Publish run outcome, version, and poll checkpoint atomically; failed runs preserve the last successful version.
- Use `sources:write` for source administration, `datasets:write` plus `sources:read` for pipeline writes, and `datasets:read` for consumer reads.

## Review Focus

- CDC event ordering with mixed source positions and equal fallback timestamps; preserve events and mark ties ambiguous.
- Invalid operation, absent business key/required fields, duplicate source event ID, and malformed operation-specific after-image; reject publication while retaining the previous version.
- Transaction failure during publication/checkpoint update; neither partial version nor advanced checkpoint may remain.
- Tenant mismatch or absent tenant context across manual submission, polling, retry, history, and current-state reads; deny access.
- Empty poll and failed polled range; create no empty run/version and require a linked manual retry without automatic retry.

---

### Task 1: CDC and prepared PostgreSQL structures

**Files:**
- Create: `codebase/case-study/init/40-cdc-prepared-schema.sql`
- Modify: `codebase/case-study/docker-compose.yml`
- Modify: `codebase/case-study/tests/verify.sh`
- Create: `codebase/case-study/tests/cdc-prepared.sql`

**Interfaces:**
- Produces source relation `gold.cdc_sales_events` with generated capture ID, tenant, source event ID, business key, operation, event timestamp, optional source position, and after-image.
- Produces tenant-restricted `prepared` run, pipeline checkpoint, version manifest, event history/membership, and current-state relations.
- Uses separate lab reader/writer roles; reader has SELECT only and writer is limited to `prepared`.

- [x] Add deterministic synthetic insert/update/delete events for both seeded tenants and SQL assertions for RLS, immutability constraints, role privileges, and Gold write denial.
- [x] Wire the versioned initialization script into Compose after the Gold seed; ensure initialization is repeatable only under the project’s existing database bootstrap lifecycle.
- [x] Verify the SQL against a fresh local case-study database and confirm Gold fact counts remain unchanged.

### Task 2: Pipeline control-plane storage and catalog registration

**Files:**
- Create: `codebase/backend/synapse_api/preparation/migration.py`
- Modify: `codebase/backend/synapse_api/database.py`
- Create: `codebase/backend/synapse_api/preparation/repository.py`
- Modify: `codebase/backend/synapse_api/datasets/repository.py`
- Modify: `codebase/backend/synapse_api/datasets/schemas.py`

**Interfaces:**
- SQLite schema migration advances additively from version 6.
- Pipeline metadata binds tenant, registered PostgreSQL source, input dataset, process/config, prepared dataset ID, enabled flag, and audit timestamps.
- Prepared dataset catalog entry has system-generated ID and linked source/process/version/range; copies declared governance metadata and leaves missing metadata visibly incomplete.

- [x] Add migration and repository operations for create/get/list pipelines, catalog registration, and immutable lineage references.
- [x] Preserve existing catalog registration/completeness semantics and prevent duplicate pipeline/dataset bindings within a tenant.
- [x] Confirm migration from an existing version-6 SQLite database and fresh initialization preserve prior registry data.

### Task 3: Shared CDC contract, validation, and materialization service

**Files:**
- Create: `codebase/backend/synapse_api/preparation/schemas.py`
- Create: `codebase/backend/synapse_api/preparation/processor.py`
- Create: `codebase/backend/synapse_api/preparation/service.py`
- Modify: `codebase/backend/synapse_api/source_connector.py`

**Interfaces:**
- `CdcEvent`: event ID, business key, operation, event timestamp, optional source position, and optional after-image.
- Shared processing entry point accepts tenant, pipeline, batch, origin, actor, request ID, and optional source range; returns an execution DTO with quality counts and version references.
- Source reader uses the existing registered secret resolution and approved destination validation, with fixed SQL and tenant filtering.

- [x] Validate required fields, supported operations, full insert/update after-images, delete key, event ID uniqueness, and event order/timestamp ambiguity.
- [x] Materialize append-only full history and version-specific current state; deletes remove current rows but remain in history.
- [x] Write run record, version, lineage, and successful checkpoint in one PostgreSQL transaction; on any failure persist sanitized evidence and preserve last successful version/checkpoint.
- [x] Bound request and response size and keep raw event values out of all raised API errors and log statements.

### Task 4: Pipeline and run APIs with tenant scopes

**Files:**
- Create: `codebase/backend/synapse_api/preparation/router.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Create: `codebase/backend/tests/test_preparation_api.py`

**Interfaces:**
- `POST/GET /api/v1/preparation-pipelines`
- `POST /api/v1/preparation-runs` for manual batches.
- `GET /api/v1/preparation-runs` and `GET /api/v1/preparation-runs/{runId}`.
- `POST /api/v1/preparation-runs/{runId}/retry` creates a linked retry.
- Dataset versions/history/current-state reads require `datasets:read`; pipeline writes, manual runs, and retries require `datasets:write` and `sources:read` as applicable.

- [x] Implement request/response schemas and routes for pipeline configuration, manual execution, run listing/detail, and manual retry.
- [x] Return sanitized technical detail only to Data Engineering; consumer read responses expose status, version, and prepared rows without run payload/error details.
- [x] Add route-level cases for scopes, tenant isolation, successful publish, quality rejection, linked retry, pagination, and body-size rejection.

### Task 5: Version reads and dataset discovery

**Files:**
- Modify: `codebase/backend/synapse_api/preparation/repository.py`
- Modify: `codebase/backend/synapse_api/preparation/service.py`
- Modify: `codebase/backend/synapse_api/preparation/router.py`
- Modify: `codebase/backend/tests/test_preparation_api.py`

**Interfaces:**
- `GET /api/v1/prepared-datasets/{datasetId}/versions`
- Version-specific CDC history and current-state reads with bounded pagination.
- Existing dataset catalog list/get exposes the registered prepared dataset with its system ID and completeness status.

- [x] Implement tenant-scoped version manifest, history, and current-state queries with stable pagination.
- [x] Verify lineage records include source dataset, process/configuration, execution, and consumed CDC range for every immutable version.
- [x] Verify failed runs do not change the latest successful version returned to consumers.

### Task 6: Opt-in one-minute PostgreSQL poller

**Files:**
- Create: `codebase/backend/synapse_api/preparation/poller.py`
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Modify: `codebase/backend/tests/test_preparation_api.py`

**Interfaces:**
- Lab-only setting controls poller enablement; interval is fixed at 60 seconds for this increment.
- Poller enumerates enabled pipelines, obtains a PostgreSQL advisory lock, reads after the stored capture checkpoint, and calls the shared processor.

- [x] Keep polling disabled unless explicitly enabled in lab configuration and disabled in production.
- [x] Ensure empty polls create no run/version, success advances checkpoint atomically, and failure holds the range for manual retry without scheduled retries.
- [x] Verify concurrent backend instances cannot process the same poller tick concurrently and missing source/writer credentials fail safely.

### Task 7: End-to-end backend acceptance and operational notes

**Files:**
- Modify: `codebase/backend/tests/test_preparation_api.py`
- Modify: `codebase/case-study/tests/verify.sh`
- Modify: `knowledge-base/changelog.md`
- Create: `docs/ux/us-007/backend-manual-validation.md`

**Interfaces:**
- Manual and polling modes exercise the same processor and generate equivalent prepared history/current-state structures for equivalent batches.
- Operational note documents local lab setup, enabling the poller, API examples, failure/retry inspection, and limitations of synthetic data.

- [x] Validate successful manual and polled runs, all four publication blockers, retry lineage, immutable history, current-state deletion, cross-tenant denial, and unchanged Gold data.
- [x] Validate the API never returns credentials/raw payloads and consumers cannot see technical failure evidence.
- [x] Document backend manual validation steps and explicitly defer Stitch/UI visual checks to the later UI increment.

---
