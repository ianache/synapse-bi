# US-007 — Backend-first CDC design

**Status:** Draft for human review. The user selected PostgreSQL-only persistence for US-007 state/publication, PostgreSQL-backed prepared catalog entries projected through the existing catalog API, and pausing polling after failure. Product code must wait for approval of this updated design.

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
| Store US-007 prepared catalog records in PostgreSQL; combine them with existing SQLite records in the current catalog API during reads. | Avoids cross-database publication writes and preserves existing records; catalog reads depend on both stores. | Selected by the user on 2026-11-14. |
| Migrate the entire dataset catalog from SQLite to PostgreSQL. | One backing store for all datasets, but expands this increment into a migration of existing US-002 records and behavior. | Not selected. |
| Keep prepared outputs only in a separate preparation API. | Smallest catalog change, but prepared outputs would not appear in the existing dataset catalog as previously agreed. | Not selected. |

## Existing system facts

- FastAPI owns the API. SQLite is the existing control-plane store and currently has schema version 6.
- Source registration is tenant-scoped, separates `sources:read`, `sources:write`, and `sources:observe`, encrypts credentials, and connects from the backend through an allowlisted PostgreSQL connector.
- The case study has synthetic sales tables in PostgreSQL `gold`, tenant RLS, and separate read-only database roles. It has no CDC or ETL yet.
- Dataset registration stores declared metadata and source snapshots; it does not execute a process or materialize data.
- The dataset catalog is currently stored in SQLite schema version 6. Its rows require a source and observation, and its API derives origin columns from the source observation. PostgreSQL is already the Gold source and will also host all US-007 state.
- The current US-007 story is still draft/CONDITIONAL. Its existing UI has no approved Stitch screen for this flow.

## Proposed backend design

These are implementation proposals derived from the approved scope. They are not claims of existing behavior.

### 1. Source CDC table and synthetic events

Add an append-only `gold.cdc_sales_events` table to the case-study database. It contains a database-generated capture ID for polling, tenant ID, source event ID, sales-line business key, operation, event timestamp, optional source position, and JSON after-image. Deletes have no after-image. Seed deterministic insert/update/delete examples from the existing synthetic sales facts. The source readers receive SELECT only; RLS scopes rows to their tenant.

The capture ID is a polling checkpoint, not the event-ordering rule. Processing order follows the approved source-position/timestamp rule. Equal fallback timestamps are retained and flagged ambiguous; they do not silently discard events.

Each batch must use one ordering mode: either every event includes `source_position`, or no event includes it. A batch mixing positioned and unpositioned events is rejected by the quality gate before materialization. For a positioned batch, order by the source position; for a batch without positions, order by event timestamp and retain equal-timestamp events while marking their order ambiguous. This avoids comparing positions directly with timestamps.

### 2. Pipeline configuration and polling

Store an explicit tenant-scoped pipeline configuration that links a registered source, prepared dataset identity, and process reference. The poller considers enabled pipelines only; it never polls every registered source by default.

Run one opt-in background poller in the lab backend process at 60-second intervals. Use a PostgreSQL advisory lock so a second backend process does not run the same poller concurrently. Read the source through the existing `SourceService` credential path and fixed parameterized SQL for the CDC table; do not accept client SQL or database identifiers.

Advance the checkpoint only in the same successful prepared-database transaction that publishes the version. If a batch fails, record the attempt and hold that pipeline at the failed range, atomically setting its polling state to paused. Later scheduled ticks skip paused pipelines. Data Engineering must invoke a manual retry; a successful retry publishes and advances the checkpoint in one PostgreSQL transaction and clears the pause. A failed retry keeps the pipeline paused. A poll with no new events creates no execution and no empty version.

### 3. Shared processing and materialization

Manual submission and polling call the same batch processor. A manual request supplies the pipeline/dataset reference and an event batch; tenant comes from the authenticated principal, never from the request body.

The processor validates the agreed event contract, business keys, operation-specific after-image rules, required fields, and unique event IDs. It records per-check outcome and counts. Any blocking failure makes the run `Rechazada por calidad` or `Fallida técnica`, does not publish a version, and leaves the last successful version unchanged.

For a successful batch, write one new version containing the full CDC history as of the accepted range and the matching current-state snapshot. Deletes remain in history and remove the key from current state. Version contents and lineage are immutable. The lab does not purge CDC, published versions, run records, or sanitized failure evidence. This does not establish a production retention rule.

Use PostgreSQL `prepared` tables for pipeline configuration, run records, checkpoints, version manifests, event history, version-specific current state, lineage, and prepared catalog records. PostgreSQL is the only persistence authority for US-007; do not create a SQLite pipeline/catalog mirror or write the same publication to both databases. Keep run outcome, version, lineage, latest-version pointer, and successful poll checkpoint in one PostgreSQL transaction. Store sanitized failure evidence, actor, tenant, request ID, and linked attempt IDs; never store raw payloads in error messages or logs.

The existing `GET /api/v1/datasets` and `GET /api/v1/datasets/{id}` catalog reads combine the current SQLite-backed datasets with PostgreSQL-backed US-007 prepared entries. Existing SQLite records remain unchanged. Prepared entries receive a system-generated ID and retain input dataset/source references plus a snapshot of declared owner, classification, and freshness metadata. Missing declared metadata remains missing and contributes to the existing completeness calculation; no defaults or governance approval are inferred. Add an explicit `materialization` projection for the output location in `prepared` and its latest published version. The existing `origin` continues to describe the registered input source for compatibility. Filtering, total count, stable ordering, and pagination apply to the combined result. If PostgreSQL catalog reads fail, the API returns an error instead of silently omitting prepared datasets.

Only configuration-time lookups of the registered source and input dataset read SQLite, using existing tenant-scoped services. The pipeline and PostgreSQL prepared catalog persist their IDs and required metadata snapshot. No transaction or outbox spanning SQLite and PostgreSQL is needed because US-007 publication and its catalog entry share PostgreSQL.

### 4. Credentials and tenant boundary

Reuse the tenant-scoped read-only connection stored by US-001 for source reads. Use a separate prepared-schema writer credential and tenant-restricted prepared readers for the lab. Do not return any credential to the API client. Apply tenant predicates and PostgreSQL RLS; missing tenant resolution denies access.

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
- Do not add a SQLite migration for US-007 pipeline, execution, version, lineage, or prepared-catalog records. The existing source and input-dataset registries remain SQLite-backed and are read for tenant-scoped configuration validation and metadata snapshots.
- Keep the new poller opt-in for the lab, disabled in production configuration, and safe when the source or prepared writer credential is unavailable.
- Do not change frontend routes, React pages, or visual assets in this increment.

## Acceptance outcomes for this backend slice

- A valid manual event batch and a valid polled batch use the same validation/materialization path and create one published immutable version.
- Missing key, unsupported/invalid operation, absent required fields, or duplicate event IDs block publication and preserve the last successful version.
- Insert/update after-images update current state; deletes remain in history and remove the current row.
- Retries create linked attempts and never erase previous attempts. A failed polled range remains held until manually retried.
- A tenant cannot read, write, poll, or retry another tenant's pipeline, runs, versions, or events.
- Polling uses the one-minute interval and the capture checkpoint, creates no empty versions, and does not cause repeated automatic attempts after failure.
- A failed polling attempt pauses its pipeline; subsequent ticks skip it until Data Engineering manually retries. Only successful retry clears the pause and advances the checkpoint.
- The existing catalog API returns SQLite datasets and PostgreSQL prepared entries with one consistent filter/order/count/page result and never omits prepared entries on a PostgreSQL read failure.
- Published metadata includes the approved lineage, run fields, counts, controls, version, and last successful version.
- Secrets and raw payloads do not appear in responses or logs. Gold remains unchanged by the preparation writer.

## Deferred to UI increment

Create exact Google Stitch references for pipeline setup, execution history/details, version/lineage detail, quality-rejected and technical-failure states, then compare implemented desktop and mobile captures against those references. The backend can be reviewed through API behavior before the UI design is approved; no visual-conformance claim applies to this backend slice.

## Human decisions added after independent Builder Check

- Catalog integration: the prepared sales dataset must also appear in the existing dataset catalog.
- Source administration: reuse the existing `sources:write` scope.
- Laboratory retention: run records and sanitized failure evidence have no expiry. This is separate from any production retention policy.

The independent Builder Check found these three decisions; the user has now answered all three and they are incorporated above.

## Human decisions added during plan review (2026-11-14)

- Store all US-007 pipeline, run, checkpoint, version, lineage, and prepared-catalog state in PostgreSQL. Publication uses PostgreSQL only; no dual write to SQLite.
- Show PostgreSQL prepared-catalog entries through the existing datasets API by combining them with existing SQLite-backed entries on reads. Preserve existing SQLite rows.
- On a poll failure, pause the pipeline. Scheduled ticks skip it until Data Engineering manually retries; only a successful retry clears the pause and advances the checkpoint.

## Remaining implementation calls for review

- The source event relation will be `gold.cdc_sales_events`, with an internal capture ID for polling and the approved optional source position for event ordering.
- The prepared catalog entry receives a system-generated ID and links to the input dataset, process, run, prepared version, and consumed event range. It snapshots declared source governance metadata and preserves incompleteness when fields are missing; no unrelated taxonomy/default is introduced.
- Prepared catalog entries have a system-generated stable ID, input dataset/source references, process reference, declared-governance snapshot, output columns, and `materialization` reference. Their latest successful version pointer is updated atomically with publication; per-version lineage remains immutable. Missing metadata remains incomplete; no unrelated taxonomy/default is introduced.
- PostgreSQL-backed prepared entries are merged with SQLite-backed entries by the existing catalog read API. Combined filtering, total count, stable ordering, and pagination are calculated over both sets; failure to read either backing store fails the request rather than returning a partial catalog.
- Lab-only reader/writer PostgreSQL roles remain tenant-restricted by RLS; the source connection remains read-only and the writer is separate.
- Laboratory prepared readers and writers use separate tenant-fixed PostgreSQL roles and secret files. The API maps the authenticated tenant to an explicitly configured role/secret; it never accepts role, tenant, schema, or relation names from request bodies. The writer has no privileges on `gold`; source readers remain read-only.
- A poll failure sets a durable paused state in PostgreSQL while leaving the checkpoint unchanged. The retry endpoint processes the held range; success atomically publishes, advances the checkpoint, and clears pause. Failure leaves pause in place. Later scheduled ticks never resubmit a paused range.
- The exact physical API schemas, SQL constraints, and request-size limits are implementation details subject to plan review.
- A mixed batch with some source positions and some missing source positions has no approved total-order rule yet; decide whether to reject mixed batches or accept them with an explicit deterministic ambiguity policy before implementing event ordering.
- A batch containing both positioned and unpositioned events is rejected by the quality gate. This rule was approved by the user on 2026-11-14.

All implementation calls are limited to this synthetic laboratory. They do not approve production credentials, retention, identity mappings, or service targets.
