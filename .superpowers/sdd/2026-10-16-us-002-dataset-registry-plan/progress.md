# SDD ledger — plan: docs/superpowers/plans/2026-10-16-us-002-dataset-registry-plan.md

## Authorization and workspace

2026-10-16: user answered «si» to approve execution here (Native/inline).
Specs API-002, DM-002, IMD-001 and UX reviewed. Productive gates remain unchanged.
Ruling: Work in the approved current workspace without commits/worktree — repository has no HEAD and all existing files are user-owned untracked content; the approved plan explicitly allows local checkpoints — cost if wrong: weaker isolation and no Git rollback; retain this ledger and never add unrelated files.
Ruling: Use PowerShell/apply_patch equivalents of sdd-workspace/task-start/task-done — provided helpers require Bash and HEAD, neither usable here — cost if wrong: manual checkpoint bookkeeping; record exact commands/results per task.

## Preflight interfaces

| Producer → consumer | Shared interface | Finding |
| --- | --- | --- |
| 1 → 3/4/5/6 | strict DTOs, missing_metadata, ApiError.details | Consistent; only whitelisted field paths may reach HTTP. |
| 2 → 3/4 | tenant composite observation FK and active connection | Consistent; v3 must be atomic and reject future version before DDL. |
| 3 → 4 | ObservedObject / ResolvedOrigins | Consistent; technical snapshot only, exact identifier values. |
| 4 → 5 | DatasetService create/get/list/update | Consistent; replay original response and ETag version mandatory. |
| 5 → 6/7 | routes, scopes, error envelope | Consistent; admin-only local grants, read scopes preserved. |
| 6 → 7 | repository, shared observation types, cancellable GET hook | Consistent; immutable edit origin, preserve retry key. |
| 7 → 8 | UI routes and observed-source deep link | Consistent; dedicated 8002/5182, no shared service shutdown. |

## Baseline

- Backend: uv run --extra test --frozen --cache-dir TEMP/synapse-bi-uv-cache pytest -p no:cacheprovider → 35 passed, 1 skipped (opt-in PostgreSQL), existing Starlette httpx deprecation warning.
- Frontend: elevated retry → 17 files / 32 tests passed; existing Vite CJS and Node localStorage warnings.

## Tasks

Task 1: complete (local checkpoint; RED missing module; tests: full pytest -p no:cacheprovider → 59 passed, 1 skipped including 17 policy cases).
Task 2: complete (local checkpoint; RED 7 expected failures; full pytest → 59 passed, 1 skipped; migration rollback/future schema/new-v1-v2 verified).
Task 3: complete (local checkpoint; RED missing resolver; full pytest → 64 passed, 1 skipped; 5 observation tests, no connector invocation, tenant checks, source-only composite PK).
Task 4: complete (local checkpoint; RED missing service; full pytest → 74 passed, 1 skipped, 10 service tests include actual concurrent SQLite writers, expired replay, original response after edit, 56-row filter-before-page and backup restore).
Task 5: complete (local checkpoint; RED 6 absent routes/middleware; full pytest → 80 passed, 1 skipped; scope matrix, headers, 262144/262145 actual bytes, chunked body, redaction and OpenAPI verified).
Task 6: complete (local checkpoint; RED 4 missing-module suites; GREEN 8 new tests and full existing+new suite excluding not-yet-implemented wizard → 40 passed. Test cleanup fixed to match repository's explicit cleanup convention; TypeScript optional fixture argument corrected).
Task 7: complete (local checkpoint; RED missing module; GREEN 6 wizard tests and full frontend → 46 passed; npm run typecheck and npm run build exit 0).
Task 8: complete (local checkpoint; real integration and regression executed, one independent review, Important findings fixed in one TDD pass, final backend/frontend/build/types/dataset E2E green; one Minor deferred).

## Final independent review

One fresh-context read-only review by Descartes completed. No Critical; Important 1–4 accepted
after grading effects on consistent representations and user edit/recovery state. One TDD
fix pass in progress. Full findings: final-review.md. Declined to judge: []. No re-review.
Final: minor (deferred): UI selection above 500 columns lacks an early limit message; API rejects it safely with 422.
Final fix pass evidence (full-suite checkpoint pending):
- Finding 1: test_reads_one_committed_snapshot_during_concurrent_update[get/list] RED (hybrid columns / total=0) → GREEN after explicit BEGIN in dataset GET/list, no changes to unrelated readers.
- Finding 2: unmounted-form delayed save RED (navigated to /datasets/d1) → GREEN with lifecycle guard.
- Finding 3: exclusive 412 reload RED (name input still editable) → GREEN; reload uses pending lock and lifecycle guard; departed reload response also covered.
- Finding 4: normalized-equivalent retry RED (different UUID for identical normalized payload) → GREEN; retain attempt until normalized submitted content changes, canonicalize selection and prepared inputs.
Final: fixed mixed-version GET/list — test_reads_one_committed_snapshot_during_concurrent_update[get/list] RED→GREEN, backend suite 84/84 with PostgreSQL (83 passed + 1 opt-in skip without it).
Final: fixed departed-form navigation — delayed unmounted save test RED→GREEN, frontend suite 50/50.
Final: fixed 412 reload edit race — exclusive reload test RED→GREEN (and departed reload covered), frontend suite 50/50.
Final: fixed normalized replay key loss — normalized-equivalent/reordered selection retry test RED→GREEN, frontend suite 50/50.

## Final verification and handoff

2026-10-16 — Human validation: user stated «Conforme con validacion de US-002. Continuar con US-003» (UX-US002-D04 in docs/ux/us-002/README.md). Local validation accepted; no productive governance approval implied. Next discovery tracked in RCP-002; do not reopen this implementation or assume semantic rules approved. Deferred >500-column UI notice remains documented.

- uv run --extra test --frozen --cache-dir TEMP/synapse-bi-uv-cache pytest -p no:cacheprovider → 83 passed, 1 opt-in skip; with BI_TEST_POSTGRES=true → 84 passed.
- npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=15000 → 22 files / 50 passed.
- npm run typecheck → exit 0; npm run build → exit 0 (101 modules).
- After fixes: npm run test:datasets → 3 passed (1.2m), real PostgreSQL; axe and responsive assertions green. Screenshots regenerated.
- Other fresh regressions in this execution: sources 2/2, API dashboards 3/3, smoke 7/7, on isolated ports as recorded above (before the scoped dataset review fixes).
- Existing warnings retained: Starlette TestClient/httpx deprecation, Vite CJS API, experimental Node localStorage, Playwright NO_COLOR/FORCE_COLOR. No test failures remain.
- One independent review only; no re-review claimed. Important findings verified by author RED→GREEN and whole unit suites, as planned.
- Workspace and ledger retained: no Git HEAD, no stage/commit/merge/push, no cleanup of user-owned files or other plan directories. Production gates and US-003 unchanged.
- To use with an already-running older backend: first take a consistent SQLite backup and preserve the source key separately; restart the normal API to load v3/routes, reload UI and open /datasets. User-owned services were not stopped.

## Integration evidence

### Corrección visual de /datasets/nuevo — 2026-10-17

- Confirmación humana: reproducir los dos pasos Stitch ef64675d43b048c0a7ffd9d08a218fd7 y 7e6873489b214335aa81c7be53720410, conservando dos pasos, clasificación libre e identificadores del sistema. Referencias y límites en docs/ux/us-002/registration-visual-conformance.md; mandato ampliado en AGENTS.md.
- Aplicados tarjetas de tipo, tabla de objetos observados, columnas con restricciones reales y selección total limitada a 500, resumen lateral, tarjetas de identificación/gobierno/frescura/linaje y acciones inferiores. Sin datos ficticios, introspección nueva ni cambios de backend/API. Se conservan borradores, idempotencia, bloqueos y recuperación 412.
- RED: nueva prueba no encontraba tabla de objetos; GREEN tras implementación. Se corrigieron numeración decorativa en nombres accesibles y contraste detectado por axe, sin debilitar las pruebas.
- Verificación del rediseño: npm test -- --reporter=dot --maxWorkers=1 --minWorkers=1 --testTimeout=15000 → 78 passed / 32 archivos, 162.74 s. npm run test:datasets → 4 passed, 56.4 s, PostgreSQL de laboratorio; axe/overflow 1440 y 390 px. Typecheck exit 0; build exit 0, 122 módulos, 6.16 s. Backend sin cambios, suite Python no repetida.
- Cuatro capturas desktop/móvil de origen/metadatos inspeccionadas frente a Stitch y preservadas en screens/c7925c58-01-origin.png, screens/c7925c58-01-origin-mobile.png, screens/c7925c58-02-metadata.png y screens/c7925c58-02-metadata-mobile.png.
- Revisión independiente read-only de Kepler: sin Critical/Important. Minor aceptado: pie decía borrador también en edición. Regresión añadida, fallo observado y corregido a «Cambios pendientes de guardar»; once pruebas del formulario repetidas → 11 passed, 14.04 s. La suite completa, E2E y capturas anteriores preceden sólo a este ajuste textual. Sin segunda revisión independiente.
- Aplicación 5186 comprobada con radiogroup y resumen lateral. Servicios del usuario conservados; sin commit/push ni cambios a credenciales/bases manuales. Aceptación visual humana pendiente; no se declara igualdad píxel a píxel.

### Corrección visual Stitch — 2026-10-17

- Usuario autorizó «aplicar» la pantalla `725195c5c57a461d8db992a49f6afc5d`, manteniendo separados registro y completitud. Mandato actualizado en AGENTS.md y referencia/límites en docs/ux/us-002/visual-conformance.md.
- Se consultaron HTML y captura originales y se compararon capturas reales desktop/móvil. Aplicados resumen de tres tarjetas, filtros, seis columnas, gobierno declarado, Ver ficha y navegación de administración. No se insertaron ejemplos en la base manual ni se modificaron API, backend, permisos o formularios.
- RED: dos pruebas nuevas detectaron ausencia de resumen/lectura de metadatos; GREEN: seis pruebas específicas aprobadas. Una comprobación de tipos detectó condición redundante en navegación, corregida. El E2E detectó input preparado igual al output (fixture corregido a dim_date, regla intacta) y etiqueta exacta de Registro ausente (reproducida 0 exacto/1 parcial y corregida con aria-label, sin relajar la prueba).
- Verificación final: frontend **77 passed / 32 archivos**, 183.09 s, un worker/testTimeout 15000; typecheck exit 0; build exit 0, 119 módulos, 5.03 s. Navegador datasets **4 passed**, 57.2 s, PostgreSQL real de laboratorio sólo lectura. Regresión de navegación/catálogo semántico **3 passed**, 46.0 s, puertos aislados 8009/5189.
- axe/overflow 1440/390 y navegación a ficha verificados. Capturas finales inspeccionadas y preservadas en screens/0ba25bcb-06-stitch-catalog.png y screens/0ba25bcb-06-stitch-catalog-mobile.png. Los datos de las capturas pertenecen exclusivamente a SQLite E2E.
- Revisión independiente read-only: sin hallazgos Critical, Important ni Minor sustentados; fidelidad visual y resultados comprobados por el agente principal. El backend no cambió; no se repitió su suite Python.
- Aplicación activa 5186 verificada con resumen y filtro Registro exacto; servicios del usuario no detenidos. Sin commit/push, sin borrado de bases. Aceptación visual humana pendiente; no se declara equivalencia píxel a píxel.

- npm run test:datasets → 3 passed (1.3m), real PostgreSQL (12 tables/4 views; fact_sales 16 columns/6 FK). Lost creation response after commit and retry yields one dataset. New browser context recovers it; registration, stale edit conflict preserving inputs, prepared/Medallion, invalid references, tenant and KPI/snapshot invariance verified.
- axe: zero violations in origin, metadata, detail, edit and catalog at 1440px and 390px; no document overflow. Keyboard tabs verified. Screenshots without secrets: codebase/test-results/dataset-screens.
- BI_TEST_POSTGRES=true full backend → 82 passed, existing Starlette httpx warning. New app instance recovers and edits with connector deliberately unavailable; no shared Docker stopped.
- Fresh regression: npm run test:sources → 2 passed (8004/5184); npm run test:api-integration -- --workers=1 → 3 passed (8003/5183); npm run test:smoke -- --workers=1 → 7 passed.
- Ruling: Add optional test ports and use the backend venv in existing browser configs — default ports may be user-owned/stale and system Python differs from locked venv — cost if wrong: regression-test configuration only; default ports unchanged. This run uses fresh source 8004/5184 and dashboard 8003/5183 services.

Ruling: Preserve SRC-001 constraint keys kind/referencedTable rather than invent type/referencedObject — real snapshots and shared frontend types use these names — cost if wrong: DTO adjustment before external release.
