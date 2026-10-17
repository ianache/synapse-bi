# US-004 — Modelos y borradores versionados Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar modelos de un dominio con capturas estables, comparar y actualizar explícitamente borradores sin publicación ni cálculo.

**Architecture:** Módulo aditivo semantic_models junto al catálogo existente, SQLite v5 y API independiente; el backend captura metadatos dentro de transacciones coherentes. React consume esa API y conserva el shell y las cuatro referencias Stitch, con las cinco excepciones visuales autorizadas.

**Tech Stack:** Python/FastAPI/Pydantic/sqlite3 existentes; React/TypeScript/Vite, Vitest/Testing Library y Playwright existentes. Sin dependencias nuevas de producto.

**Spec:** [primera entrega](/docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md).

## Global Constraints

- Exactamente un dominio por modelo; varios modelos posibles por dominio.
- Cambios del catálogo no modifican silenciosamente capturas guardadas.
- Guardar no aprueba, publica, certifica ni calcula. Sin SQL, filas de negocio ni escritura Gold.
- [API-004](/knowledge-base/design/api-contracts/API-004-semantic-model-drafts.md) y [DM-004](/knowledge-base/design/data-models/DM-004-semantic-model-drafts.md) son propuestas técnicas REQUIRES_REVIEW; aprobarlas con este plan antes de ejecución.
- DTO, scopes, límites y errores exactos en API-004; representación funcional de esta entrega Borrador N, semanticVersion null, revisión técnica independiente.
- [UX US-004](/docs/ux/us-004/README.md): referencias desktop obligatorias. Excepciones autorizadas: sin Exportar, captura estable, sin umbral inventado, confirmación desmarcada y Ticket promedio coherente. No copiar ejemplos a DB manual.
- Gates productivos intactos: asignación real de roles y política de retención. No se implementan aprobaciones/retiro/excepciones de publicación de la historia madre.
- No tocar cambios previos de datasets/catálogo, secretos, DB manual, junctions ni servidores activos. No push, merge ni limpieza automática.

## Review Focus

1. Catálogo cambia entre preview y confirmar: 409 sin modificación, no aceptar lo no revisado (T3/T7).
2. Permiso revocado después de capturar o antes de replay: no filtrar captura histórica (T2/T3/T4).
3. Clone y update concurrentes: última secuencia comprobada bajo bloqueo; anteriores intactas (T3).
4. Respuesta incierta, GET posterior fallido o editor desmontado: no duplicar, no perder contenido ni navegar desde respuesta obsoleta (T5/T6).
5. Dependencia compartida/oculta o captura demasiado grande: deduplicación real y rechazo íntegro sin filtrar ni truncar (T2/T4).

## Preparación y aislamiento

- [ ] Revisar spec/contratos/plan y confirmar método de ejecución. No existe plan aprobado todavía.
- [ ] Detectar aislamiento según using-git-worktrees; preferencia previa del usuario: worktree aislado. Proponer `.worktrees/us-004-model-versions`, rama `feat/us-004-model-versions`, verificar ignore antes de crear. No usar worktree US-003 como destino.
- [ ] HEAD actual ef910f3 no contiene cambios locales de UI/documentación. En el nuevo worktree trasladar mediante parches revisados únicamente la base visual/de requisitos necesaria, incluyendo archivos nuevos. Mantener copia exacta y ledger del origen; no stash/reset ni commit de todo el directorio. Si archivos solapados cambian durante traslado, parar y resolver sin sobrescribir.
- [ ] Reutilizar entornos existentes sólo tras comprobar versión/dependencias; no instalar automáticamente ni copiar secretos. Baseline Python y frontend con comandos de T7; registrar resultado antes de implementación.

## Mapa de archivos

Backend nuevo `codebase/backend/synapse_api/semantic_models/`: schemas.py DTO;
migration.py v5; repository.py SQL tenant-scoped; capture.py lectura/canonicalización;
diff.py comparación; service.py transacciones/retry; router.py HTTP; body_limit.py
límite de bytes; __init__.py. Modificar database.py/app.py/auth.py para integración
aditiva. No refactorizar módulos ajenos.

Frontend nuevo: domain/semanticModels.ts, adapters/semanticModelsRepository.ts,
pages/semantic-models/{SemanticModelsWorkspace,ModelList,ModelCreate,ModelDetail,
ModelCompare,ModelVersionHistory}.tsx y semantic-models.css. Integrar rutas y shell
en app/routes.tsx y components/SynapseShell.tsx sin reemplazar sus cambios locales.

## T1 — DTO y migración v5

**Files:** crear semantic_models/{schemas,migration,__init__}.py; modificar database.py;
pruebas backend/tests/test_semantic_models_{policy,migration}.py y expectativas de
versión vigente en test_semantic_catalog_migration.py. Paths relativos a codebase/.

**Interfaces:** `apply_v5(connection: sqlite3.Connection) -> None`;
`CreateModel`, `CloneDraft`, `PreviewDraft`, `UpdateDraft`, `Model`, `Draft`,
`ModelDetail`, `Preview`, `Comparison` DTO de API-004. No referencias a tipos no definidos.

- [ ] RED: test_empty_selection_is_valid y test_invalid_ids_duplicates_extra_fields;
  CreateModel(name='Ventas', domainId=uuid, kpiIds=[]).kpi_ids == []; rechazar >100 KPI,
  IDs duplicados, nombre vacío y semanticVersion proporcionado por cliente.
- [ ] Ejecutar `python -m pytest tests/test_semantic_models_policy.py -q` en backend;
  fallo esperado por módulo ausente, no por entorno.
- [ ] RED migración: test_upgrade_v4_is_additive; test_v5_rollback_on_failure;
  test_future_rejected_before_ddl; test_cross_tenant_fk; test_backup_restore.
- [ ] Implementar DTO API-004 y DDL DM-004, initialize secuencial v3/v4/v5. Revisar
  expectativas de versión anterior sin perder pruebas rollback/historia v4.
- [ ] Ejecutar ambos archivos nuevos y test_semantic_catalog_migration.py: PASS,
  schema actual5, initialize dos veces no cambia datos, FK check vacío e integrity ok.
- [ ] Checkpoint: `git add` sólo archivos de T1 y commit local `feat: add model draft schema v5` en worktree autorizado; si Git bloqueado, ledger sin afirmar commit.

## T2 — Captura autorizada y diferencias

**Files:** crear semantic_models/{capture,diff,repository}.py;
tests/test_semantic_models_capture.py, test_semantic_models_diff.py.

**Interfaces:** `capture_catalog(conn, user, domain_id: str, kpi_ids: list[str]) -> dict`;
`capture_digest(capture: dict) -> str`; `compare_captures(left: dict, right: dict) -> list[dict]`.
`ModelRepository(conn, user).model(id) -> sqlite3.Row` y `.draft(model_id,id) -> sqlite3.Row`.
La captura usa API-003 como fuente sin GET HTTP ni lectura de fuente física.

- [ ] RED test_shared_dimension_once: dos KPI comparten Canal, capture contiene dos
  KPI y una dimensión; selección reordenada produce mismo digest; sin credenciales.
- [ ] RED test_missing_hidden_wrong_domain y test_limits_do_not_truncate: 404 para
  inexistente/otro tenant, 422 dominio visible incorrecto; >1000 componentes o >8MiB
  → rechazo; scopes faltantes nunca devuelven cuerpos históricos.
- [ ] RED test_diff_text_not_math: modificación de fórmula es diferencia textual,
  dos fórmulas equivalentes no se evalúan; orden estable kind/id/field.
- [ ] Ejecutar `python -m pytest tests/test_semantic_models_capture.py tests/test_semantic_models_diff.py -q`, observar RED.
- [ ] Implementar whitelist, bindings históricos y canonicalización de DM-004;
  no incluir protected/consumerCount ni fechas de captura en digest; deduplicar por id.
- [ ] Repetir comando → PASS; usar conector que falla si se invoca para demostrar cero introspección.
- [ ] Checkpoint local sólo T2 `feat: capture and compare semantic model metadata`.

## T3 — Servicio transaccional de modelos/borradores

**Files:** crear semantic_models/service.py;
tests/test_semantic_models_service.py, test_semantic_models_concurrency.py,
test_semantic_models_restart.py.

**Interfaces:** `SemanticModelsService(database)` con
`create(user, body: CreateModel, key, request_id) -> dict`,
`list(user, filters) -> dict`, `get(user, model_id) -> dict`,
`list_drafts(user, model_id, filters) -> dict`, `get_draft(user, model_id, draft_id) -> dict`,
`clone(user, model_id, body: CloneDraft, etag, key, request_id) -> dict`,
`preview(user, model_id, draft_id, body: PreviewDraft, etag) -> dict`,
`update(user, model_id, draft_id, body: UpdateDraft, etag, request_id) -> dict`,
`compare(user, model_id, left_id, right_id) -> dict`. Consume T1/T2; nunca ejecuta fórmulas.

- [ ] RED test_create_model_with_empty_draft: modelo+Borrador1 atómicos, captura
  recuperable tras reinicio y sin actualizaciones por edición del catálogo.
- [ ] RED test_retry_original_response: mismo contenido normalizado+key devuelve
  respuesta original incluso si cambió catálogo; otra carga con misma key →409.
- [ ] RED test_preview_is_read_only y test_confirm_rejects_changed_candidate:
  preview no escribe; cambiar KPI después produce409 y misma captura anterior.
- [ ] RED test_clone_preserves_history y test_clone_update_race: dos escritores
  SQLite reales, última secuencia bajo bloqueo, anterior jamás modificada.
- [ ] RED test_read_single_snapshot y test_replay_revoked_scope: lectura coherente
  durante cambio y revocación deniega incluso respuesta idempotente guardada.
- [ ] Ejecutar `python -m pytest tests/test_semantic_models_service.py tests/test_semantic_models_concurrency.py tests/test_semantic_models_restart.py -q`, observar RED.
- [ ] Implementar métodos con BEGIN/BEGIN IMMEDIATE, compare-and-swap ETag,
  digest reconstruido, auditoría mínima y replay24h. No hacer segundo GET necesario
  tras PUT confirmado ni aceptar creación parcial.
- [ ] Repetir suite T3 →PASS; comparar tablas legacy antes/después sin modificaciones.
- [ ] Checkpoint local T3 `feat: persist explicit semantic model draft updates`.

## T4 — API y autorización

**Files:** crear semantic_models/{router,body_limit}.py; modificar app.py/auth.py;
tests/test_semantic_models_api.py. Consumir DTO/servicio T1/T3.

**Interfaces:** `semantic_models_router(service: SemanticModelsService) -> APIRouter`;
`ModelsBodyLimitMiddleware(app)`; constantes `MODEL_SCOPES` con read/write API-004.

- [ ] RED test_routes_headers_scope_matrix: rutas API-004, 201 Location/ETag,
  428 sin If-Match, 412 stale, analista403 y tenant ajeno404 sin revelar nombres.
- [ ] RED test_real_body_limit: 262144/262145 bytes reales y chunked, 415 por media
  incorrecto, error envelope y OpenAPI; rechazo no altera DB.
- [ ] Ejecutar `python -m pytest tests/test_semantic_models_api.py -q`, observar RED.
- [ ] Montar router/middleware y scopes nuevos sólo data-admin/other-data-admin
  de desarrollo, no ALL_SCOPES ni login con grants de gobernanza productiva.
- [ ] Repetir tests T4 y suites API legacy →PASS; verificar que `/queries` y dashboards
  no aceptan modelos draft como KPI publicado.
- [ ] Checkpoint local T4 `feat: expose tenant scoped semantic model draft api`.

## T5 — Adaptador y navegación de UI

**Files:** crear src/domain/semanticModels.ts y src/adapters/semanticModelsRepository.ts,
sus tests; modificar src/app/routes.tsx, routes.test.tsx y components/SynapseShell.tsx.
Paths frontend relativos a codebase/apps/bi-analytics/.

**Interfaces:** `SemanticModelsRepository` usa ApiRepository existente con métodos
`list`, `create`, `get`, `drafts`, `getDraft`, `clone`, `preview`, `update`, `compare`,
`me` reflejando API-004 y AbortSignal en lecturas. DTO frontend exactamente T1.
Rutas `/modelos-semanticos`, `/modelos-semanticos/nuevo`, `/:id`,
`/:id/borradores/:draftId`, `/:id/borradores/:draftId/comparar`.

- [ ] RED repository.test.ts: URLs encodeURIComponent, headers Idempotency-Key/
  If-Match, digest en PUT, errores conservados, abort de lectura; ninguna petición SQL.
- [ ] RED routes.test.tsx: workspace correcto por ruta; navegación de datasets y
  catálogo intacta; enlace Modelos semánticos según permisos existentes de workspace.
- [ ] Ejecutar Vitest específico →RED; implementar adapter/tipos y rutas sin reemplazar shell.
- [ ] Repetir →PASS; typecheck exit0. Checkpoint T5 `feat: add semantic model client and routes`.

## T6 — Cuatro pantallas fieles a Stitch

**Files:** crear pages/semantic-models/{SemanticModelsWorkspace,ModelList,ModelCreate,
ModelDetail,ModelCompare,ModelVersionHistory}.tsx, semantic-models.css y tests
ModelCreate.test.tsx, ModelCompare.test.tsx, ModelDetail.test.tsx, ModelList.test.tsx.

**Interfaces:** `SemanticModelsWorkspace({path,search})` distribuye vistas;
vistas reciben repository y IDs explícitos. Crear usa catálogo actual autorizado;
detalle sólo contenido capturado; comparación preview o guardada/guardada según modo.

- [ ] Descargar/consultar HTML y captura de cada referencia exacta UX-US004 antes
  de escribir JSX. Aplicar únicamente cinco excepciones aprobadas; checkbox false.
- [ ] RED: creación permite0KPI con faltantes y captura sugerida deduplicada; ID
  asignado al guardar, dominio fijo sólo después de crear; no exportar/publicar.
- [ ] RED: detalle captura sin cambios automáticos; historial anterior read-only;
  comparación previa, cancelar intacto, confirmar sólo tras consentimiento explícito.
- [ ] RED: error incierto conserva key/contenido; PUT confirmado con GET posterior
  fallido no se reenvía; 412/409 conservan edición; unmount ignora save/preview tardío.
- [ ] Ejecutar `npm test -- --run apps/bi-analytics/src/pages/semantic-models --maxWorkers=1 --minWorkers=1 --testTimeout=15000`, observar RED.
- [ ] Implementar composición/tokens/estados de Stitch con componentes existentes,
  estilos scoped, carga/vacío/error/sin permiso y regiones móviles sin overflow.
  No insertar ejemplos ni interpretar mockup como funcionalidades de negocio.
- [ ] Repetir suite →PASS, types/build exit0. Checkpoint T6 `feat: implement stitch semantic model draft screens`.

## T7 — Integración, revisión y entrega

**Files:** crear tests/semantic-models-integration/models.spec.ts,
playwright.semantic-models.config.ts; modificar package.json con `test:semantic-models`;
actualizar docs/ux/us-004/README.md y ledger de este plan.

**Interfaces:** E2E usa API8010/UI5190 configurables por BI_MODELS_API_PORT/UI_PORT,
SQLite única por ejecución, reuseExistingServer=false. Conservar API8006/UI5186 del usuario.

- [ ] RED navegador: dominio propio/componentes/KPI →modelo→borrador recuperado→
  editar catálogo→preview→cancelar/confirmar; comparar guardadas y anterior intacta;
  simular respuesta perdida/retry, conflicto412 y drift409. Aislamiento de tenants.
- [ ] Ejecutar `npm run test:semantic-models` →RED inicial; completar sólo wiring
  necesario; repetir →PASS sin omitir asserts ni usar DB manual.
- [ ] Backend `python -m pytest -p no:cacheprovider` en backend →cero fallos;
  PG opt-in BI_TEST_POSTGRES=true con lectura de laboratorio sólo si disponible y
  autorizado; reportar por separado si omitido. No imprimir credenciales.
- [ ] Frontend `npm test -- --reporter=dot --maxWorkers=1 --minWorkers=1 --testTimeout=15000`,
  `npm run typecheck`, `npm run build` →cero fallos/exit0; `git diff --check` limpio.
- [ ] Regresiones navegador semantic-catalog/datasets/sources/api/smoke en puertos
  aislados y DB únicas; registrar comandos, resultados y cualquier omisión.
- [ ] axe/teclado a1440/390, document overflow cero, capturas comparadas con Stitch;
  registrar diferencias no aprobadas en lugar de afirmar fidelidad exacta.
- [ ] Revisión independiente read-only del diff completo; verificar y corregir
  Critical/Important con RED→GREEN y suites proporcionales antes de afirmar éxito.
- [ ] Checkpoint final y guía de prueba manual. No merge/push ni cerrar historia
  madre US-004. Entregar rama/worktree y solicitar aceptación visual/funcional.

## Auto-revisión y estado

Cobertura: spec§§1/4/5→T2/T3/T6; §6→T4/T5; §7→T3/T5/T6; §8→T6/T7;
§9→T1–T7; límites§3 y gates§10→Global Constraints/preparación. Cinco Review Focus
asignados a pruebas específicas. Nombres DTO/métodos se fijan en T1/T3 y API-004.
Plan revisado por autor, no por humano ni revisión independiente.

**Estado:** pendiente de revisión del usuario, API-004/DM-004 y método de ejecución.
Recomendación: ejecución nativa con una revisión independiente final, pues las
tareas comparten contrato/captura y requieren integración secuencial cuidadosa.
Alternativa: subagentes por tarea con revisión antes de avanzar, mayor coste de contexto.
