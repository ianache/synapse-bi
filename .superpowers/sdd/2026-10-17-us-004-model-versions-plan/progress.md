# SDD ledger — plan: docs/superpowers/plans/2026-10-17-us-004-model-versions-plan.md

## Authorization / workspace

2026-10-17: user «plan aprobado y los contratos». Execution Native in isolated
worktree, fresh independent final review. Parent/master user changes preserved.
Branch feat/us-004-model-versions, initial HEAD ef910f3. Forty-one relevant baseline
files copied byte-for-byte with SHA256 before/after source and destination check;
no secrets, DB or other plan ledgers copied. node_modules junction shares installed
dependencies; never delete recursively. Root backend venv used without copying secrets.

Ruling: use PowerShell/apply_patch ledger equivalents — Bash helper unavailable
in this Windows setup — cost if wrong: manual task bookkeeping; commands/results recorded.
Ruling: preserve copied UI/docs in a separate baseline commit before US-004 tasks —
HEAD lacks approved Stitch fixes — cost if wrong: extra baseline commit, no parent changes.

## Preflight interfaces

| Producer → consumer | Interface | Finding |
|---|---|---|
| T1 → T2/T3/T4 | strict DTO, capture structure, FK tenant/domain | API-004/DM-004 consistent; pending service tests |
| T2 → T3 | capture_catalog/capture_digest/compare_captures | canonical order and whitelist required |
| T3 → T4/T5 | ModelDetail/Preview/Draft/Comparison | revision/sequence separated; digest not authority |
| T4/T5 → T6 | API methods/DTOs/AbortSignal/ETag | route and repository names fixed in plan |
| T6 → T7 | Stitch screens and approved five exceptions | desktop references read at task start; mobile evidence required |

## Tasks

- Baseline backend exit0 (147 passed/1 PostgreSQL opt-in skipped inferred from 148 collected); frontend32files/78passed, 195.21s, Vite CJS/localStorage warnings only.
- T1 RED:17 failures (module absent/table absent/schema4 instead of5), two preexisting invariants passed. Focused GREEN24passed.
- T1 full suite initially3failed/163passed/1skip: legacy dataset upgrade fixtures still expected current4. Ruling: update only current-version expectation to5 in test_datasets_migration (alongside semantic test planned) — v5 approved — cost if wrong: schema-version assertion; original preservation/integrity tests retained.
- Baseline commit282457b stores the41 transferred UI/doc files separately; master unchanged.
- Task 1: complete (RED17fail/2pass → focused24pass; full backend166passed/1PGskip,51.58s; no DB manual migrated). DTOs/migration only; endpoints not yet present.
- Task 2: complete (RED5missing modules → focused5passed; full backend171passed/1PGskip,97.59s). Large real catalog hits >1000 components and >8MiB without truncation. Shared-component fixture deduplicates a measure, despite historical test name mentioning dimension; same algorithm applies both kinds. No source connector invoked by production paths.
- Task 3: complete (RED7missing service → focused7passed; full-suite checkpoint initially178pass/7future-API-RED/1skip because test collection overlapped T4 test creation; no legacy failure). Full green confirmed with T4:185passed/1skip,71.23s.
- Task 4: complete (RED7HTTP404 → focused7passed,6.83s; full backend185passed/1PGskip,71.23s). Routes, scope matrix, current tenant, preview/PUT/clone/history/compare and real byte boundaries green; no publication paths.
- Ruling: T5 route wiring moves alongside actual T6 workspace — avoids placeholder product screens — cost if wrong: T5 completion delayed until route integration; adapter can be verified independently.
- Task 5: complete (adapter RED missing import →3passed; routing RED missing active model link →GREEN; full frontend90passed/37files,145.60s; typecheck/build exit0). Adapter commit d00758d; route/shell with T6 commit821df60 per ruling above.
- T6 functional tests8passed including arrow-key RED→GREEN; exact source desktop screenshots inspected again. Five authorized exceptions applied. Full frontend90passed/37files. Desktop/mobile runtime evidence pending T7; no fidelity claim.
- T7 in progress: isolated models E2E config8010/5190, unique SQLite; venv junction shares existing interpreter only, never delete recursively. No root services stopped. One tool operation returned after an anomalous ~2h wait; checked files/processes before continuing, no duplicate patch or test claimed.
- T7 first browser run:2passed/1failed at exact getByLabel selector; page snapshot showed available domain. Correct selector to combobox accessible name; repeat3passed35.9s, then3passed35.0s with dedicated output directory.
- Visual inspection found mobile sticky footer covering form and comparison confirmation outside matrix column. Browser regression RED reproduced both (sticky instead of static; action right1395.94 vs matrix1072.94). Minimal responsive/layout fix; full models browser4passed51.5s, axe zero at1440/390 and document overflow zero. Fresh captures inspected after fix. Exact visual acceptance not claimed: see docs/ux/us-004/verification.md.
- T7 regressions: semantic-catalog API8011/UI5191 uniqueSQLite →3passed40.5s; API8012/UI5192 worktree-only browser-tests.db →3passed25.2s. Failed command npm run test:api was script-name error, replaced with npx playwright test --config playwright.api.config.ts.
- Ruling: add isolated smoke wrapper on5193 —4173 already occupied, do not reuse unknown server— cost if wrong: extra test configuration only. Smoke7passed27.1s; source/dataset browser and PG opt-in omitted because they need laboratory secrets not transferred; no credentials read/copied.
- Final verification in progress: backend full suite exit0/onePGskip; frontend full suite running; typecheck/build exit0 before layout fix, repeat required. Independent read-only whole-branch reviewer Russell dispatched on282457b..4874ec5; no implementation delegation or parent mutations.
- Final review: Russell returned two Important lifecycle findings, no Critical, one Minor pagination. Review and declined-to-judge resolutions recorded in docs/ux/us-004/code-review.md. No second reviewer.
- Final: fixed 412/uncertain PUT recovery and confirmed-response rendering — three workspace regressions RED3failed→GREEN3passed. Selection retained while refreshing base revision; uncertain commit reconciled by stored digest+selection; confirmed result hydrates destination without mandatory GET. Full suite final in progress.
- Final: Ruling: promote history pagination finding Minor→Important — unbounded allocation of8MiB captures can exhaust memory in ordinary long histories — cost if wrong: one SQL pagination query/count and focused regression, no schema/API change.
- Final: fixed history materialization — real SQLite row-factory observation RED6captures for page2→GREEN≤2, total/order preserved; full backend186passed/1PGskip44.25s.
- Final: Ruling: Stitch/mobile and post-review visual changes judged by author with real captures/browser tests — independent reviewer deliberately excluded visual judgment — cost if wrong: residual design discrepancies remain open, no exact conformity claim.
- Final: Ruling: publication/certification/deprecation/retirement remain excluded — approved first increment only — cost if wrong: later lifecycle capability still unavailable.
- Final: Ruling: published SemVer remains null — drafts are not publication — cost if wrong: no published semantic-version consumption in this increment.
- Final: Ruling: SQL/formulas/US005/Gold excluded — metadata-only approved boundary — cost if wrong: no query engine delivered.
- Final: Ruling: production role/IAM assignments remain gates — laboratory personas do not authorize real data — cost if wrong: production deployment blocked.
- Final: Ruling: retention/purge/deployment remain gates — no approved operational policy — cost if wrong: production deployment blocked.
- Final: Ruling: live PostgreSQL/source coverage omitted — no secrets transferred and metadata-only implementation — cost if wrong: external integration regression not exercised this session.
- Final: Ruling: baseline282457b excluded from new-change attribution — preserved user work — cost if wrong: preexisting code not fully re-audited.
- Final minors: none deferred (history finding regraded/fixed). Known visual differences documented, acceptance open; T6/T7 not declared fully closed. Workspace/ledger retained under plan's no-cleanup constraint, no merge/push.
- Final verification after fix pass: backend186passed/1PGskip44.25s; frontend93passed/38files191.99s; models browser4passed41.4s; typecheck/build exit0; git diff --check exit0. Root8006/5186 still listening. No failures hidden or assertions omitted; intermediate RED/typecheck-test-option failures corrected and reverified.
- Handoff: functional first increment committed locally; exact Stitch conformity and source/dataset/PG laboratory coverage remain open in docs/ux/us-004/verification.md. No automatic integration, publication, cleanup, or full US004 completion claimed.

## Continuación solicitada 2026-10-17

- User pidió continuar y confirmó los enlaces exactos de Stitch. Reconsultados los
  cuatro get_screen/HTML de listado17a4, creacióna24b, detalle1a69, comparaciónfa8b.
  027921 conserva condición de antecedente; no duplica el editor de creación.
- RED ModelsChrome:3failed (sin ID/procedencia técnica, sin identificación del aviso,
  sin agrupación General/Gobernanza). GREEN3passed después de fichas reales de
  dependencias/origen, título de aviso y shell condicional sólo para models.
- Ruling: alojar tipografías localmente con alias CSS scoped y OFL distribuida —
  las variables existentes no cargaban los archivos y E2E usaba fallback — cost if
  wrong: cuatro activos WOFF2 (~104kB) y atribución, sin dependencia nueva ni cambio
  de fuentes en otros módulos. Prueba navegador RED sin font faces→GREEN con CDN bloqueado.
- Paleta/jerarquía de HTML exacto: lista neutra/azul, creación ámbar, detalle rojo;
  cabecera de detalle en tarjeta, rail de comparación segmentado, cuatro tarjetas
  de diff/seguridad, resumen técnico con IDs/origen/digest reales. UUID/fechas/faltantes
  siguen siendo valores de API, nunca datos empresariales inventados del mockup.
- UX-US004-D02 aprobada explícitamente: conservar control compacto de selección
  de KPI junto a comparación; matriz y resumen intactos. No es excepción inferida.
- Laboratorio autorizado por usuario: leer credencial existente desde archivo
  principal en ejecución, sin mostrarla ni copiar archivo; PostgreSQL no reiniciado
  ni tablas Gold modificadas. Añadidos BI_LAB_READER_PASSWORD_FILE y puertos/DB de
  test configurables; sin cambios de configuración productiva.
- Ruling: parametrizar rutas/puertos/bases de pruebas existentes — ejecutar el mismo
  laboratorio desde worktree sin copiar secretos ni reutilizar servicios del usuario —
  cost if wrong: opciones adicionales de harness; defaults existentes preservados.
- Evidencia laboratorio: pytest real_postgres_observation1passed2.07s, sources2passed1.0m
  en8013/5194, datasets4passed2.9m en8014/5195; SQLite UUID por suite y reusefalse.
  Suite backend completa con opt-in y frontend final siguen en ejecución.
- Primer navegador actualizado5passed2.4m, axe/overflow desktop1440/móvil390;
  se añade captura de listado con filas reales además del estado vacío para comparar
  con Stitch. No se repite revisión independiente ya completada ni las correcciones T1–T5.
- La nueva navegación de evidencia por lista detectó una carrera del propio test:
 4passed/1failed, ID obtenido antes de completar clone (URL de modelo todavía sin
  borrador). Esperar etiqueta visible Borrador2 antes de leer URL; repetición5passed2.8m.
- La referencia de detalle incluye historial bajo contenido. Regresión StitchDetail
  RED missing history heading→GREEN1passed14.09s; historial visible sin tab obligatorio,
  y su error de lectura no oculta la captura confirmada. Checkpoint frontend96passed/
  39files775.66s; suite completa posterior al ajuste final en curso.
- Último navegador tras historial5passed1.9m, incluye12capturas vacío/lista poblada/
  creación/detalle/comparación/historial a1440/390, axe cero y overflow documental cero.
  Capturas finales de detalle escritorio/móvil inspeccionadas y comparadas con referencia.
- Laboratorio completo posterior: backend con BI_TEST_POSTGRES=true →187passed,
  ninguna omitida,148.44s. Credencial no mostrada/copied; lectura del archivo autorizada.
  Typecheck/build final y suite frontend posterior en curso. No más cambios de producto.
- Task 6: complete (continuation resolves visual implementation differences): cuatro
  referencias HTML/captura consultadas, D01/D02 aplicadas, fuentes locales/CDN bloqueado,
  historial bajo captura,12screens desktop/mobile inspeccionadas; frontend final97passed/
  40files284.77s, typecheck/build exit0. No aceptación humana visual atribuida.
- Task 7: complete (technical verification/handoff): backend187passed148.44s con PG,
  models5passed1.9m, sources2passed1.0m, datasets4passed2.9m; regresiones previas catalog3/
  api3/smoke7 preservadas como evidencia de sus ejecuciones. git diff --check exit0.
  RootAPI8006/UI5186 comprobadasHTTP200 sin reinicio ni cambios de DB del usuario.
- Ruling: conservar worktree/ledger y no integrar automáticamente — plan prohíbe
  limpieza/merge/push y aceptación humana está pendiente — cost if wrong: rama local
  y artefactos permanecen para revisión; master sigue sin la funcionalidad US004.
- Handoff final: pendientes anteriores de laboratorio ejecutados tras autorización;
  aceptación visual/funcional pendiente del usuario. Historia madre US004 no cerrada:
  publicación, SemVer publicado, roles reales, retención y US005 siguen fuera.
