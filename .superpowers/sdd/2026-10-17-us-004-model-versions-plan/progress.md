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
