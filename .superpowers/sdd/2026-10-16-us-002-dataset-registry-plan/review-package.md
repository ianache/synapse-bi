# US-002 whole-change review package

Plan: docs/superpowers/plans/2026-10-16-us-002-dataset-registry-plan.md
Specs: knowledge-base/design/api-contracts/API-002-dataset-registry.md;
knowledge-base/design/data-models/DM-002-dataset-registry.md; docs/ux/us-002/README.md.
BASE/HEAD unavailable: repository has no initial commit; do not stage/commit user files.
Review current source directly, scoped to the paths below and their consumers.
Ledger and Ruling lines: .superpowers/sdd/2026-10-16-us-002-dataset-registry-plan/progress.md.

## Scope

- codebase/backend/synapse_api/datasets/*.py (all new)
- backend modified: synapse_api/{database,errors,auth,app}.py
- backend new tests: tests/test_datasets_*.py, tests/dataset_fixtures.py
- frontend new: apps/bi-analytics/src/domain/{datasets,observations}.ts,
  adapters/datasetsRepository*, hooks/useDatasetResource*, pages/datasets/*
- frontend modified: adapters/{apiRepository,sourcesRepository}.ts,
  app/routes.tsx, components/SynapseShell.tsx, pages/SourcesWorkspace.tsx
- browser integration: playwright.datasets.config.ts, tests/datasets-integration/datasets.spec.ts;
  optional-port fixes in playwright.{sources,api}.config.ts and tests/api-integration/analyst.spec.ts
- codebase/package.json; READMEs; local acceptance evidence (not production approval).

## Verification observed

- Frontend 46 tests passed; tsc and production build exit 0.
- Backend PostgreSQL opt-in: 82 passed; only existing Starlette httpx deprecation warning.
- Dataset browser: 3 passed including real schema, uncertain result replay, new context recovery,
  prepared/Medallion, stale edit preservation, invalid input and tenant isolation.
- axe zero violations at desktop 1440 and mobile 390 across origin/metadata/detail/edit/catalog.
- Sources 2 passed on fresh 8004/5184; API dashboards 3 passed on fresh 8003/5183;
  smoke 7 passed. No user-owned servers stopped; Gold unchanged.

## Review Focus (verbatim from plan)

1. Nombres Unicode y columnas con espacios/comillas: normalizar nombres de catálogo sin convertir identificadores observados en SQL (Task 1/3).
2. POST de resultado incierto y replay tras una edición: devolver creación original sin duplicar; la ficha hace GET actual (Task 4/6).
3. Selección parcial de PK/UQ compuesta: mostrar restricciones **del origen**, nunca prometer unicidad/grano del dataset (Task 3/6).
4. Cambio de fuente durante edición y respuesta GET fuera de orden: preservar referencia histórica y cambios del usuario (Task 4/6/7).
5. Cuerpo chunked que supera el límite, aunque Content-Length falte/mienta: rechazar antes de deserializar o escribir (Task 5).
