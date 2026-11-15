# US-006 Keycloak Identity and Per-KPI Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the local BI application to Keycloak-managed users and let only a dashboard owner grant and revoke a reader’s access to individual KPIs in that dashboard.

**Architecture:** Keycloak authenticates users and signs stable `sub`, `tenant_id`, name, audience, and scopes. BI stores dashboard-scoped user/KPI grants in its existing SQLite lab database and checks them server-side on dashboard, KPI detail, metadata, and query routes. Dashboard access and KPI grants remain separate requirements.

**Tech Stack:** React 19, TypeScript, Vite, Keycloak 26.8 community image for the local lab, FastAPI, PyJWT RS256/JWKS, SQLite schema migrations, Docker Compose/PostgreSQL schema `keycloak`.

**Spec:** `docs/superpowers/specs/2026-10-30-us-006-identidad-y-acceso-kpi-design.md`

## Global Constraints

- This plan targets the local laboratory only; it does not certify a production IAM or Red Hat supported deployment.
- Keycloak accounts are managed directly in a dedicated `bi-lab` realm; no external directory federation.
- Keycloak uses the existing PostgreSQL service and its own `keycloak` schema. BI grants remain in the BI database and never in Keycloak tables.
- The owner of a dashboard is the only person who can grant or revoke KPI permissions on that dashboard.
- A reader needs both dashboard access and an explicit grant for each KPI; a KPI grant does not grant dashboard access.
- A grant is scoped to `(tenant_id, dashboard_id, subject, kpi_id)`. Existing dashboard readers receive no implicit KPI grants during migration.
- Resolve identities by Keycloak `sub`, not email or username. Derive tenant and scopes only from a verified token.
- Map explicit Keycloak API-client roles to the existing BI scopes in `Principal`; do not interpret generic OAuth `scope` as user entitlement.
- HTTP discovery/JWKS is permitted only for loopback development; HTTPS remains mandatory elsewhere.
- Never place Keycloak client secrets or tokens in `VITE_*`, source control, logs, localStorage, traces, or screenshots.
- Consult the approved Stitch screenshot and HTML for the exact management screen before UI changes. Any new permission controls absent from that reference require an updated Stitch screen approved before implementing those controls.
- Keep the existing scope rule: `catalog:read` is required with query and KPI-edit scopes. Individual dashboard/KPI authorization is an additional server-side check.

## Review Focus

- **Direct KPI/query requests without a dashboard context:** a shared reader must not bypass a per-dashboard grant by calling `/kpis/{id}` or `/queries` directly. Pin this with API tests that deny missing/wrong dashboard context.
- **Existing dashboard readers after migration:** do not copy dashboard reader rows into the KPI-grant table; assert that the dashboard stays visible but KPI identifiers and values remain hidden until the owner grants them.
- **Cross-tenant user selection:** directory responses and grant mutations must never expose or accept a subject from another tenant; assert generic not-found/denial behavior.
- **Dashboard edits after grant:** removing a widget or revoking dashboard access must invalidate its KPI access; re-adding a widget must not restore the former grant automatically.
- **Keycloak account/claim lifecycle:** missing `tenant_id`, wrong issuer/audience, expired token, disabled account, or unavailable JWKS must fail closed without leaking tokens or internal errors.

---

## File Map

- `knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md` — add traceable criteria for OIDC identity and individual KPI authorization.
- `knowledge-base/requirements/context-packs/RCP-004-us-006-acceso-real-kpi.md` — record approved owner-only grant decisions and remaining production gaps.
- `knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md` — document dashboard/KPI grant routes and enforcement for all direct access paths.
- `codebase/case-study/prepare.py` — create local Keycloak directory-client secret without printing or replacing existing secrets.
- `codebase/case-study/tests/test_prepare.py` — verify secret generation, preservation, permissions, and no secret output.
- `codebase/case-study/docker-compose.yml` — mount/import local `bi-lab` realm config and expose only loopback services; retain separate Keycloak schema.
- `codebase/case-study/keycloak/keycloak-start.sh` — import the realm on development startup.
- `codebase/case-study/keycloak/bi-lab-realm.template.json` — tracked realm template for SPA client, tenant mapper, and read-only directory service account.
- `codebase/case-study/README.md` — local setup, test accounts, environment variables, and safe reset/restart behavior.
- `codebase/backend/synapse_api/config.py` — OIDC, JWKS loopback-development exception, and Keycloak directory client settings.
- `codebase/backend/synapse_api/auth.py` — validated identity/scopes and OIDC auth behavior.
- `codebase/backend/synapse_api/keycloak_directory.py` — server-side token and tenant-filtered user directory adapter.
- `codebase/backend/synapse_api/database.py` — schema version 7 bootstrap.
- `codebase/backend/synapse_api/dashboard_kpi_migration.py` — additive v7 migration for dashboard-scoped KPI grants.
- `codebase/backend/synapse_api/dashboards.py` — owner grant/revoke and filtered dashboard DTO.
- `codebase/backend/synapse_api/catalog.py` — global owner catalog and dashboard-context detail authorization.
- `codebase/backend/synapse_api/serving.py` — require widget and grant context before resolving/returning query data.
- `codebase/backend/synapse_api/app.py` — directory, grant, detail, and query route wiring.
- `codebase/backend/synapse_api/schemas.py` — response/request contract changes, including dashboard context where required.
- `codebase/backend/tests/test_oidc.py` — signed identity, issuer/audience, tenant, and loopback JWKS coverage.
- `codebase/apps/bi-analytics/src/auth/keycloak.test.ts` — callback configuration and PKCE adapter behavior.
- `codebase/backend/tests/test_dashboard_kpi_access.py` — grant migration, owner-only changes, tenant isolation, hidden KPI, and direct query coverage.
- `codebase/backend/tests/test_keycloak_directory.py` — directory API behavior with mocked Keycloak responses and pagination/errors.
- `codebase/apps/bi-analytics/.env.example` — local OIDC issuer/client configuration; no secret values.
- `codebase/apps/bi-analytics/src/auth/keycloak.ts` — SPA Keycloak adapter setup with code flow and PKCE S256.
- `codebase/apps/bi-analytics/src/pages/LoginPage.tsx` and `src/app/routes.tsx` — login callback/session routing and safe return path.
- `codebase/apps/bi-analytics/src/pages/KpiWorkspace.tsx` — show a permission state instead of presenting a denied catalog as empty.
- `codebase/apps/bi-analytics/src/adapters/apiRepository.ts` — in-memory token provider, dashboard context, grants, and KPI detail calls.
- `codebase/apps/bi-analytics/src/hooks/useWorkspaceRepository.ts` — owner catalog loading and shared dashboard data loading.
- `codebase/apps/bi-analytics/src/components/DashboardInteractive.tsx` — owner-only per-reader KPI grant controls after Stitch approval.
- `codebase/apps/bi-analytics/src/components/DashboardInteractive.test.tsx` — grant UI states and accessible interaction.
- `codebase/apps/bi-analytics/src/adapters/apiRepository.test.ts` — OIDC token use and request context.
- `docs/ux/us-006/README.md` — approved source references and any new Stitch permission-control screen.
- `docs/ux/us-006/casos-prueba-manual.md` — manual Keycloak login, grant, revoke, tenant isolation, and direct-route cases.
- `docs/ux/us-006/verification.md` — local verification, captures, and visual deviations.
- `codebase/backend/README.md` — API local OIDC startup and test configuration.
- `knowledge-base/index.md` and `knowledge-base/changelog.md` — artifact references and dated decision/implementation record.

## Tasks

### Task 1: Confirm the Stitch contract for KPI grants

**Files:**
- Review: `docs/ux/us-006/README.md`
- Reference: Stitch management node `4ef768272bbf47b2a57ec49ec038850d`; HTML `097af4547d4a405ba42dc9714f98141c`; capture `bec713ee45194af494f283622feba7a8`.
- Update if needed: `docs/ux/us-006/README.md`

- [ ] Open the exact management screenshot and HTML and locate the current reader-sharing controls.
- [ ] Confirm whether that screen shows a person-to-KPI selector. If absent, create/update the Stitch screen and record the exact node, HTML, and capture in the UX README.
- [ ] Obtain user approval of any changed screen before implementing permission UI; backend tasks may proceed while this gate is pending.

**Deliverable:** approved visual reference for the owner-only per-KPI grant controls, or an explicit implementation blocker before UI changes.

### Task 2: Provision the local Keycloak realm and clients

**Files:**
- Create: `codebase/case-study/keycloak/bi-lab-realm.template.json`
- Modify: `codebase/case-study/prepare.py`
- Test: `codebase/case-study/tests/test_prepare.py`
- Modify: `codebase/case-study/docker-compose.yml`
- Modify: `codebase/case-study/keycloak/keycloak-start.sh`
- Modify: `codebase/case-study/README.md`

- [ ] Add a test for `prepare.py` proving it creates the new directory-client secret when missing, preserves an existing value, uses restrictive permissions, and never prints the secret.
- [ ] Add the `bi-lab` realm template with an exact loopback SPA client using Authorization Code, PKCE S256, and exact redirect/origin allowlists.
- [ ] Add a protocol mapper for the signed `tenant_id` claim and a separate confidential backend directory client with service account enabled.
- [ ] Define explicit API-client roles corresponding to `catalog:read`, `queries:execute`, `dashboards:read`, and `dashboards:write`; only owner test users receive `dashboards:write`.
- [ ] Grant the directory service account only `query-users` and `view-users`; do not grant `manage-users` or role-management permissions. Keep the realm dedicated to BI because `view-users` can see users throughout that realm.
- [ ] Generate/import the realm using a secret-backed local file that is ignored by Git. Do not embed generated secrets in the tracked template or print them.
- [ ] Update `docker-compose.yml` and startup script to import the realm idempotently without deleting existing PostgreSQL data or changing the `keycloak` schema.
- [ ] Document how to create separate owner and reader accounts with different `tenant_id` values and scopes, without reusing the Keycloak bootstrap admin for application tests.
- [ ] Run the preparation unit test and verify Compose config and OIDC discovery/redirect metadata after startup.

**Deliverable:** local Keycloak can issue API-audience tokens with stable subject, tenant and scopes, and the backend can read tenant-filterable users through a restricted service account.

### Task 3: Connect the SPA and API to Keycloak OIDC

**Files:**
- Create: `codebase/apps/bi-analytics/src/auth/keycloak.ts`
- Create: `codebase/apps/bi-analytics/src/auth/keycloak.test.ts`
- Modify: `codebase/apps/bi-analytics/package.json` and `package-lock.json`
- Modify: `codebase/apps/bi-analytics/.env.example`
- Modify: `codebase/apps/bi-analytics/src/pages/LoginPage.tsx`
- Modify: `codebase/apps/bi-analytics/src/auth/loginConfig.ts`
- Modify: `codebase/apps/bi-analytics/src/app/routes.tsx`
- Modify: `codebase/apps/bi-analytics/src/adapters/apiRepository.ts`
- Modify: `codebase/apps/bi-analytics/src/hooks/useWorkspaceRepository.ts`
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/auth.py`
- Modify: `codebase/backend/tests/test_oidc.py`
- Modify: `codebase/backend/README.md`

- [ ] Write backend tests for missing/invalid tenant claim, wrong issuer/audience, expired token, wrong JWKS key, and rejected remote HTTP JWKS.
- [ ] Add the Keycloak SPA adapter with Authorization Code + PKCE S256; keep access tokens in memory and never put them into `localStorage` or URLs.
- [ ] Implement callback state, nonce, safe same-origin return path, login error, and session-expiry handling; ensure tokens are only sent to the BI API origin.
- [ ] Inject the adapter’s access-token getter into `ApiRepository`; keep development sessions available only when `BI_AUTH_MODE=development` and never silently fall back from OIDC.
- [ ] Validate `iss`, `aud`, signature, `exp`, `iat`, `sub`, `tenant_id`, and `name` on every API request. Translate only known roles in the configured API client’s `resource_access` claim into the approved BI scope set.
- [ ] Allow HTTP JWKS only when `BI_ENVIRONMENT=development` and the JWKS host resolves to explicit loopback; reject HTTP for all other environments/hosts.
- [ ] Update allowed origins and local environment docs for the actual UI/API ports.
- [ ] Run focused frontend auth tests, backend OIDC tests, typecheck, and build.

**Deliverable:** a real Keycloak login yields a verified `Principal`; invalid sessions fail closed, and development auth cannot be used in OIDC mode.

### Task 4: Add directory lookup and dashboard-scoped grant persistence

**Files:**
- Create: `codebase/backend/synapse_api/keycloak_directory.py`
- Create: `codebase/backend/synapse_api/dashboard_kpi_migration.py`
- Create: `codebase/backend/tests/test_keycloak_directory.py`
- Create: `codebase/backend/tests/test_dashboard_kpi_access.py`
- Modify: `codebase/backend/synapse_api/config.py`
- Modify: `codebase/backend/synapse_api/database.py`
- Modify: `codebase/backend/synapse_api/dashboards.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Modify: `codebase/backend/synapse_api/schemas.py`

- [ ] Test schema v6 to v7 migration on a copy with dashboards, widgets, and readers; assert existing data remains and no KPI grants are inferred.
- [ ] Create `dashboard_kpi_readers(tenant_id,dashboard_id,subject,kpi_id,granted_by,granted_at)` with a composite primary key and tenant/dashboard/widget foreign keys; use a transaction and `ON DELETE CASCADE` or explicit cleanup so removed widgets cannot retain grants.
- [ ] Keep migration additive and update the supported schema version check; reject future schema versions before DDL.
- [ ] Implement `KeycloakDirectory` server-side using client credentials from a secret file, short token lifetime cache, bounded timeout, pagination, and normalized provider failures.
- [ ] Filter user records by exact `tenant_id` server-side and return only `sub` and display name. Never expose the Admin API or client secret to the browser.
- [ ] Replace the synthetic `lab_readers` route in OIDC mode with the Keycloak directory adapter; retain synthetic users only in development/test mode.
- [ ] Add owner-only, same-tenant grant operations with `If-Match`: `PUT/DELETE /api/v1/dashboards/{dashboardId}/readers/{subject}/kpis/{kpiId}`.
- [ ] Extend `GET /api/v1/dashboards/{dashboardId}/readers` to return each shared reader and their granted KPI IDs; reject attempts to grant a KPI absent from that dashboard or a subject outside the tenant.
- [ ] Add audit events for grant/revoke with actor, target subject, dashboard, KPI, tenant, and request ID; never include token or client secret.
- [ ] Add `target_subject` to the BI audit record in the same additive migration so grant/revoke events preserve actor and recipient as separate fields.
- [ ] Test owner allowed; another owner, reader, missing owner scope, stale `If-Match`, cross-tenant subject, missing widget, duplicate grant, and revoke/regrant behavior.

**Deliverable:** persisted, auditable grants tied to an existing dashboard widget and an authenticated same-tenant Keycloak subject.

### Task 5: Enforce KPI permissions on every API path

**Files:**
- Modify: `codebase/backend/synapse_api/dashboards.py`
- Modify: `codebase/backend/synapse_api/catalog.py`
- Modify: `codebase/backend/synapse_api/serving.py`
- Modify: `codebase/backend/synapse_api/app.py`
- Modify: `codebase/backend/synapse_api/schemas.py`
- Modify: `codebase/backend/tests/test_dashboard_kpi_access.py`
- Modify: `codebase/backend/tests/test_dashboard_sharing.py`
- Modify: `knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md`

- [ ] Add regression tests that prove an ungranted KPI is absent from a shared dashboard, cannot be fetched by direct KPI ID, cannot be queried directly, and reveals no name, ID, definition, version, count, lineage, or value.
- [ ] Filter `Dashboard.kpi_ids`, `model_versions`, and `visualizations` by active per-dashboard grants for non-owners; preserve full owner view for dashboard maintenance.
- [ ] Require dashboard context for shared readers on direct KPI detail and semantic query requests; verify dashboard share, tenant, widget membership, and KPI grant before resolving KPI metadata or data.
- [ ] Restrict the unscoped catalog listing and unscoped KPI details to owner identities with required scopes; shared readers obtain KPI details only with dashboard context proving widget membership and an active grant.
- [ ] Require `dashboardId` for every semantic query from a shared reader and reject absent or wrong-dashboard context before resolving the KPI. Preserve the owner’s existing scoped standalone query path.
- [ ] Present global catalog denial as a clear permission state for shared readers; do not render it as a successful empty catalog.
- [ ] Apply the same rule to metadata/lineage and query responses; keep missing KPI and unauthorized KPI indistinguishable where the existing API contract hides resources.
- [ ] Revoke KPI access immediately for subsequent API requests; revoking dashboard reader access denies all its KPI requests; removing a widget deletes its contextual grant and re-adding it does not restore it.
- [ ] Update API-001 examples, response shape, status codes, scopes, and compatibility notes.
- [ ] Run the complete backend suite and confirm the existing optional PostgreSQL test remains opt-in.

**Deliverable:** every API route that can reveal a KPI or its result enforces the dashboard share plus KPI grant, not just UI visibility.

### Task 6: Add owner grant controls to the dashboard UI

**Files:**
- Modify: `codebase/apps/bi-analytics/src/adapters/apiRepository.ts`
- Modify: `codebase/apps/bi-analytics/src/hooks/useWorkspaceRepository.ts`
- Modify: `codebase/apps/bi-analytics/src/components/DashboardInteractive.tsx`
- Modify: `codebase/apps/bi-analytics/src/components/dashboard-interactive.css`
- Modify: `codebase/apps/bi-analytics/src/components/DashboardInteractive.test.tsx`
- Modify: `codebase/apps/bi-analytics/src/adapters/apiRepository.test.ts`
- Gate: Task 1’s approved Stitch reference

- [ ] Add API repository methods for reader/KPI grants, include dashboard context in KPI detail and query requests, and refresh ETag/version after every grant change.
- [ ] Add component tests for owner selecting a same-tenant reader, selecting only KPIs on that dashboard, granting, revoking, loading/error/empty states, and stale version handling.
- [ ] Preserve the exact Stitch management composition, spacing, type, color, controls, and responsive behavior. Implement visual changes only after Task 1 is approved.
- [ ] Ensure a shared reader sees only granted widgets, no grant controls, and the existing safe empty state when all widgets are unauthorized.
- [ ] Ensure a shared reader opening `/explorar` directly receives an explicit permission state and no KPI metadata; do not show a synthetic “no KPI exist” state.
- [ ] Ensure removing dashboard share or a per-KPI grant refreshes state and prevents stale KPI values from being treated as current.
- [ ] Run focused component tests, accessibility checks for the affected management view, typecheck, and build.

**Deliverable:** the dashboard owner can grant and revoke KPI access using the approved sharing screen, while readers see only their authorized widgets.

### Task 7: Integrated local verification and handoff

**Files:**
- Modify: `docs/ux/us-006/casos-prueba-manual.md`
- Modify: `docs/ux/us-006/verification.md`
- Modify: `docs/ux/us-006/README.md`
- Modify: `codebase/backend/README.md`
- Modify: `codebase/case-study/README.md`
- Modify: `knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md`
- Modify: `knowledge-base/index.md`
- Modify: `knowledge-base/changelog.md`

- [ ] Add manual cases for owner/reader login, tenant-matched directory, dashboard share plus KPI grant, partial/empty grants, direct-route denial, revoke on next request, wrong tenant, and OIDC failure.
- [ ] Update US-006 acceptance criteria with the approved Keycloak identity, dashboard-context grant, owner-only authority, tenant isolation, and no-leak behavior.
- [ ] Run backend, frontend, API/browser integration, typecheck, and build checks with isolated local data; do not use or reset the user’s persistent lab database.
- [ ] Run the manual path using separate owner and reader accounts in the dedicated realm; record each result and evidence individually. No credentials or tokens in evidence.
- [ ] Capture actual dashboard management and reader states in desktop and mobile and compare them with the exact approved Stitch screenshot and HTML. Record any residual deviations; do not claim exact visual equivalence without evidence.
- [ ] Verify Keycloak’s own tables stay in schema `keycloak`, BI grants stay in the BI database, and normal Compose restart preserves both.
- [ ] Record remaining product/production gates: tenant governance, deactivation latency, production persistence/HA, and support distribution.

**Deliverable:** reproducible local manual cases, integration evidence, and an explicit non-production boundary.

## Execution Notes

- Keep each task independently reviewable and commit only files belonging to that task; preserve unrelated workspace changes.
- The Keycloak Admin REST API directory client requires `query-users` and `view-users`, but no `manage-users`; the dedicated realm prevents it from reading unrelated populations. See [Keycloak Server Administration Guide 26.8](https://www.keycloak.org/docs/26.8.0/server_admin/).
- The SPA adapter uses a public client and PKCE S256; no client secret belongs in browser configuration. See [Keycloak JavaScript adapter](https://www.keycloak.org/securing-apps/javascript-adapter).
- No production deployment, realm federation, global KPI grants, or central BI permission administration is part of this plan.
