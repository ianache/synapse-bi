# US-003 Semantic Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir crear dominios propios, dimensiones, medidas y KPI en borrador, reutilizar componentes y cambiar un KPI mediante copia sin alterar a otros consumidores.

**Architecture:** Ampliación modular de FastAPI y del control plane SQLite existente, separada del catálogo KPI sintético y de su ejecutor. React consume el catálogo nuevo y reutiliza shell, identidad y componentes visuales. PostgreSQL sigue como fuente de datasets US-002; guardar semántica no conecta a la fuente ni ejecuta fórmulas.

**Tech Stack:** Python >=3.12, FastAPI/Pydantic/SQLite con dependencias de `codebase/backend/uv.lock`; React/TypeScript/Vite, Vitest/Testing Library, Playwright/axe existentes. Sin nuevas dependencias de producto previstas.

**Spec:** [Diseño US-003](../specs/2026-10-16-us-003-semantic-catalog-design.md), [IMD-002](../../../knowledge-base/business/information-model/IMD-002-catalogo-semantico.md), [RCP-002](../../../knowledge-base/requirements/context-packs/RCP-002-us-003-definicion-semantica.md), [D01–D05](../../ux/us-003/decisions.md).

Fecha: 2026-10-16. Actualización SEM-US003-D06: **conformidad local con diseño y
plan; método nativo elegido, revisión independiente final**. T1 conserva su gate
de revisión de contratos/pantallas nuevas: ningún código de producto antes de cerrarlo.
Este documento no declara completa la historia madre ni gobierno productivo.

## Global Constraints

- D01–D05 y R-01 a R-08 ya aceptadas: no volver a solicitarlas ni convertirlas en supuestos.
- Dominio requiere nombre; dimensión/medida requiere nombre y dominio; KPI requiere nombre y dominio. Ausencias permitidas son pendientes, no valores inventados.
- Cada dimensión/medida pertenece a un dominio y declara cero o un dataset. Un dominio/dataset puede relacionarse con varios componentes.
- Referencias KPI↔dimensiones y KPI↔medidas: 0..N : 0..N. Declaradas, deben existir y estar autorizadas incluso en borrador.
- Un componente utilizado no admite modificación directa: copia independiente y actualización explícita de cada KPI, sin propagación.
- Un componente puede originar varias copias; cada copia tiene un único origen. No confundir procedencia de copia con consumidor.
- Guardar no publica, certifica, valida significado ni calcula. No escribir en Gold ni sustituir KPI/dashboard sintéticos.
- No añadir entidades generales, jerarquías, pipelines, SQL, ejecución de fórmulas, IA ni publicación de US-004/005 en este incremento.
- Tenant desde identidad verificada; owner declarado no concede permisos. Sin credenciales, parámetros de conexión ni filas de negocio en objetos, errores o logs.
- Reutilizar transacciones/auditoría; lecturas de agregados consistentes, creaciones/copias idempotentes y ediciones con control optimista de versión.
- Propuestas del diseño §§3–9 se implementan sólo tras T0: fórmula textual, completitud, mismo dominio, par dataset/columna, protección permanente tras primer uso, ausencia de borrado, vínculo histórico y permisos locales.
- Límites, DTO, códigos de error y scopes exactos se fijan en T1 y se revisan antes de T2. No heredar ciegamente los límites de US-002 ni inventarlos durante programación.

## Review Focus

1. Referencias mezcladas de tenant/tipo/dominio: rechazo sin nombres ni consumidores ajenos (T3/T4).
2. Primera referencia concurrente con edición de componente: ningún KPI observa una definición alterada silenciosamente (T3).
3. POST con respuesta perdida, reintento y posterior edición: un solo alta/copia; replay no sobrescribe la versión actual (T3/T5).
4. Dataset editado tras la vinculación: conservar procedencia histórica, avisar y no reanclar al guardar otro campo del KPI (T3/T6).
5. Navegación, doble clic, respuesta fuera de orden y conflicto mientras se edita: preservar formulario y no aplicar resultados a otra ficha (T5/T6).

## Estructura de archivos y dependencias

Rutas relativas a la raíz del repositorio. Los archivos nuevos son propuestas de
descomposición, no existen ni se han implementado por estar enumerados aquí.

| Unidad | Crear | Modificar / reutilizar |
| --- | --- | --- |
| Acuerdos/contratos | `knowledge-base/design/api-contracts/API-003-semantic-catalog.md`; `knowledge-base/design/data-models/DM-003-semantic-catalog.md`; `docs/ux/us-003/README.md` | Diseño escrito, decisiones, RCP-002 e índice |
| DTO y reglas | `codebase/backend/synapse_api/semantic_catalog/{__init__,schemas,policy}.py` | Patrones de `datasets/schemas.py`, `datasets/policy.py` |
| Persistencia | `codebase/backend/synapse_api/semantic_catalog/{migration,repository}.py` | `codebase/backend/synapse_api/database.py` |
| Operaciones | `codebase/backend/synapse_api/semantic_catalog/{bindings,service}.py` | Lectura de registro de datasets, `dashboards.audit`, `auth.Principal`, `errors.ApiError` |
| HTTP/seguridad | `codebase/backend/synapse_api/semantic_catalog/{router,body_limit}.py` | `codebase/backend/synapse_api/{app,auth}.py` |
| Cliente | `codebase/apps/bi-analytics/src/domain/semanticCatalog.ts`; `adapters/semanticCatalogRepository.ts`; `hooks/useSemanticCatalogResource.ts` | `adapters/apiRepository.ts`; sin reemplazar `domain/semantic.ts` existente |
| UI | `codebase/apps/bi-analytics/src/pages/semantic-catalog/{SemanticCatalogWorkspace,CatalogList,DomainForm,ComponentForm,KpiDefinitionForm,SemanticDetail,CopyComponentDialog}.tsx`; `semantic-catalog.css` | `app/routes.tsx`, `components/SynapseShell.tsx`; design system existente |
| Pruebas | Backend `tests/test_semantic_catalog_{policy,migration,service,concurrency,api,restart}.py`, `tests/semantic_catalog_fixtures.py`; frontend tests junto a los archivos; `codebase/tests/semantic-catalog-integration/catalog.spec.ts`; `codebase/playwright.semantic-catalog.config.ts` | `codebase/package.json`, documentación backend y workspace |

Secuencia: **T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7**. Evitar trabajo paralelo
sobre archivos compartidos `app.py`, `database.py`, rutas y autenticación.
Método elegido en D06: ejecución nativa y revisión independiente final; interfaces
y transacciones están estrechamente relacionadas.

## Convenciones y preflight de ejecución

- Leer spec, decisiones, API-003/DM-003 una vez preparados; revisar estado Git y aislamiento con using-git-worktrees al ejecutar, no al redactar el plan.
- Preservar cambios existentes; no incluir trabajo ajeno en commits. Los commits de cada tarea son puntos de revisión, no autorización para publicar/push.
- Backend: comandos desde `codebase/backend`, usando `.venv\Scripts\python.exe -m pytest`. Frontend: desde `codebase`.
- Capturar resultados RED y GREEN de cada ciclo; un fallo por entorno no demuestra que la prueba nueva detecte la ausencia del comportamiento.
- Datos de pruebas en directorios temporales. Migraciones/restore sólo sobre copias descartables; no tocar bases de validación manual ni detener servidores del usuario.
- No leer/imprimir `.docker-secrets`. Integración PostgreSQL real sólo mediante el mecanismo opt-in existente y sin secretos en traces/artifacts.
- Si una interfaz cambia en T1, actualizar este plan y sus pruebas antes de implementarla; no interpretar firmas propuestas como contrato ya aprobado.

## T0 — Cerrar diseño funcional y alcance del incremento

**Files:** modificar diseño escrito, `docs/ux/us-003/decisions.md`, RCP-002 e IMD-002; revisar `knowledge-base/business/glossary/terms/TRM-0024-dominio.md`.

**Interfaces:** consume D01–D05; produce decisiones explícitas sobre las propuestas pendientes de §§3–9 y alcance aprobado para T1. No produce código ni verificación empresarial ficticia.

- [ ] Presentar las decisiones pendientes agrupadas: corte sin entidades generales, completitud/fórmula textual, compatibilidad de dominio/mapeo, protección tras retirar referencias, vínculo histórico/sin borrado y permisos locales data-admin.
- [ ] Registrar aceptación o cambios del usuario con su alcance exacto. Revisar definición de Dominio y responsabilidad pendiente sin reabrir su incorporación aprobada.
- [ ] Corregir spec/contexto y matriz de cobertura del plan cuando alguna propuesta cambie. No imponer owner nominal ni cerrar GQ-03 para la historia madre.
- [ ] Obtener revisión del diseño escrito y del plan, y elección de método de ejecución. Si no se aprueban, detener producto y continuar sólo ajustes documentales solicitados.

**Salida comprobable:** decisiones trazables y revisión explícita; no basta un checkbox del agente. Guardar checkpoint documental sin incluir cambios ajenos.

## T1 — Contratos, modelo físico y recorrido UI listos para desarrollar

Artefactos preparados, pendientes de revisión:
[API-003](../../../knowledge-base/design/api-contracts/API-003-semantic-catalog.md),
[DM-003](../../../knowledge-base/design/data-models/DM-003-semantic-catalog.md),
[UX](../../ux/us-003/README.md). API-003 §§2–6 fija las firmas HTTP, DTO, límites,
completitud, scopes y errores propuestos para T2–T6. Este enlace evita duplicar
tablas de valores; si la revisión cambia el contrato se actualizan tareas/pruebas.

**Files:** crear API-003, DM-003, `docs/ux/us-003/README.md`; modificar índice/changelog y este plan si cambia una interfaz.

**Interfaces:** consume T0 y registro US-002; produce DTO y operaciones aprobados, esquema/migración aditiva y pantallas/estados aceptados. Referencia HTTP propuesta: `/api/v1/semantic-catalog` separado de `/kpis` actual.

- [ ] Especificar CRUD sin DELETE para dominios/componentes/KPI, listado/consulta de consumidores y POST de copia; fijar DTO camelCase, paginación, unicidad, límites y allowlist de campos. Detallar mínimos frente a completitud, copy origin y vinculaciones históricas.
- [ ] Especificar semántica de Idempotency-Key (scope, fingerprint, vigencia y replay), If-Match/ETag, respuestas de error seguras, límites de cuerpo incluso streaming y matriz exacta de scopes. Cubrir referencias cruzadas y agotamiento de almacenamiento.
- [ ] Diseñar DM-003 sobre SQLite del control plane: migración propuesta v4, aislamiento por tenant, referencias, nombres normalizados, snapshot del vínculo, protección/versión, idempotencia y auditoría en la misma transacción. No crear tablas del catálogo en PostgreSQL Gold.
- [ ] Definir catálogo, formularios, detalle, copia/consumidores y estados de error/conflicto. Reutilizar lenguaje visual; si hacen falta pantallas nuevas en Stitch, generarlas en el proyecto existente tras confirmar el alcance visual y registrar enlaces/exportaciones reales, no marcarlas como ya generadas.
- [ ] Revisar consistencia funcional/API/seguridad/datos y obtener aprobación local de contratos/pantallas. Fijar los valores concretos en este plan antes de T2; guardar checkpoint documental.

**Gate:** T2–T7 bloqueadas hasta aprobar contratos y UX. Los valores exactos ya
están propuestos en API-003, no aprobados por D06 que es anterior a esos artefactos.

## T2 — Reglas de borradores y persistencia aditiva

**Files:** crear `semantic_catalog/{__init__,schemas,policy,migration}.py`; modificar `database.py`; crear `tests/test_semantic_catalog_policy.py`, `tests/test_semantic_catalog_migration.py` y fixtures.

**Interfaces propuestas:** `SaveDomain`, `SaveComponent`, `SaveKpiDefinition` y sus DTO de lectura en schemas; `normalize_name(value: str) -> str`, `missing_metadata(kind: str, document: dict) -> list[str]` en policy; `apply_v4(connection: sqlite3.Connection) -> None` en migration. DTO finales según T1.

- [ ] Escribir `test_minimum_drafts_and_missing_metadata`: aceptar dominio sólo con nombre; componentes/KPI con nombre y dominio; pendientes explícitos; `test_rejects_blank_name_unknown_fields_and_contract_limits`: vacío, tenant inyectado y cada límite exacto de API-003. Agregar `test_unicode_name_normalization` para NFC/casefold sin transformar fórmulas/columnas.
- [ ] Escribir `test_v3_upgrade_is_additive_and_atomic`, `test_initialize_twice_is_noop`, `test_future_schema_rejected_before_changes` y `test_restore_copy_preserves_existing_records`: fuentes/datasets/KPI/dashboard/auditoría previos intactos; rollback ante fallo inyectado; copia restaurada legible.
- [ ] Ejecutar `.venv\Scripts\python.exe -m pytest tests/test_semantic_catalog_policy.py tests/test_semantic_catalog_migration.py -v`; comprobar RED específico de nuevas reglas/migración.
- [ ] Implementar DTO estrictos, reglas puras y migración transaccional; ampliar soporte de versiones de `Database.initialize()` sin saltarse migración v3 ni reescribir datos previos.
- [ ] Repetir comando y exigir GREEN; commit acotado `feat: add semantic catalog drafts and additive schema`.

## T3 — Agregado transaccional, vínculos, copia y consumidores

**Files:** crear `semantic_catalog/{repository,bindings,service}.py`; crear `tests/test_semantic_catalog_{service,concurrency,restart}.py`; ampliar fixtures de T2.

**Interfaces propuestas:** `SemanticCatalogService(database: Database)` con `create_domain(user, body, key, request_id) -> Domain`, `create_component(...) -> Component`, `create_kpi(...) -> KpiDefinition`, `get(user, kind, item_id) -> CatalogItem`, `list(user, filters) -> CatalogPage`, `update(user, kind, item_id, body, if_match, request_id) -> CatalogItem`, `copy_component(user, component_id, body, key, request_id) -> Component`, `consumers(user, component_id) -> ConsumerPage`. `user: Principal`, `key/request_id/item_id: str`, DTO/tipos finales definidos en schemas/T1. Métodos de repositorio reciben conexión y Principal; nunca abren una transacción independiente.

- [ ] Escribir `test_custom_domain_shared_component_copy_changes_one_kpi`: dos KPI referencian la misma medida; edición directa rechazada; copia tiene origen y ningún consumidor; cambiar primer KPI mantiene referencias del segundo y definición original. Probar ausencia de referencias en borrador y múltiples copias.
- [ ] Escribir `test_binding_snapshot_survives_dataset_edit`: retirar columna del dataset informa vínculo desactualizado sin reanclado; editar título de KPI conserva snapshot; cambiar vínculo valida selección vigente. `test_declared_reference_requires_visible_type_and_domain`: rechazar ID inexistente/ajeno/tipo incorrecto y política de dominio de T1, sin revelar datos.
- [ ] Escribir `test_replay_does_not_duplicate_or_overwrite_later_edit`, `test_stale_version_cannot_overwrite`, `test_audit_failure_rolls_back`, `test_first_reference_races_component_update` y `test_aggregate_read_uses_one_snapshot`. Usar dos conexiones y barreras deterministas, no sleeps: sólo resultados serializables válidos; ninguna modificación posterior a protección. Si T0 acepta protección permanente, probarla tras retirar última referencia.
- [ ] Ejecutar `.venv\Scripts\python.exe -m pytest tests/test_semantic_catalog_service.py tests/test_semantic_catalog_concurrency.py tests/test_semantic_catalog_restart.py -v`; comprobar RED. Implementar con `Database.connect(write=True)` y transacciones de lectura explícitas; resolver dataset autorizado dentro de la misma conexión. Escribir protección/referencias/replay/auditoría atómicamente, sin llamada al conector PostgreSQL.
- [ ] Exigir GREEN y prueba de reinicio sobre base temporal: recuperar dominio/componentes/KPI, versiones, copia y replay; commit `feat: persist semantic definitions and safe component copies`.

## T4 — HTTP, permisos y errores seguros

**Files:** crear `semantic_catalog/{router,body_limit}.py` y `tests/test_semantic_catalog_api.py`; modificar `synapse_api/{app,auth}.py` sin cambiar las rutas KPI existentes.

**Interfaces:** `semantic_catalog_router(service: SemanticCatalogService) -> APIRouter`; middleware de límite según API-003; autorización basada en Principal y scopes ratificados en T1. Adaptar errores sin exponer payload ni rechazar silenciosamente faltantes permitidos.

- [ ] Escribir pruebas parametrizadas de cada operación: sin token, scope insuficiente, tenant ajeno, referencia ajena, cuerpo inválido, creación/replay, copia, ETag/If-Match y errores definidos en API-003. `test_analyst_receives_no_new_management_scope` protege permisos actuales.
- [ ] Agregar `test_chunked_body_limit_and_safe_errors`: límite real aun sin Content-Length o falseado; campos grandes y fórmulas no aparecen en errores/logs. `test_unavailable_storage_is_safe` devuelve respuesta prevista sin SQL/rutas internas.
- [ ] Ejecutar `.venv\Scripts\python.exe -m pytest tests/test_semantic_catalog_api.py -v`; comprobar RED, luego conectar router/servicio, scopes locales y middleware sin ampliar CORS innecesariamente.
- [ ] Repetir prueba y regresión `.venv\Scripts\python.exe -m pytest`; exigir GREEN. Comparar OpenAPI con API-003 y mantener `/kpis`, consultas y dashboards existentes sin cambios de significado.
- [ ] Commit `feat: expose tenant-scoped semantic catalog API` con evidencias de seguridad por operación.

## T5 — Cliente tipado y control de respuestas asíncronas

**Files:** crear `domain/semanticCatalog.ts`, `adapters/semanticCatalogRepository.ts`, `hooks/useSemanticCatalogResource.ts` y sus `*.test.ts(x)` en `codebase/apps/bi-analytics/src`.

**Interfaces:** `SemanticCatalogRepository` con `list`, `get`, `createDomain`, `createComponent`, `createKpi`, `update`, `copyComponent`, `consumers`, `me`; tipos equivalentes a T1/T4. Consultas aceptan `AbortSignal`; altas/copias reciben clave estable por intento lógico; actualización envía versión de la ficha. `useSemanticCatalogResource<T>(load: (signal: AbortSignal) => Promise<T>, key: string)` devuelve `{data?, error?, loading, refresh}`.

- [ ] Escribir `serializes_contract_and_preconditions`, `retains_same_key_after_uncertain_create`, `does_not_apply_out_of_order_response` y `aborts_old_resource_on_navigation`: verificar URL/headers/body exactos, error tipado, clave reutilizada sólo con el mismo contenido y ninguna respuesta antigua en la ficha nueva.
- [ ] Ejecutar `npm test -- apps/bi-analytics/src/adapters/semanticCatalogRepository.test.ts apps/bi-analytics/src/hooks/useSemanticCatalogResource.test.tsx`; comprobar RED.
- [ ] Implementar sobre ApiRepository existente, sin segundo sistema de autenticación ni fallback silencioso a fixtures. Tras replay obtener ficha vigente cuando corresponda, sin sustituirla por respuesta histórica de creación.
- [ ] Repetir comando y `npm run typecheck`; exigir GREEN, sin casts que oculten diferencias entre DTO y tipos.
- [ ] Commit `feat: add typed semantic catalog client`.

## T6 — Recorrido UI completo

**Files:** crear páginas de `pages/semantic-catalog` de la tabla y tests `CatalogList.test.tsx`, `DomainForm.test.tsx`, `ComponentForm.test.tsx`, `KpiDefinitionForm.test.tsx`, `SemanticDetail.test.tsx`, `CopyComponentDialog.test.tsx`; modificar `app/routes.tsx`, `app/routes.test.tsx`, `components/SynapseShell.tsx`.

**Interfaces:** `SemanticCatalogWorkspace({path, search}: {path: string; search: string})` coordina cliente/estado; formularios reciben DTO inicial y callbacks tipados; `CopyComponentDialog` devuelve copia creada, no reasigna KPI por su cuenta. Ruta propuesta `/catalogo-semantico`, sin interceptar `/kpis`, `/fuentes` ni `/datasets`.

- [ ] Escribir tests de dominio personalizado «Logística», altas mínimas, pendientes visibles, recuperar borradores y estados carga/vacío/403/503/duplicado/conflicto/protegido. `does_not_confuse_documented_formula_with_execution`: no mostrar valor calculado ni publicación.
- [ ] Escribir `copy_requires_explicit_kpi_reassignment`, `stale_binding_remains_visible`, `late_save_does_not_navigate_after_unmount`, `conflict_reload_requires_confirmation`, `double_submit_creates_once`: no perder cambios, bloquear edición durante recarga y no ejecutar una segunda mutación pendiente.
- [ ] Ejecutar `npm test -- apps/bi-analytics/src/pages/semantic-catalog apps/bi-analytics/src/app/routes.test.tsx`; comprobar RED. Implementar con tokens/componentes existentes, labels accesibles, foco de diálogo, mensajes y estados de las pantallas aceptadas en T1.
- [ ] Repetir comando, `npm run typecheck` y `npm run build`; exigir GREEN. Revisión visual escritorio/móvil y teclado; registrar diferencias frente a pantallas, sin afirmar que Stitch prueba accesibilidad o funcionalidad.
- [ ] Commit `feat: implement configurable semantic catalog workspace`.

## T7 — Validación integrada, revisión independiente y entrega

**Files:** crear config/suite Playwright de la tabla; modificar `codebase/package.json`, `codebase/README.md`, `codebase/backend/README.md`, `docs/ux/us-003/README.md`; registrar evidencia del plan.

**Interfaces:** script propuesto `test:semantic-catalog` ejecuta `playwright test --config playwright.semantic-catalog.config.ts`. Config toma patrón de datasets y asigna puertos disponibles propios, SQLite descartable y `reuseExistingServer=false` por defecto; traces desactivados. No usar bases/servidores de validación del usuario.

- [ ] Escribir primero pruebas navegador contra API real: dominio nuevo→dimensión/medida→dos KPI→bloqueo→copia→cambio sólo del primero→recarga; dos tenants sin acceso cruzado; sin datos calculados. Añadir teclado/axe en catálogo, formulario y diálogo, escritorio y móvil. Comprobar RED funcional antes de completar infraestructura faltante de la suite.
- [ ] Ejecutar desde backend `.venv\Scripts\python.exe -m pytest`; desde codebase `npm test`, `npm run typecheck`, `npm run build`, `npm run test:semantic-catalog`, `npm run test:datasets`, `npm run test:sources`, `npm run test:api-integration`, `npm run test:smoke`. PostgreSQL real sólo opt-in documentado. Registrar códigos de salida/conteos actuales, no copiar los de US-002.
- [ ] Realizar revisión independiente de todo el incremento: seguridad, carreras, migración/restore, idempotencia, compatibilidad y cobertura spec→pruebas; corregir hallazgos relevantes y repetir suites afectadas. No declarar revisión ejecutada si no hay evidencia.
- [ ] Entregar guía manual reproducible para «Logística» y contraste de los dos KPI, datos creados, permisos locales, limitaciones y pendientes de historia madre/producción. Guardar evidencia de cada criterio y señalar pruebas bloqueadas o no ejecutadas.
- [ ] Commit acotado `test: verify semantic catalog end-to-end journey`; cierre sólo tras GREEN y aceptación manual solicitada. No publicar ni fusionar automáticamente.

## Cobertura y definición de terminado

| Diseño / decisión | Tareas | Evidencia requerida |
| --- | --- | --- |
| §§1–4, D01/D03/D05: configuración y relaciones | T0–T3, T6–T7 | Dominio propio, referencias opcionales/reutilizables y persistencia |
| §5, D02/D04: borradores y completitud | T0–T2, T5–T7 | Mínimos, faltantes, fórmula sin ejecución y referencias inválidas rechazadas |
| §6, D04/D05: protección/copia | T0–T4, T6–T7 | Dos KPI, copia independiente, carreras y ninguna propagación |
| §7: vínculos históricos | T0–T3, T6–T7 | Dataset editado sin reanclado silencioso |
| §§8–9: integración/seguridad | T1–T5, T7 | Migración/restore, replay, versiones, aislamiento, errores seguros |
| §§10–11: UX/verificación | T1, T5–T7 | Estados asíncronos, navegador, teclado/axe y regresión |
| §12: revisión y límites de aprobación | T0–T1 | Aprobaciones explícitas; US-004/005 y entidades generales fuera del cierre |

Autorrevisión documental: se cubrieron las secciones de la spec y los cinco riesgos
de Review Focus, con pruebas asignadas. Interfaces propuestas se concentran en T1
antes de código; este plan queda condicionado a sus contratos, no listo para
ejecución desatendida. No hay pruebas de producto nuevas ejecutadas en esta etapa.
