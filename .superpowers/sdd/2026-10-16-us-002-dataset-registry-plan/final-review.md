# Independent review — US-002

Reviewer: fresh-context agent Descartes; read-only, no subagents or file edits.
No Critical findings. Verdict before fixes: not ready for acceptance.
Declined to judge: [] (no additional rulings required).

Important findings accepted for one TDD fix pass:

1. Dataset GET/list reads row/selection/inputs without a shared read transaction,
   allowing a response assembled from different committed versions (service.py get/list).
2. A pending save can navigate after its form unmounts, discarding another form's work
   (DatasetForm.tsx save completion).
3. 412 reload can overwrite edits typed after confirmation and race overlapping reloads
   (DatasetForm.tsx reload).
4. Clearing the attempt on every edit loses the idempotency key for an identical
   normalized payload (e.g. a trailing name space after an uncertain creation).

Minor deferred:

5. UI column picker permits >500 selected columns; API safely rejects the request,
   but UI provides only a generic 422 rather than a clear selection-limit explanation.

Strengths noted: tenant-scoped SQL/FKs; authorization before replay; atomic writes
and audit; optimistic updates; persisted snapshots; actual-byte body cap; distinction
between completeness/approval and source constraints/dataset uniqueness.

## One author fix pass (not a second reviewer approval)

All four Important findings reproduced with failing tests, then fixed:
shared read transaction; lifecycle-guarded completion; exclusive reload with
pending/lifecycle guards; retained attempt keyed by normalized/canonical content.
Verification after fixes: backend 84 passed with real PostgreSQL, frontend 50
passed, typecheck/build exit 0, dataset browser integration 3 passed with axe.
Minor 5 remains explicitly deferred. No second review was dispatched.
