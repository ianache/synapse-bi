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
- T3 in progress; T4 pending; T5 pending; T6 pending; T7 pending.
