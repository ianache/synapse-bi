# BI Analytics Frontend

Monorepo de la primera implementación frontend de BI Analytics Platform.

## Estructura

- `apps/bi-analytics`: shell, ruta dashboard, estados de experiencia y adaptador mock semántico.
- `apps/storybook`: catálogo visual y documentación ejecutable.
- `packages/design-system`: componentes React organizados con Atomic Design.
- `packages/tokens`: temas y tokens CSS compartidos.
- `packages/config`: configuración base de TypeScript y Vitest.

La aplicación y Storybook consumen los mismos exports públicos de `@bi-analytics/design-system`; los componentes no conocen APIs ni motores analíticos.

## Comandos

Desde `codebase/`:

```bash
npm install
npm run dev
npm run test
npm run test:accessibility
npm run test:smoke
npm run typecheck
npm run build
npm run storybook
npm run build-storybook
```

Si el entorno no expone un navegador gestionado por Playwright, puede definirse opcionalmente `PLAYWRIGHT_EXECUTABLE_PATH`.

El adaptador mock implementa `SemanticAdapter`, por lo que puede reemplazarse por un adaptador de Semantic API sin cambiar los componentes base.

## Registro de datasets (US-002)

Rutas conectadas a Python: `/datasets` (catálogo paginado), `/datasets/nuevo`
(origen observado → metadatos), `/datasets/:id` (ficha) y
`/datasets/:id/editar`. El explorador de fuentes permite iniciar el registro.
Usan las pantallas aprobadas de [Stitch](../docs/ux/us-002/README.md), con estados
reales de carga, error, vacío y conflicto; nunca usan fixtures como fallback.

Guardar borrador permite gobierno incompleto; Registrar exige los mínimos
declarados. Ambos conservan validación pendiente y frescura/calidad sin evaluar.
Preparado y Medallion son declaraciones explícitas, no inferencias por vista/gold.
No se publican KPI/modelos ni se ejecutan pipelines. Origen y tipo son inmutables;
para cambiarlos se crea otro dataset. Los reintentos conservan clave en memoria;
un conflicto de versión conserva los cambios y permite recarga con confirmación.

Con el laboratorio activo: `npm run test:datasets` inicia servidores exclusivos
8002/5182 y SQLite `backend/data/dataset-browser-tests.db`; no reutiliza servicios
salvo `BI_DATASET_REUSE_SERVERS=true`. Traces desactivadas y contraseñas sólo en
memoria de la prueba. Chrome puede configurarse con PLAYWRIGHT_EXECUTABLE_PATH.
La suite verifica recuperación en contexto nuevo, registro/edición, prepared,
Medallion, permisos y axe en escritorio/móvil. La prueba backend de reinicio
demuestra persistencia sin depender de una recarga del navegador.

Los tests previos aceptan puertos alternativos mediante BI_SOURCE_TEST_API_PORT /
BI_SOURCE_TEST_UI_PORT y BI_API_TEST_API_PORT / BI_API_TEST_UI_PORT para no
interferir con servidores ya abiertos.

## Administración de fuentes PostgreSQL

Implementadas las cuatro pantallas de Stitch para US-001, conectadas al backend
Python: listado, registro con prueba de conexión, detalle con historial y
explorador de observaciones técnicas. Requieren API, no usan fuentes simuladas.

| Ruta | Experiencia |
| --- | --- |
| `/fuentes` | Fuentes persistidas de la organización; búsqueda, filtro, vacío y error. |
| `/fuentes/nueva` | Validar acceso PostgreSQL antes de registrar. |
| `/fuentes/:id` | Conexión, estado, observación e historial. |
| `/fuentes/:id/editar` | Actualizar parámetros/credencial tras validarlos de nuevo. |
| `/fuentes/:id/esquema/:observationId` | Tablas, vistas, columnas, claves compuestas, relaciones y comentarios. |

Seguir [backend/README.md](backend/README.md) para iniciar API y frontend en
modo desarrollo explícito. La persona local `data-admin` habilita los permisos
de administración; no es una sesión productiva. Las credenciales se cifran,
no se devuelven ni se guardan en localStorage. La observación sólo consulta
metadatos y no publica datasets/KPI ni redirige las consultas del analista.

Pruebas con PostgreSQL local preparado: `npm run test:sources` (puertos
8001/5181, Chrome opcional con PLAYWRIGHT_EXECUTABLE_PATH). Los checks de
navegador bloquean sólo fuentes externas para evitar esperas de terceros;
las capturas usan la tipografía fallback. `BI_SOURCE_REUSE_SERVERS=true` permite
reutilizar deliberadamente esos servidores; por defecto las pruebas los inician.

Controles, contrato y pendientes de producción:
[SRC-001](../knowledge-base/design/api-security/SRC-001-postgresql-source-registry.md).

## Experiencia del analista: KPI y dashboards

Para preparar una fuente analítica PostgreSQL consultable, usar
[`case-study/README.md`](case-study/README.md): Docker Compose, modelo Gold de
ventas, devoluciones, sesiones e inventario, y usuarios de sólo lectura por
tenant. Esta fuente de estudio todavía no está conectada al ejecutor del backend.

El recorrido también puede ejecutarse con un backend Python persistente. Ver
[`backend/README.md`](backend/README.md) para arrancar FastAPI y activar
`VITE_DATA_SOURCE=api`. En ese modo el dashboard consulta valores calculados y
los filtros de período/canal usan la API. El modo local descrito abajo sigue
siendo la opción por defecto cuando no se activa esa integración.

Pantallas implementadas a partir del proyecto Stitch `4378861557064448535`,
pantallas `780d7b8cb45a4534830f9ca8cad34be6` (Explorar KPI) y
`93bbb7eb7e0c4f9c86a1baff653ad528` (Añadir KPI al dashboard).

| Ruta | Experiencia |
| --- | --- |
| `/` o `/explorar` | Buscar KPI por nombre/sinónimo, filtrar categoría/propietario, ordenar y consultar definición y lineage de ejemplo. |
| `/kpi/kpi_fin_net_revenue/agregar` | Elegir destino para Ingresos netos o crear un dashboard personal. |
| `/dashboards` | Navegar dashboards disponibles en la demostración. |
| `/dashboards/:id` | Revisar los KPI añadidos al dashboard. |
| `/dashboard` | Dashboard de demostración original. |
| `/login` | Inicio de sesión existente. |
| `/componentes` | Kit de componentes existente. |

El recorrido soporta navegación atrás/adelante, confirmación de guardado,
prevención de duplicados, destinos de sólo lectura, búsqueda sin resultados y
reintento si falla el almacenamiento. El formulario de creación valida nombre
vacío y nombres duplicados. El detalle usa un diálogo nativo con cierre mediante
Escape y restitución del foco.

### Datos e integración

Esta entrega es una experiencia frontend con fixtures explícitos: no certifica
métricas ni aplica autorización de producción. El catálogo de ejemplo está en
`src/domain/kpis.ts` dentro de la aplicación. Los dashboards y referencias a KPI
se guardan en `localStorage` mediante `src/adapters/localDashboards.ts`, bajo
`synapse-bi.demo-dashboards.v1`. Se pueden restablecer borrando esa clave desde
las herramientas del navegador.

La integración de producción debe reemplazar ese adaptador por una API que
resuelva identidad/tenant, permisos de lectura y edición, versiones del modelo
semántico y consultas. Los KPI añadidos se muestran sin valores inventados hasta
conectar el motor de consulta. US-003 incorpora el catálogo semántico declarativo
local cuando se habilita API; Glosario y Lineage globales siguen como capacidades
próximas. El detalle del KPI de demostración incluye un lineage ilustrativo.

### Verificación

US-003: catálogo configurable disponible en `/catalogo-semantico` con API de
desarrollo habilitada; no sustituye KPI publicados/fixtures ni ejecuta fórmulas.
Guía de arranque y prueba manual en [UX US-003](../docs/ux/us-003/README.md).
`npm run test:semantic-catalog` usa backend/frontend propios (8006/5186 por defecto)
y una base SQLite temporal distinta en cada ejecución; no reutiliza servicios.

```powershell
npm run typecheck
npm test
npm run build
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:smoke
```

La suite de navegador cubre el journey completo, persistencia tras recarga,
historial, creación de destino, teclado y chequeos axe en escritorio y móvil.
