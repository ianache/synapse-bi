# US-007 — Backend-first CDC design

**Status:** Implementation authorized on 2026-11-14 with the latest user direction to continue the existing SQLite control plane and dataset catalog for pipeline configuration and prepared-dataset metadata, while PostgreSQL remains authoritative for CDC runs, checkpoints, and prepared versions. The detailed physical design remains a draft for human review.

**Date:** 2026-11-02

## Intent

Deliver the backend foundation for engineering a versioned prepared sales dataset from CDC events. Data Engineering can submit an event batch manually or let BI poll the registered PostgreSQL source every minute. Both paths use the same validation, execution ledger, materialization, and publication rules. The UI is a later increment.

The purpose of the first slice is to make the result durable, tenant-scoped, traceable, and consumable through an API without changing the Gold source or claiming production readiness.

## User-approved behavior

- Use the existing synthetic sales case study in PostgreSQL.
- Include CDC inserts, updates, and deletes, plus the current state.
- Each successful execution creates an immutable version. A failed execution does not replace the last consumable version.
- Keep CDC history without expiry for this increment.
- Order events by source sequence/position when present; otherwise use the event timestamp. Mark timestamp ties as ambiguous.
- Block publication for missing business keys, invalid events, missing required fields, or duplicate source event IDs.
- Event fields: unique source event ID, business key, operation, event timestamp, and full after-image for insert/update. Delete requires the business key. Source position is optional.
- Accept manual event batches from Data Engineering and poll events from PostgreSQL every minute, resuming from the last processed capture position.
- On failure, record the attempt and sanitized evidence, keep the last successful version, and allow unlimited manual retries by Data Engineering. Do not retry automatically. Each retry is a new linked attempt.
- Data Engineering can submit/retry in its tenant. Authenticated consumers in that tenant can read published results. No cross-tenant access.
- Data Engineering sees sanitized technical error code/message and counts. Consumers see status and publication outcome. Error messages exclude raw payloads, secrets, and personal data.
- Each run exposes ID, dataset/process, input channel, start/end, status, counts by operation and rejected events, quality results, published version, and last successful version.
- Every published version keeps immutable lineage to source dataset, process/configuration, run, and consumed CDC range.
- Reuse the registered PostgreSQL source from US-001, with its tenant reader credential and backend-only connection.
- Store prepared versions in PostgreSQL schema `prepared`, separate from `gold`, using a writer credential distinct from the source reader.
- For manual registration, Data Engineering submits a CDC event batch using the approved event contract; the backend validates and materializes the version.
- States: Recibida, Procesando, Publicada, Fallida técnica, Rechazada por calidad.

## Goals

1. Provide manual and periodic CDC ingestion through a shared processor.
2. Persist run history, checkpoints, immutable versions, CDC history, and version-specific current state.
3. Make published versions readable through tenant-scoped backend APIs and discoverable from the existing dataset catalog.
4. Preserve the last successful version on any failed or quality-rejected attempt.
5. Keep secrets and untrusted event payloads out of public errors and application logs.

## Non-goals

- UI implementation. It follows in a separate increment after Stitch screens for this flow are agreed and reviewed against desktop and mobile captures.
- Generic orchestration, configurable transformation language, arbitrary SQL, production SLA, multi-region scheduling, or a production CDC connector.
- Writing to PostgreSQL `gold` or changing the US-005 serving path.
- Automatic retries, event-history expiry, or a claim that synthetic data is business-certified.

## Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| Backend-first, then UI | Makes ingestion, persistence, and API contracts independently reviewable. The user can inspect data behavior before UI work. | Selected by the user. |
| Full vertical slice including UI | Delivers a visible flow sooner, but no Stitch reference exists yet and the backend contract would be designed alongside an unapproved screen. | Deferred. |
| Record execution metadata only | Simpler, but cannot create the approved prepared dataset from the manual path. | Rejected after the user chose manual CDC event batches. |

### Prepared catalog persistence alternatives

| Approach | Trade-off | Decision |
|---|---|---|
| Keep pipeline configuration and prepared-dataset catalog metadata in SQLite; keep CDC execution state and prepared versions in PostgreSQL, with a read-only materialization projection in the existing catalog API. | Preserves the current control-plane and catalog contracts; avoids a catalog/pipeline migration and cross-database writes during publication; catalog projections depend on both stores. | Selected by the user in the latest direction on 2026-11-14. |
| Migrate the entire dataset catalog from SQLite to PostgreSQL. | One backing store for all datasets, but expands this increment into a migration of existing US-002 records and behavior. | Not selected. |
| Keep prepared outputs only in a separate preparation API. | Smallest catalog change, but prepared outputs would not appear in the existing dataset catalog as previously agreed. | Not selected. |

## Existing system facts

- FastAPI owns the API. SQLite is the existing control-plane store; the current database schema is version 8.
- Source registration is tenant-scoped, separates `sources:read`, `sources:write`, and `sources:observe`, encrypts credentials, and connects from the backend through an allowlisted PostgreSQL connector.
- The case study has synthetic sales tables in PostgreSQL `gold`, tenant RLS, and separate read-only database roles. It has no CDC or ETL yet.
- Dataset registration stores declared metadata and source snapshots; it does not execute a process or materialize data.
- The dataset catalog and US-007 pipeline configuration are stored in SQLite (dataset schema v3; pipeline registry v7/v8). Catalog rows require a source and observation, and the API derives origin columns from the source observation. PostgreSQL is the Gold source and hosts CDC execution and prepared version data.
- The current US-007 story is still draft/CONDITIONAL. Its existing UI has no approved Stitch screen for this flow.

## Proposed backend design

These are implementation proposals derived from the approved scope. They are not claims of existing behavior.

### 1. Source CDC table and synthetic events

Add an append-only `gold.cdc_sales_events` table to the case-study database. It contains a database-generated capture ID for polling, tenant ID, source event ID, sales-line business key, operation, event timestamp, optional source position, and JSON after-image. Deletes have no after-image. Seed deterministic insert/update/delete examples from the existing synthetic sales facts. The source readers receive SELECT only; RLS scopes rows to their tenant.

The capture ID is a polling checkpoint, not the event-ordering rule. Processing order follows the approved source-position/timestamp rule. Equal fallback timestamps are retained and flagged ambiguous; they do not silently discard events.

Each batch must use one ordering mode: either every event includes `source_position`, or no event includes it. A batch mixing positioned and unpositioned events is rejected by the quality gate before materialization. For a positioned batch, order by the source position; for a batch without positions, order by event timestamp and retain equal-timestamp events while marking their order ambiguous. This avoids comparing positions directly with timestamps.

### 2. Pipeline configuration and polling

Store the explicit tenant-scoped pipeline configuration in the existing SQLite `preparation_pipelines` registry. Keep the prepared-dataset catalog metadata in SQLite `dataset_registry`; create both records in one SQLite transaction. The poller considers enabled pipelines only; it never polls every registered source by default.

Run one opt-in background poller in the lab backend process at 60-second intervals. Use a PostgreSQL advisory lock so a second backend process does not run the same poller concurrently. Read the source through the existing `SourceService` credential path and fixed parameterized SQL for the CDC table; do not accept client SQL or database identifiers.

Advance the checkpoint only in the same successful prepared-database transaction that publishes the version. If a batch fails, record the attempt and hold that pipeline at the failed range in PostgreSQL. The latest poll-origin run is the durable pause signal: later scheduled ticks skip the pipeline while its latest poll run is failed. Do not add a separate pause flag to SQLite. Data Engineering must invoke a linked manual retry bounded by the failed run's recorded capture range; a successful retry publishes and advances the checkpoint in one PostgreSQL transaction, after which polling resumes. A failed retry keeps the pipeline paused. A poll with no new events creates no execution and no empty version.

### 3. Shared processing and materialization

Manual submission and polling call the same batch processor. A manual request supplies the pipeline/dataset reference and an event batch; tenant comes from the authenticated principal, never from the request body.

The processor validates the agreed event contract, business keys, operation-specific after-image rules, required fields, and unique event IDs. It records per-check outcome and counts. Any blocking failure makes the run `Rechazada por calidad` or `Fallida técnica`, does not publish a version, and leaves the last successful version unchanged.

For a successful batch, write one new version containing the full CDC history as of the accepted range and the matching current-state snapshot. Deletes remain in history and remove the key from current state. Version contents and lineage are immutable. The lab does not purge CDC, published versions, run records, or sanitized failure evidence. This does not establish a production retention rule.

Use PostgreSQL `prepared` tables for run records, checkpoints, version manifests, event history, version-specific current state, and immutable lineage. Keep pipeline configuration and prepared-dataset catalog metadata in SQLite; do not create PostgreSQL mirrors of those records. Keep run outcome, version, lineage, and successful poll checkpoint in one PostgreSQL transaction. Store sanitized failure evidence, actor, tenant, request ID, and linked attempt IDs; never store raw payloads in error messages or logs. Serialize manual and poll publication per pipeline so concurrent runs cannot allocate the same version number.

The existing `GET /api/v1/datasets` and `GET /api/v1/datasets/{id}` catalog reads continue to resolve dataset records and apply their existing filters/order/count/page behavior from SQLite. A prepared-dataset row receives a read-only PostgreSQL `materialization` projection for the output location in `prepared` and its latest published version. The SQLite record keeps its system-generated ID, input dataset/source references, and snapshot of declared owner, classification, and freshness metadata. Missing declared metadata remains missing and contributes to the existing completeness calculation; no defaults or governance approval are inferred. The existing `origin` continues to describe the registered input source for compatibility. If PostgreSQL materialization reads fail, the API returns an error instead of omitting or returning stale materialization data.

Configuration-time lookups use existing tenant-scoped SQLite services. Pipeline creation writes the pipeline and prepared catalog metadata together in SQLite; processing and publication write only PostgreSQL runtime data. No transaction or outbox spanning SQLite and PostgreSQL is needed because CDC publication does not update the SQLite catalog row; the latest version is projected on reads.

### 4. Credentials and tenant boundary

Reuse the tenant-scoped read-only connection stored by US-001 for CDC reads and prepared-data reads. Use a separate prepared-schema writer credential for the lab. Do not return any credential to the API client. Apply tenant predicates to SQLite pipeline/catalog operations and PostgreSQL RLS to prepared data; missing tenant resolution denies access.

The user approved `sources:write` for source administration. Pipeline configuration, manual submission, and retries use existing `datasets:write` plus `sources:read` where needed; reading runs and published data uses `datasets:read`. These scopes retain existing tenant derivation from the authenticated principal.

### 5. API surface

Proposed routes, subject to contract review:

- `POST /api/v1/preparation-pipelines` and `GET /api/v1/preparation-pipelines` to configure and inspect tenant-scoped pipelines.
- `POST /api/v1/preparation-runs` to submit a manual CDC event batch.
- `GET /api/v1/preparation-runs` and `GET /api/v1/preparation-runs/{runId}` to query runs.
- `POST /api/v1/preparation-runs/{runId}/retry` to create a linked manual retry. For manual-origin failures, the retry request resubmits the event batch; for poll-origin failures, it processes the held source range.
- `GET /api/v1/prepared-datasets/{datasetId}/versions` and version history/current-state reads to consume a published version.

Responses include the approved execution fields. Data Engineering receives sanitized error details and quality outcomes. Consumers receive status, published-version reference, and prepared rows only; they do not receive detailed errors or run payloads. Pagination and response-size limits are required for data reads.

### 6. Database and lifecycle changes

- Add a versioned PostgreSQL case-study migration for CDC source events and the `prepared` schema, roles, grants, and RLS policies.
- Preserve the current SQLite v8 pipeline and catalog records; do not migrate them to PostgreSQL or create duplicate PostgreSQL copies. Add a SQLite migration only if a separately approved SQLite behavior requires one.
- Use versioned PostgreSQL migrations for CDC source events and the `prepared` runtime schema, roles, grants, and RLS policies.
- Keep the new poller opt-in for the lab, disabled in production configuration, and safe when the source or prepared writer credential is unavailable.
- Do not change frontend routes, React pages, or visual assets in this increment.

## Acceptance outcomes for this backend slice

- A valid manual event batch and a valid polled batch use the same validation/materialization path and create one published immutable version.
- Missing key, unsupported/invalid operation, absent required fields, or duplicate event IDs block publication and preserve the last successful version.
- Insert/update after-images update current state; deletes remain in history and remove the current row.
- Retries create linked attempts and never erase previous attempts. A failed polled range remains held until manually retried.
- A tenant cannot read, write, poll, or retry another tenant's pipeline, runs, versions, or events.
- Polling uses the one-minute interval and the capture checkpoint, creates no empty versions, and does not cause repeated automatic attempts after failure.
- A failed polling attempt is durably represented by its poll-origin run in PostgreSQL; subsequent ticks skip the pipeline until Data Engineering manually retries. Only a successful retry advances the checkpoint and resumes polling.
- The existing catalog API keeps SQLite dataset records and applies existing filters/order/count/page behavior there; prepared rows receive a PostgreSQL materialization projection. A PostgreSQL projection failure returns an error rather than omitting or returning stale materialization data.
- Published metadata includes the approved lineage, run fields, counts, controls, version, and last successful version.
- Secrets and raw payloads do not appear in responses or logs. Gold remains unchanged by the preparation writer.

## Deferred to UI increment

Create exact Google Stitch references for pipeline setup, execution history/details, version/lineage detail, quality-rejected and technical-failure states, then compare implemented desktop and mobile captures against those references. The backend can be reviewed through API behavior before the UI design is approved; no visual-conformance claim applies to this backend slice.

## Human decisions added after independent Builder Check

- Catalog integration: the prepared sales dataset must also appear in the existing dataset catalog.
- Source administration: reuse the existing `sources:write` scope.
- Laboratory retention: run records and sanitized failure evidence have no expiry. This is separate from any production retention policy.

The independent Builder Check found these three decisions; the user has now answered all three and they are incorporated above.

## Initial persistence direction (2026-11-14; superseded by the latest instruction below)

- The initial direction selected PostgreSQL for all US-007 state and PostgreSQL-backed prepared-catalog entries projected through the existing API. The user later instructed that pipeline and catalog metadata continue in SQLite; this initial persistence choice is superseded.
- The polling behavior remains: a failed poll pauses scheduling until Data Engineering performs a successful manual retry; the checkpoint does not advance on failure.

## Latest persistence direction (2026-11-14)

- Continue the existing SQLite control plane: pipeline configuration and prepared-dataset catalog metadata remain in SQLite.
- Keep CDC run records, checkpoints, versions, events, current-state snapshots, and immutable lineage in PostgreSQL. Do not mirror pipeline/catalog metadata into PostgreSQL or split a publication transaction across stores.
- The existing catalog reads SQLite dataset records and attach a read-only PostgreSQL materialization projection for prepared outputs. A projection failure returns an error instead of stale or incomplete materialization data.
- Treat the latest poll-origin failure in PostgreSQL as the durable pause signal; no separate SQLite pause flag is introduced. A successful linked retry resumes polling and advances the checkpoint.

## Remaining implementation calls for review

- The source event relation will be `gold.cdc_sales_events`, with an internal capture ID for polling and the approved optional source position for event ordering.
- The prepared catalog entry remains in SQLite with a system-generated stable ID, input dataset/source references, process reference, declared-governance snapshot, and output columns. PostgreSQL materialization data is projected on reads; latest version is resolved from PostgreSQL without updating the SQLite row during publication. Missing metadata remains incomplete; no unrelated taxonomy/default is introduced.
- Per-version lineage remains immutable in PostgreSQL. A successful publication and its run/checkpoint state commit atomically there; SQLite catalog metadata is not part of that transaction.
- Tenant-scoped API predicates protect SQLite pipeline/catalog rows; PostgreSQL prepared data remains tenant-restricted by RLS. The source connection remains read-only and the writer is separate.
- Reuse the registered tenant source reader for CDC and prepared-data reads. Use a separate laboratory writer credential; the API never accepts role, tenant, schema, or relation names from request bodies. The writer has no privileges on `gold`.
- A poll failure is retained as a failed poll-origin run in PostgreSQL and leaves the checkpoint unchanged. Scheduled ticks skip pipelines whose latest poll run failed. A retry is bounded by the failed capture range; success atomically publishes and advances the checkpoint, while failure leaves polling paused.
- The exact physical API schemas, SQL constraints, and request-size limits are implementation details subject to plan review.
- A mixed batch with some source positions and some missing source positions has no approved total-order rule yet; decide whether to reject mixed batches or accept them with an explicit deterministic ambiguity policy before implementing event ordering.
- A batch containing both positioned and unpositioned events is rejected by the quality gate. This rule was approved by the user on 2026-11-14.

All implementation calls are limited to this synthetic laboratory. They do not approve production credentials, retention, identity mappings, or service targets.
