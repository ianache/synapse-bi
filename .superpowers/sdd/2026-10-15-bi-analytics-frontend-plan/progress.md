# SDD ledger — plan: docs/superpowers/plans/2026-10-15-bi-analytics-frontend-plan.md

Pre-flight: no isolated worktree was created because the repository has no commits; implementation remains scoped to the approved `codebase/` directory.
Pre-flight interfaces: Task 2 consumes Task 1 workspace names/scripts; Task 3 consumes Task 2 tokens/types; Task 4 consumes Task 3 exports; Task 5 consumes Task 2 contracts and Task 4 components; Task 6 consumes Task 4 public exports; Task 7 consumes Tasks 5–6 commands.

Task 6: Ruling: use `tokens.stories.tsx` instead of MDX — the minimal Storybook install has no MDX indexer and the spec requires token documentation, not a specific file format — cost if wrong: richer MDX documentation would require adding and maintaining an additional Storybook addon.

Final review: independent reviewer found no Critical issues and Important issues covering filtering, stale requests, experience states, Storybook docs/controls, accessibility, responsive layout, contrast, public placeholder contracts and smoke portability. Fix pass started.

Task 1: complete (workspace scaffold valid; npm dependencies installed)
Task 2: complete (2 focused tests pass)
Task 3: complete (2 focused component tests pass)
Task 4: complete (3 focused organism/template tests pass)
Task 5: complete (3 focused app tests pass; Vite build pass)
Task 6: complete (Storybook contract pass; Storybook build pass)
Task 7: complete (12 test files / 13 tests pass; typecheck pass; app build pass; 2 smoke tests pass)

Final: fixed filter no-op and empty state — DashboardPage filter test RED→GREEN, suite 13/13.
Final: fixed stale request overwrite — useDashboardQuery out-of-order test RED→GREEN, suite 13/13.
Final: fixed responsive layout and dark-theme contrast — responsive CSS and axe smoke RED→GREEN, smoke 2/2.
Final: fixed Storybook Docs/Controls configuration — addon-essentials build pass.
Final: fixed public placeholder contracts — controlled FilterField/DateRangePicker and DataTable row callback, typecheck pass.
Final: fixed smoke portability — optional PLAYWRIGHT_EXECUTABLE_PATH, smoke 2/2.
Final: fixed Storybook state/responsive coverage — added stale, unauthorized, error and responsive stories; Storybook contract/build pass.
Final: minor (deferred): token catalog still uses a compact initial token set; typography and breakpoint token expansion remains a follow-up outside the first demonstrable increment.
## 2026-10-16 — Reconstrucción visual del catálogo Stitch

Se corrigió la anterior afirmación de equivalencia: tener tokens y exports no validaba fidelidad visual. Se reconstruyó `ComponentKitShowcase` con la composición de la biblioteca de Stitch, usando los mismos átomos, moléculas y organismos públicos. El dashboard de `/` no se reemplaza; el catálogo está en `/componentes` y en Storybook `stitch-component-kit--completo`.

Cambios: CSS compartido importado por la librería, fuentes reales, iconos SVG, switches visuales, checkbox indeterminado, variantes de badge, búsqueda con acción, KPI y filas de lista; tabla funcional con búsqueda, ordenamiento, selección, exportación y paginación; perfil, navegación inferior y diálogo nativo.

Validación de esta iteración: 13 archivos / 17 tests pasan; typecheck pasa; Vite build pasa; Storybook build pasa. Inspección en navegador del catálogo desktop y móvil de 390px, paginación de filas reales y ausencia de desbordamiento horizontal del documento en móvil. Se excluyen `storybook-static` y `dist` del watcher de Storybook; servidor reiniciado con la nueva configuración. No se declara igualdad de píxel exacta. Las fuentes requieren acceso a Google Fonts (fallback Arial documentado).

## 2026-10-16 — Implementación de fuentes PostgreSQL (US-001, incremento local)

Se implementaron las cuatro pantallas diseñadas en Stitch 4378861557064448535:
listado `/fuentes`, registro, detalle/historial y explorador de esquema. Se añadió
edición de conexión/credencial, sin devolver el secreto. El estilo Crimson Slate
se mantuvo y los ejemplos de conexiones se sustituyeron por datos persistidos.

Backend: conector psycopg 3.3.6 de sólo metadatos, credenciales Fernet, destinos
autorizados e IP fijada por operador, TLS verificado fuera del laboratorio local,
prueba previa ligada a conexión/tenant/subject y con vencimiento, scopes separados,
edición con versión e historial inmutable. Migración SQLite v1→v2 aditiva; no se
borraron dashboards ni fuentes existentes. No se publica semántica ni se ejecuta
SQL del cliente. La cuenta PostgreSQL debe carecer de escritura/privilegios altos.

Verificación de esta iteración:

- Backend final: **36 pruebas aprobadas**, incluida integración opt-in contra
  PostgreSQL Docker real. Gold: 12 tablas, 4 vistas; fact_sales: 16 columnas,
  PK compuesta y 6 FK. Advertencia existente de deprecación httpx/Starlette.
- Frontend: **32 pruebas aprobadas**, 17 archivos, con
  `npm test -- --maxWorkers=2 --minWorkers=1 --testTimeout=15000`.
  Las primeras ejecuciones bajo carga excedieron 5 segundos en un test previo
  del dashboard; aislado pasó sin modificar su implementación ni sus tests.
- **7 smoke aprobadas**: recorrido KPI anterior, teclado, accesibilidad y móvil.
- **2 pruebas E2E nuevas aprobadas** con PostgreSQL real: prueba/registro,
  invalidación al cambiar parámetros, persistencia tras recarga, observación,
  columnas/relaciones, búsqueda y fallo de credenciales que impide registrar.
- TypeScript y build Vite verificados. Capturas en
  `codebase/test-results/source-screens` (ignoradas por Git), sin contraseñas.
  Los tests nuevos bloquean fuentes Google externas y usan fallback para
  independizarse de la disponibilidad de terceros; no hay igualdad de píxel declarada.
- Se corrigieron contrastes detectados por axe, navegación móvil (4 enlaces en
  dos filas) y acceso por teclado al contenedor de tabla desplazable. Esquema y
  formulario pasan axe; documento sin desbordamiento horizontal a 390px.

API/UI del entorno de comprobación: 127.0.0.1:8001 y 127.0.0.1:5181,
base separada `backend/data/source-browser-tests.db`. Las fuentes E2E quedan
persistidas en esa base de pruebas, sin modificar el conjunto Gold.

Revisión de seguridad y contrato: `knowledge-base/design/api-security/SRC-001-postgresql-source-registry.md`,
draft / REQUIRES_REVIEW. No se afirma aprobación de PO/ADR, SSO productivo ni
US-001 completa en producción. Pendientes: IAM real, gestión/rotación de claves,
egress, cuotas/rate limiting, operación del control plane y políticas de metadatos.
Próximo incremento funcional: US-002, datasets explícitos desde una observación.

## 2026-10-16 — Conformidad del recorrido US-001 y propuesta visual US-002

El usuario expresó conformidad con el recorrido de US-001 en la conversación
y autorizó generar pantallas necesarias en Google Stitch. No se trasladó esa
conformidad a una aprobación productiva, de seguridad ni de políticas de US-002.

Se generaron cuatro diseños desktop: catálogo de datasets, selección de origen,
formulario de metadatos y ficha con linaje. Se reutilizó Crimson Slate Minimal
en el proyecto 4378861557064448535. En la revisión se corrigieron dos variantes
que habían introducido fuentes Snowflake ajenas al PostgreSQL implementado.
IDs vigentes, capturas y alcance: `docs/ux/us-002/README.md`.

Diseño pendiente de revisión del usuario. La propuesta permite borradores con
metadatos incompletos y distingue declaración, completitud, evaluación y
aprobación. La política requiere confirmación (US-002-Q1); frescura conserva
GQ-02 abierta. No se modificó frontend/backend ni se declara US-002 implementada.

## 2026-10-16 — Confirmación de borradores US-002

El usuario confirmó permitir guardar borradores con metadatos incompletos,
mostrando los pendientes y sin considerarlos aprobados. Se registró como
UX-US002-D01 en `docs/ux/us-002/README.md`. Resuelve parcialmente US-002-Q1;
no equivale a aprobación de la taxonomía, responsables, frescura, publicación
ni del diseño técnico completo. US-002 sigue sin implementación de producto.

## 2026-10-16 — Propuestas de API y persistencia US-002

Se inspeccionaron el esquema SQLite v2, fuentes/observaciones, scopes y adaptador
existentes. Se propuso ampliar el registro local sin escribir en Gold ni migrar
el backend completo a otro motor. IMD-001 documenta conceptos/relaciones;
API-002 define DTOs, borradores/registro, filtros, permisos, errores, idempotencia
y edición optimista; DM-002 propone cuatro tablas y migración v3 aditiva.

Todas las decisiones nuevas son propuestas salvo UX-US002-D01. API-002/DM-002
quedan draft/REQUIRES_REVIEW; no hay aprobación del contrato ni modelo físico.
El mínimo de registro no borrador se propone explícitamente para revisión.
No se implementaron endpoints, frontend ni migración. Siguiente paso: revisión
del diseño técnico antes de elaborar el plan de implementación.

Verificación documental US-002: 3 documentos draft, 20 referencias/enlaces
locales válidos e índice sin encabezados duplicados. check_model.py: 4 conceptos
en diagrama, 4 relaciones, 0 errores/avisos; linaje es un quinto concepto derivado.
Mermaid CLI 11 renderizó el diagrama a SVG, código 0. IM-Q1/IM-Q2 registran los
términos exactos pendientes de glosario (Fuente de datos y Observación técnica).
No se atribuyen estos resultados a pruebas de software ni a aprobación humana.

## 2026-10-16 — Diseño local US-002 aprobado; plan preparado

El usuario respondió «aprobado» al contrato API-002 y modelo DM-002 para
preparar el plan. Se registró UX-US002-D02 sin fabricar aprobación productiva
ni verificación humana nominal. Se aceptan los mínimos de registro no borrador
para este incremento; registro sigue siendo distinto de validación de gobierno.

Plan: `docs/superpowers/plans/2026-10-16-us-002-dataset-registry-plan.md`.
Ocho tareas: DTO/política; migración; observaciones; servicio transaccional;
HTTP/permisos; catálogo/ficha; wizard/edición; E2E/regresión/entrega. En la
autorrevisión se corrigió la dependencia de ApiError.details para que esté
disponible antes del servicio de política, sin adelantar el handler HTTP.

Estado: plan pendiente de revisión del usuario y elección de método. Se
recomienda ejecución nativa por dependencias encadenadas. No se inició código,
migración ni pruebas de producto. Repo sin HEAD en la comprobación actual;
no se creó un commit inicial ni se añadieron materiales ajenos a Git.

Verificación del plan US-002: ocho tareas, cuarenta pasos pendientes, dieciséis
enlaces locales válidos y sin encabezados duplicados en los cuatro documentos
revisados. API-002/DM-002 conservan draft/REQUIRES_REVIEW y trazan UX-US002-D02.
Esta comprobación es documental; no implica ejecución de tareas ni tests de producto.
