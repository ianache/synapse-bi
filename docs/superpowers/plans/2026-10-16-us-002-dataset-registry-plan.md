# US-002 Dataset Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar, recuperar y editar datasets directos/preparados desde observaciones existentes, permitiendo borradores incompletos sin aprobación implícita.

**Architecture:** Ampliar el backend FastAPI y su registro SQLite con un módulo de datasets y migración aditiva v3. La validación utiliza snapshots persistidos de US-001, nunca vuelve a consultar PostgreSQL durante el guardado. React consume la API y reutiliza el shell y el lenguaje visual de Stitch.

**Tech Stack:** Python/FastAPI/Pydantic/SQLite y dependencias existentes de uv.lock; React/TypeScript/Vite, Vitest/Testing Library y Playwright/axe existentes. No añadir dependencias de producto salvo necesidad demostrada y revisión.

**Spec:** [API-002](../../../knowledge-base/design/api-contracts/API-002-dataset-registry.md), [DM-002](../../../knowledge-base/design/data-models/DM-002-dataset-registry.md), [IMD-001](../../../knowledge-base/business/information-model/IMD-001-registro-datasets.md) y [pantallas/reglas UX](../../ux/us-002/README.md). Aprobación local del contrato/modelo: UX-US002-D02. Las observaciones de producción no quedan cerradas.

## Global Constraints

- `registrationStatus=draft|registered`, `completeness=complete|incomplete`, `governanceValidation=pending`.
- `freshness` y `quality` mantienen `status=not_evaluated`; no inferir última carga, métricas, granularidad ni semántica.
- `saveAs=draft` permite metadatos faltantes; referencias rotas, nombre vacío y selección inválida se rechazan también en borrador.
- Nombre 1–100 caracteres imprimibles, trim y NFC; unicidad por tenant con NFC + casefold. Descripción hasta 2000.
- Selección: 1–500 nombres distintos, hasta 128 caracteres cada uno, existentes y ordenados como el snapshot.
- Owner, classification, freshnessExpectation y loadReference: hasta 500 caracteres, trim; vacío se normaliza a null.
- Prepared: processReference hasta 1000; inputOrigins hasta 20, sin duplicados ni el propio origen de salida, todas referencias exitosas del mismo tenant.
- Medallion: schemaDescription, partitionPolicy, retentionPolicy, minimumQuality, tenantPolicy, hasta 500 caracteres cada uno; nunca inferir pertenencia por `gold`.
- Cuerpo máximo 256 KiB. JSON extra=forbid, camelCase, sin tenant/subject/credenciales/SQL del cliente.
- GET requiere `datasets:read`; POST/PUT requieren `datasets:read`, `datasets:write` y `sources:read`. No ampliar permisos del analista por defecto.
- Idempotency-Key obligatoria en POST, 1–100 caracteres imprimibles, replay 24 h por tenant/subject/operación. PUT requiere If-Match.
- Errores: 401/403/404/409/412/413/422/428/503 según API-002; no exponer valores sensibles.
- Origin y kind inmutables tras creación. Una observación histórica no se sustituye por otra más reciente.
- No borrar datos existentes, escribir en Gold, detener servicios del usuario, publicar datasets/modelos o ejecutar pipelines.

## Review Focus

1. Nombres Unicode y columnas con espacios/comillas: normalizar nombres de catálogo sin convertir identificadores observados en SQL (Task 1/3).
2. POST de resultado incierto y replay tras una edición: devolver creación original sin duplicar; la ficha hace GET actual (Task 4/6).
3. Selección parcial de PK/UQ compuesta: mostrar restricciones **del origen**, nunca prometer unicidad/grano del dataset (Task 3/6).
4. Cambio de fuente durante edición y respuesta GET fuera de orden: preservar referencia histórica y cambios del usuario (Task 4/6/7).
5. Cuerpo chunked que supera el límite, aunque Content-Length falte/mienta: rechazar antes de deserializar o escribir (Task 5).

## File structure and task dependencies

Todos los paths de código siguientes son relativos a la raíz del repositorio.

| Unidad | Archivos principales | Responsabilidad |
| --- | --- | --- |
| DTO/reglas | `codebase/backend/synapse_api/datasets/{__init__,schemas,policy}.py` | Entrada/salida, normalización y completitud pura |
| Migración | `codebase/backend/synapse_api/datasets/migration.py` | DDL v3; integración en database.py |
| Observaciones | `codebase/backend/synapse_api/datasets/observations.py` | Resolver procedencia autorizada sin conectar a PostgreSQL |
| Agregado | `codebase/backend/synapse_api/datasets/{repository,service}.py` | Persistencia transaccional, listado, replay y edición |
| HTTP | `codebase/backend/synapse_api/datasets/{router,body_limit}.py` | Rutas, precondiciones y límite de cuerpo |
| Cliente/lectura | `codebase/apps/bi-analytics/src/{domain/datasets.ts,domain/observations.ts,adapters/datasetsRepository.ts,hooks/useDatasetResource.ts}` | Tipos compartidos, HTTP y consultas cancelables |
| Pantallas | `codebase/apps/bi-analytics/src/pages/datasets/{DatasetsWorkspace,DatasetList,DatasetDetail,DatasetForm}.tsx`, `datasets.css` | Catálogo, ficha y wizard/edición |
| Pruebas | `codebase/backend/tests/test_datasets_*.py`, frontend `*.test.ts(x)`, `codebase/tests/datasets-integration/datasets.spec.ts` | Contrato, seguridad, persistencia y experiencia |

Dependencias: Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. No paralelizar escrituras en
app.py/database.py/Routes hasta estabilizar interfaces. Se recomienda ejecución
nativa por estas dependencias; la revisión independiente al cierre depende del
método elegido por el usuario.

## Preflight and command conventions

- Antes de ejecutar, leer las specs enlazadas y aplicar using-git-worktrees.
  En la inspección del 2026-10-16 `git rev-parse --verify HEAD` indicó que no hay
  commit inicial; no crear uno con archivos ajenos ni fingir aislamiento. Si
  sigue igual, acordar trabajo en el workspace actual y registrar la limitación.
- No leer ni imprimir archivos `.docker-secrets` salvo dentro de la integración
  opt-in que ya los utiliza en memoria; no incluirlos en snapshots/traces.
- Python desde `codebase/backend`: `uv run --extra test --frozen pytest ...`.
  Frontend desde `codebase`: `npm test -- ...`, `npm run typecheck`, `npm run build`.
- En este equipo usar un PYTEST_DEBUG_TEMPROOT nuevo si hay ACL de temporales
  incompatibles. Solicitar permisos sólo tras restricciones o para Chrome/Docker
  que los requieren; no elevar ni cambiar políticas silenciosamente.
- Checkpoint Git por tarea: revisar diff y añadir sólo archivos de esa tarea
  con `git add -- <paths>` y mensaje indicado, únicamente si existe una base Git
  acordada. Sin HEAD, registrar checkpoint en progress.md y no hacer un commit
  inicial masivo ni `git add .`.

### Task 1: DTOs y política de completitud

**Files:** Create `codebase/backend/synapse_api/datasets/__init__.py`, `schemas.py`, `policy.py`; Modify `codebase/backend/synapse_api/errors.py`; Test `codebase/backend/tests/test_datasets_policy.py`.

**Interfaces:**
- Consumes: `synapse_api.schemas.DTO`.
- Produces: `Origin`, `Governance`, `Preparation`, `Medallion`, `SaveDataset`, `Dataset`, `DatasetSummary`, `DatasetPage`, `DatasetFilters` en schemas.py; shapes de API-002 §§4–6. `normalize_name(value: str) -> str` devuelve NFC/casefold para unicidad; los validators conservan mayúsculas de presentación. `missing_metadata(body: SaveDataset) -> list[str]` y `validate_registration(body: SaveDataset) -> None` en policy.py.
- Ampliación compatible: `ApiError(status: int, code: str, message: str, *, details: dict | None = None)`; Task 5 decidirá la exposición HTTP restringida, no el constructor.

- [x] **Step 1 — Write RED tests:** `test_draft_missing_fields`, `test_registered_requires_metadata`, `test_prepared_medallion_missing_order`, `test_unicode_and_limits`. Afirmar, por ejemplo:

  Crear fixture local direct_draft mediante SaveDataset.model_validate con name
  Ventas, kind direct, saveAs draft, origin `{sourceId:"s1",observationId:"o1",schema:"gold",object:"fact_sales"}`,
  selectedColumns `["sale_amount"]`, governance `{owner:"   "}` y preparation/medallion null.

```python
assert missing_metadata(direct_draft) == ["owner", "classification", "freshnessExpectation"]
assert normalize_name("  CAFE\u0301  ") == normalize_name("Café")
assert direct_draft.governance.owner is None  # entrada de espacios normalizada
```

  Rechazar nombre vacío/control, 101 caracteres, descripción 2001, 0/501 columnas,
  columnas repetidas, identificador de columna 129, metadato 501, proceso 1001,
  21 inputs, tenant extra y aprobación asignada por cliente. Aceptar exactamente
  los límites y una columna observada cuyo nombre contiene espacios/comillas.
- [x] **Step 2 — Run RED:** `uv run --extra test --frozen pytest tests/test_datasets_policy.py -v`; falla por módulo/reglas inexistentes.
- [x] **Step 3 — Implement:** DTOs estrictos, normalizadores, evaluador puro y constructor compatible de ApiError con details. Orden de missingMetadata: owner/classification/freshnessExpectation, proceso/inputs si preparado, cinco campos Medallion si declarado. Registered incompleto produce ApiError 422 metadata_incomplete con rutas de campos, nunca valores; no modificar aún el handler HTTP.
- [x] **Step 4 — Run GREEN:** mismo comando; todos los casos pasan. No registrar por defecto al completar campos si saveAs sigue draft.
- [x] **Step 5 — Checkpoint:** `feat: define dataset contracts and metadata policy`.

### Task 2: Migración SQLite v3 atómica y compatible

**Files:** Create `codebase/backend/synapse_api/datasets/migration.py`; Modify `codebase/backend/synapse_api/database.py`; Test `codebase/backend/tests/test_datasets_migration.py`.

**Interfaces:**
- Consumes: `Database.connect(write=True)` y claves existentes de source_observations.
- Produces: `DATASET_DDL: tuple[str, ...]` y `apply_v3(connection: sqlite3.Connection) -> None`, que requieren una transacción activa y no hacen commit ni executescript. Database.initialize coordina versión y transacciones.

- [x] **Step 1 — Write RED tests:** `test_new_v1_v2_upgrade_preserves_data`, `test_future_schema_rejected_before_new_tables`, `test_migration_failure_rolls_back`, `test_composite_foreign_keys`. Usar bases temporales; conservar dashboards, fuentes, snapshots, ciphertext e idempotencia previa. Inyectar una sentencia inválida al final de DATASET_DDL y comprobar que no quedan tablas v3 ni marca 3. Una versión 99 no debe recibir tablas nuevas. Repetir initialize no duplica nada.
- [x] **Step 2 — Run RED:** `uv run --extra test --frozen pytest tests/test_datasets_migration.py -v`.
- [x] **Step 3 — Implement:** cuatro tablas/índices/CHECK/FK de DM-002 §4 y versión 3 en la misma transacción. Directo permite sólo process_reference null; preparado borrador puede carecer de proceso. Resolver versión futura antes de DDL nuevo. Mantener bootstrap v1/v2 y no modificar Gold ni la tabla idempotency de dashboards.
- [x] **Step 4 — Run GREEN:** comando anterior más `uv run --extra test --frozen pytest tests/test_api.py tests/test_sources.py`; la integración real sigue opt-in.
- [x] **Step 5 — Checkpoint:** `feat: add additive dataset registry migration`.

### Task 3: Resolver observaciones e inputs sin conexiones externas

**Files:** Create `codebase/backend/synapse_api/datasets/observations.py`; Test `codebase/backend/tests/dataset_fixtures.py`, `test_datasets_observations.py`.

**Interfaces:**
- Produces dataclasses `ObservedObject(source_id, observation_id, schema, object, metadata, observed_at, source_version, current_source_version, source_name)` y `ResolvedOrigins(output: ObservedObject, inputs: tuple[ObservedObject, ...])`.
- `resolve_origins(conn: sqlite3.Connection, user: Principal, body: SaveDataset) -> ResolvedOrigins`; no abre conexiones ni transacciones nuevas.
- Test helper `seed_observation(database: Database, tenant: str = "demo-global", *, failed: bool = False) -> Origin` crea fixture técnica sin secretos reales, con PK compuesta y nombre de columna no convencional. `draft_body(origin: Origin) -> dict` devuelve el DTO JSON mínimo.

- [x] **Step 1 — Write RED tests:** `test_resolves_historical_snapshot_without_connector`, `test_unknown_or_other_tenant_returns_404`, `test_failed_snapshot_and_invalid_selection_422`, `test_prepared_inputs_scoped_and_distinct`, `test_partial_primary_key_is_only_source_constraint`. Simular connector que siempre lanza AssertionError; guardar/resolver no debe llamarlo. Ordenar selección por posición observada y conservar nombres exactos. Fuentes cambiadas muestran dos versiones, sin sustituir snapshot.
- [x] **Step 2 — Run RED:** `uv run --extra test --frozen pytest tests/test_datasets_observations.py -v`.
- [x] **Step 3 — Implement:** consultas parametrizadas por tenant/source/observation; comprobar success, objeto, columnas e inputs del mismo tenant; copiar sólo atributos técnicos definidos por SRC-001. Origen/input idénticos o duplicados: 422; procedencia ausente o ajena: 404. No derivar tipo preparado de vistas ni Medallion de gold.
- [x] **Step 4 — Run GREEN:** mismo comando; verificar que los snapshots de fuente no se actualizan al resolverlos.
- [x] **Step 5 — Checkpoint:** `feat: resolve dataset origins from immutable observations`.

### Task 4: Servicio transaccional, consulta e idempotencia

**Files:** Create `codebase/backend/synapse_api/datasets/repository.py`, `service.py`; Test `codebase/backend/tests/test_datasets_service.py`.

**Interfaces:**
- `DatasetRepository` encapsula SQL del agregado y replay, recibe conexiones ya abiertas; no importa router ni conecta a PostgreSQL.
- `DatasetService(database: Database)` con `create(user: Principal, body: SaveDataset, key: str, request_id: str) -> Dataset`, `get(user: Principal, dataset_id: str) -> Dataset`, `list(user: Principal, filters: DatasetFilters) -> DatasetPage`, `update(user: Principal, dataset_id: str, body: SaveDataset, if_match: str | None, request_id: str) -> Dataset`.
- Consume Tasks 1–3; produce exactamente response de API-002 §6, sin connection parameters. Métodos del repository privados al módulo: no crear otra API pública entre tareas.

- [x] **Step 1 — Write RED tests:** `test_create_draft_reload_and_register`, `test_complete_draft_stays_draft`, `test_explicit_return_to_draft`, `test_replay_and_payload_conflict`, `test_replay_original_after_edit`, `test_expired_key`, `test_two_writers_one_version`, `test_filters_before_pagination`, `test_atomic_rollback_and_backup_restore`.
  Assertions: version inicial 1; pending/not_evaluated constantes; missingMetadata exacto; registrado exige requisitos y no degrada silenciosamente; mismo POST sin duplicado; orden de columnas/inputs diferente pero equivalente reproduce replay; clave diferente con nombre equivalente NFC/casefold devuelve 409. Clave vencida deja de reproducir el DTO y sigue respetando unicidad de nombre.
  Dos ediciones con If-Match `"1"`: una escribe versión 2 y otra recibe 412; ausencia 428, formato inválido 422; cambio de origen/tipo 409. Listado con 51+ filas mezcla borradores/completos y filtros: total/orden/límite correctos, sin filtrar sólo una página. Otro tenant no obtiene recursos/inputs ni replay.
- [x] **Step 2 — Run RED:** `uv run --extra test --frozen pytest tests/test_datasets_service.py -v`.
- [x] **Step 3 — Implement:** una transacción BEGIN IMMEDIATE para agregado, selección, inputs, replay y auditoría. Buscar candidato de replay, resolver snapshot para canonicalizar selección/inputs, comparar fingerprint normalizado y devolver creación original sólo después de autorizar y comparar. Ventana 24 h; no implementar limpieza destructiva de catálogo. Calcular completeness/missing en lectura con el mismo evaluador; filtrar antes de paginar. Preservar origen, createdAt/By y snapshots técnicos; actualizar selección/inputs explícitos con versión.
- [x] **Step 4 — Run GREEN:** mismo comando. Restore de fixture mediante SQLite backup, cerrar/reabrir app y recuperar metadata idéntica. Fallo entre escritura del agregado y replay revierte todo. Ningún evento de éxito tras rollback ni payload en auditoría; catálogo KPI y snapshots no cambian.
- [x] **Step 5 — Checkpoint:** `feat: persist datasets with replay and optimistic updates`.

### Task 5: HTTP, autorización, límites y contrato de errores

**Files:** Create `codebase/backend/synapse_api/datasets/router.py`, `body_limit.py`; Modify `codebase/backend/synapse_api/{app,auth}.py`; Test `codebase/backend/tests/test_datasets_api.py`.

**Interfaces:**
- `dataset_router(service: DatasetService) -> APIRouter` monta GET/POST /api/v1/datasets y GET/PUT /{id} con response_model de Task 1.
- `DatasetBodyLimitMiddleware(app: ASGIApp)` limita únicamente POST/PUT de datasets a 262144 bytes reales antes de deserializar; envelope estándar y requestId del contexto externo.
- Consume ApiError con details de Task 1. ApiError handler sólo expone `details.missingMetadata` para metadata_incomplete y rutas permitidas por Task 1; no habilitar eco genérico de objetos.

- [x] **Step 1 — Write RED tests:** `test_http_contract_and_headers`, `test_all_scopes_required`, `test_cross_tenant_no_disclosure`, `test_headers_and_limits`, `test_chunked_body_limit`, `test_error_redaction`.
  Probar 401/403/404; scope individual faltante en POST/PUT; analista sin concesiones nuevas; GET no requiere sources:read. POST 201 Location/ETag, replay DTO original y PUT 200 nuevo ETag; Idempotency-Key ausente/inválida 422; If-Match 428/422/412. Límites de filtros limit=0/101, offset=10001, q=201:422. Un cuerpo válido rellenado con espacios JSON hasta 262144 bytes entra; 262145, incluso chunked o Content-Length falso, devuelve 413 sin escritura. Error no muestra texto de campos, secretos, SQL ni ciphertext; detalles sólo nombres de faltantes.
- [x] **Step 2 — Run RED:** `uv run --extra test --frozen pytest tests/test_datasets_api.py -v`.
- [x] **Step 3 — Implement:** montar app.state.datasets y router; conceder datasets:read/write sólo a data-admin/other-data-admin locales. Cuerpo acotado leído antes del parser, sin confiar sólo en Content-Length ni acumular datos sin límite. JWT existente no cambia. GET/PUT ETag y POST Location; exponer Location en CORS además de ETag sin ampliar orígenes. Registrar auditoría técnica create/update/draft/registration sin payload; logs sólo ruta/acción, resultado y duración, sin labels libres ni metadatos.
- [x] **Step 4 — Run GREEN:** `uv run --extra test --frozen pytest -p no:cacheprovider`; verificar OpenAPI incluye cuatro operaciones y DTOs. La suite sin BI_TEST_POSTGRES no necesita Docker; integración real separada.
- [x] **Step 5 — Checkpoint:** `feat: expose authorized dataset registry API`.

### Task 6: Cliente, catálogo y ficha de lectura

**Files:** Create `codebase/apps/bi-analytics/src/domain/{observations,datasets}.ts`, `adapters/datasetsRepository.ts`, `hooks/useDatasetResource.ts`, `pages/datasets/{DatasetsWorkspace,DatasetList,DatasetDetail}.tsx`, `pages/datasets/datasets.css` y sus tests. Modify `adapters/{apiRepository,sourcesRepository}.ts`, `app/routes.tsx`, `components/SynapseShell.tsx`.

**Interfaces:**
- Extraer sólo tipos Column/Constraint/SchemaObject/Observation de sourcesRepository a domain/observations.ts; reexportarlos para mantener imports actuales. No reestructurar US-001.
- Tipos `Origin`, `SaveDataset`, `Dataset`, `DatasetSummary`, `DatasetPage`, `DatasetFilters` reflejan Task 1/API-002; reutilizan tipos técnicos compartidos.
- `DatasetsRepository(api: ApiRepository)` expone `list(filters, signal?)`, `get(id, signal?)`, `create(body, key)`, `update(dataset, body)`, `me(signal?)`; dev usa persona data-admin sólo con VITE_API_AUTH=development.
- `ApiRequestError extends Error` con status/code/missingMetadata permitidos; ApiRepository.request conserva compatibilidad Error y descarta detalles arbitrarios.
- `useDatasetResource<T>(load: (signal: AbortSignal) => Promise<T>, key: string)` devuelve data/error/loading/refresh. Load estable con useCallback; cancelar/ignorar respuestas antiguas.
- `DatasetsWorkspace({path,search,repository?})`; router observa pathname y search en popstate sin romper rutas KPI/Fuentes. Shell admite active datasets y grupo administrativo coherente con Stitch.

- [x] **Step 1 — Write RED tests:** `datasetsRepository.test.ts` verifica rutas codificadas/filtros, POST misma clave recibida, PUT If-Match de version, errores tipados y no storage. `useDatasetResource.test.tsx` resuelve GET antiguo después del nuevo: sólo persiste recurso vigente. `DatasetList.test.tsx` cubre carga/vacío/403/503 y paginación/filtros; `DatasetDetail.test.tsx` verifica pending/not_evaluated, origen histórico y PK compuesta parcial sólo como restricción del origen. No mostrar responsable declarado como usuario autenticado ni badges «Aprobado».
- [x] **Step 2 — Run RED:** `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=15000 datasetsRepository useDatasetResource DatasetList DatasetDetail`.
- [x] **Step 3 — Implement:** listado/ficha siguiendo las capturas vigentes, estados reales sin fixtures de fallback; filtrar en API, no en una página ya recibida. La ficha abre GET actual incluso después de replay POST original. Linaje distingue origen estructural e inputs declarados; fuente reconfigurada muestra aviso. Contenedores desplazables tienen foco/label, tabs teclado, acciones 44px y contraste AA. Con cinco enlaces el shell móvil envuelve sin desbordar documento. No habilitar botón US-003.
- [x] **Step 4 — Run GREEN:** comando anterior y `npm run typecheck`; tests previos de rutas/adaptador siguen pasando.
- [x] **Step 5 — Checkpoint:** `feat: add dataset catalog and technical detail views`.

### Task 7: Wizard, borradores, registro y edición

**Files:** Create `codebase/apps/bi-analytics/src/pages/datasets/DatasetForm.tsx`, `DatasetForm.test.tsx`; Modify `DatasetsWorkspace.tsx`, `datasets.css`, `codebase/apps/bi-analytics/src/pages/SourcesWorkspace.tsx`.

**Interfaces:**
- `DatasetForm({repository: DatasetsRepository, sourceRepository: SourcesRepository, dataset?: Dataset, initialOrigin?: Origin})` sirve alta/edición; consume scopes de me y API de snapshots existentes.
- Rutas /datasets/nuevo y /datasets/{id}/editar. Query sourceId/observationId/schema/object preselecciona origen desde US-001, pero no autoriza ni sustituye validación API. Paso 2 es estado de wizard; atrás/adelante y cambios de query no usan datos de un origen anterior.

- [x] **Step 1 — Write RED tests:** `test_save_incomplete_draft`, `test_register_requires_fields`, `test_prepared_and_medallion_requirements`, `test_changed_origin_clears_columns`, `test_retry_preserves_values_and_creation_key`, `test_edit_conflict_preserves_changes`. Verificar placeholders → null; botón Guardar borrador disponible con estructura válida sin gobierno; Registrar exige campos completos pero no certifica. Registro directo no exige proceso; preparado exige proceso/input exitoso; Medallion sólo si usuario lo activa. Cambio de origen limpia selección/resultado pendiente. Doble clic no duplica POST. Fallo de red conserva cuerpo/clave para reintentar; si se modifica el cuerpo, generar otra clave. Un 412 no sobrescribe los valores locales y ofrece recargar versión actual con aviso. En edición origen/tipo bloqueados, con explicación de crear otro dataset para cambiarlos.
- [x] **Step 2 — Run RED:** `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=15000 DatasetForm`.
- [x] **Step 3 — Implement:** wizard de dos pasos Origen/Metadatos, búsqueda de objetos/columnas sólo en snapshot, editor de inputs preparados por referencias observadas y secciones Medallion explícitas. Crear una clave por contenido de intento; conservarla ante resultado incierto y usarla en reintento sin cambios. No usar localStorage para datasets o credenciales. SaveAs explícito por botón, downgrade a borrador explícito; errores 422 resaltan rutas faltantes, 409/412 muestran recuperación. Tras éxito navegar a ficha y GET. Habilitar Registrar dataset en explorador sólo con snapshot success y scopes requeridos; GET origen fallido no da acceso a un formulario falsamente válido.
- [x] **Step 4 — Run GREEN:** comando anterior más tests de Routes/KpiWorkspace y `npm run typecheck`.
- [x] **Step 5 — Checkpoint:** `feat: connect dataset registration and edit journeys`.

### Task 8: Integración real, regresión y entrega

**Files:** Create `codebase/playwright.datasets.config.ts`, `codebase/tests/datasets-integration/datasets.spec.ts`; Modify `codebase/package.json`, `codebase/README.md`, `codebase/backend/README.md`, `docs/ux/us-002/README.md`, ledger de progreso y evidencia API-002/DM-002.

**Interfaces:**
- Script `test:datasets`: `playwright test --config playwright.datasets.config.ts`.
- Servidores exclusivos 8002/5182, DB `backend/data/dataset-browser-tests.db`, proxy target 8002, CORS 5182; arranque usa .venv/Scripts/python.exe con quoting Windows correcto. Reuse desactivado salvo BI_DATASET_REUSE_SERVERS=true deliberado. No reutilizar ni detener 8000/8001/5180/5181 del usuario. Traces off y fuentes externas bloqueadas para pruebas deterministas, como US-001.

- [x] **Step 1 — Write acceptance E2E:** obtener credencial lectora local sólo en memoria, registrar fuente de nombre único y observar Gold (12 tablas/4 vistas, fact_sales 16 columnas/6 FK). Desde el explorador crear borrador sin gobierno → recargar en otro contexto → completar/registrar → editar con versión → recuperar ficha. Caso preparado con input observado distinto, y Medallion explícito. Probar metadatos/columnas inválidos, otra organización, búsqueda vacía, red fallida/reintento sin duplicados y conflicto 412 sin pérdida de valores. Capturar KPI/snapshot antes/después y comprobar que el registro no cambia ninguno.
- [x] **Step 2 — Run baseline:** `npm run test:datasets`; registrar el resultado real. Esta tarea verifica la integración construida mediante los ciclos RED/GREEN de Tasks 1–7: si ya pasa, no fabricar un fallo ni afirmar un RED inexistente.
- [x] **Step 3 — Complete integration:** corregir únicamente diferencias con API-002/DM-002 y estados de Stitch. axe en catálogo, wizard, ficha, edición, desktop y móvil 390px; navegación por teclado y scroll de tabla sin desbordar documento. Simular connector caído después de observar, sin detener el contenedor compartido: guardar sigue funcionando desde snapshot. Para demostrar reinicio/persistencia utilizar TestClient nuevo con el mismo archivo en backend tests; no prometer persistencia basándose sólo en recarga web. No ampliar alcance a US-003.
- [x] **Step 4 — Run final verification:** desde backend `uv run --extra test --frozen pytest -p no:cacheprovider` y después con BI_TEST_POSTGRES=true (secretos sin imprimir); desde codebase `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=15000`, `npm run typecheck`, `npm run build`, `npm run test:datasets`, `npm run test:sources`, `npm run test:smoke -- --workers=1`, `npm run test:api-integration -- --workers=1`. Configurar PLAYWRIGHT_EXECUTABLE_PATH si hace falta. Todo sin fallos; documentar skips/advertencias reales. No sumar resultados históricos como evidencia nueva. Los puertos ocupados se resuelven sin matar procesos ajenos.
- [x] **Step 5 — Review and checkpoint:** comparar código con DS-D01..09, DM2-D01..06 y DS-T01..10; realizar revisión del conjunto según método elegido. README con arranque, pruebas y rollback no destructivo; ledger con evidencia real, no aprobación productiva. No capturas con contraseñas ni payloads sensibles. Checkpoint `test: verify dataset registry end to end`.

## Plan self-review

- Cobertura: DTO/estados Task 1; esquema/backup Task 2/4; procedencia Task 3;
  transacciones/replay/consulta Task 4; contrato/permisos/límites Task 5;
  catálogo/ficha Task 6; alta/edición Task 7; integración y regresión Task 8.
- Review Focus: cada uno de los cinco casos tiene un test en la tarea indicada.
- Interfaces: los DTOs se fijan en Task 1, observaciones en Task 3, servicio en
  Task 4, HTTP en Task 5 y tipos/cliente UI en Task 6; no depender de APIs implícitas.
- Revisión pendiente al autorizar ejecución: usar ejemplos reales de fixtures
  del repo, no copiar nombres de fixture inexistentes desde otro contexto.
- Esta sección conserva la revisión documental previa del plan. Ejecución real,
  pruebas y revisión independiente se registran en
  [.superpowers/sdd/2026-10-16-us-002-dataset-registry-plan/progress.md](../../../.superpowers/sdd/2026-10-16-us-002-dataset-registry-plan/progress.md).

## Execution handoff

Plan aprobado por el usuario el 2026-10-16 mediante «si» a ejecutar aquí.
Método elegido: **Native**, ejecución inline con revisión independiente al cierre.
Sin HEAD Git, se trabaja en el workspace actual aprobado y se conservan checkpoints
en el ledger propio; no crear un commit inicial con archivos ajenos.
Las interfaces se ejecutan secuencialmente con executing-plans y TDD; no se
delegan implementaciones. La revisión de cierre utiliza un único contexto
independiente. No se publica, fusiona ni hace commit masivo de este workspace.
