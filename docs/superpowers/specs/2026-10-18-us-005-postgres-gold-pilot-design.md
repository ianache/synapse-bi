# US-005 — Piloto de serving PostgreSQL Gold

**Estado:** Aprobada para planificación por `human:ianache`
**Fecha:** 2026-10-18
**Contexto:** [ACP-001](../../../knowledge-base/architecture/context-packs/ACP-001-us-005-serving-gold-pilot.md)
**Historia:** [US-005](../../../knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md)

## 1. Objetivo

Extender el API de consulta semántica existente con un camino opcional y
estrictamente acotado al caso sintético de PostgreSQL Gold, y medir ese recorrido
API→autorización→PostgreSQL como línea base de laboratorio. SQLite continúa como
modo actual y predeterminado.

La aprobación humana del diseño seleccionó un adaptador PostgreSQL limitado a
un KPI/vista. No se creará un motor genérico ni se ejecutarán SQL del usuario,
bindings semánticos arbitrarios o borradores de US-003/US-004.

## 2. Decisiones de alcance

- **KPI piloto:** `kpi_fin_net_revenue` (Ingresos netos), datos sintéticos.
- **Vista:** `gold.v_kpi_daily`; medida `net_revenue`, grano día/canal y moneda
  PEN según el caso de estudio.
- **Filtros:** fechas inclusivas y tenant; tenant obtenido del principal
  autenticado. La API recibe los nombres `Digital`/`Tienda`, mientras la vista
  contiene `channel_key` entero; el adaptador une `gold.dim_channel` por
  `(tenant_id, channel_key)` y usa `channel_name` para filtrar y agrupar. La
  agrupación por `product` no está disponible en esta vista y se rechaza en el
  modo piloto.
- **Contrato:** conservar `POST /api/v1/queries` y la forma de respuesta actual.
  El resultado mantiene `dataMode: synthetic`, calidad/frescura
  `not_evaluated` y el estado de linaje existente; no afirma certificación.
- **Selección de backend:** nuevo modo de laboratorio opt-in. El valor ausente
  conserva el comportamiento SQLite actual. Activar el modo PostgreSQL requiere
  configuración explícita de entorno no productivo; el proceso debe rechazar
  iniciar ese modo cuando `BI_ENVIRONMENT=production`.
- **Gobierno:** el flujo de aprobación Data Steward no se implementa en este
  incremento. La política aprobada por dataset sigue siendo gate documentado
  antes de habilitar cualquier uso productivo; no se inventan umbrales.
- **Medición:** herramienta repetible que invoque el API real y registre
  latencias p50/p95, throughput, errores y configuración de la ejecución. El
  protocolo permite fijar calentamiento, cantidad de muestras y concurrencia;
  son parámetros de observación, no SLA ni criterio de aprobación.

## 3. Diseño propuesto

### Camino de consulta

El API conserva autenticación, visibilidad del KPI y autorización `queries:execute`
antes de acceder a datos. El router delega al ejecutor actual SQLite o al
adaptador PostgreSQL Gold seleccionado por configuración. El adaptador no
acepta identificadores de tabla, expresiones o fragmentos SQL del cliente: KPI,
vista, columnas y expresiones son constantes del código para el piloto.

La consulta usa parámetros para tenant, fechas y nombre de canal. Une
`gold.v_kpi_daily` con `gold.dim_channel` por tenant y clave, aplica el mismo
tenant a ambas fuentes, agrega `SUM(net_revenue)` sobre el rango solicitado y,
opcionalmente, por nombre de canal. Una consulta vacía conserva el estado
`empty` del contrato. Errores de conexión o timeout fallan sin sustituir el
resultado por datos SQLite ni por fixtures.

### Aislamiento y credenciales

La base de estudio fija el tenant permitido por rol PostgreSQL (`bi_reader_global`
o `bi_reader_other`); no confía en un GUC o tenant enviado por el cliente. El
servicio mantiene un mapeo de configuración lado servidor desde tenant
autenticado a credencial de lectura correspondiente. Un tenant sin mapeo se
deniega sin intentar conexión. La consulta también filtra explícitamente por el
tenant autenticado como defensa en profundidad.

Las credenciales provienen de archivos/secretos locales fuera de Git, nunca del
request, del repositorio, del log o de una respuesta. No se usa `bi_admin`. Cada
conexión de consulta es de solo lectura; se valida el timeout de cinco segundos
del rol de laboratorio y que las vistas sean `security_invoker` con RLS efectivo.
La verificación se hace con ambos roles y resultados claramente distintos entre
tenants. La conexión de serving es una responsabilidad separada del conector de
observación de esquemas, que no lee filas.

### Línea base

El ejecutor de medición llama al endpoint HTTP conectado y toma el tiempo
monótono total desde envío hasta respuesta. Debe registrar versión/commit,
configuración no secreta, fecha, tenant sintético, KPI, rango, concurrencia,
calentamiento, tamaño de muestra, p50, p95, throughput y errores. No captura
tokens ni cuerpos que puedan incluir datos. La salida deja explícito que se trata
del fixture de laboratorio (2.160 registros de ventas documentados) y no predice
capacidad de producción. No hay umbral pass/fail.

## 4. Comportamientos verificables

1. Sin configuración del modo piloto, las consultas siguen usando SQLite y no
   requieren PostgreSQL.
2. En el modo piloto, una consulta autorizada a `kpi_fin_net_revenue` devuelve
   ingresos agregados desde `gold.v_kpi_daily`, respetando fechas, canal opcional
   y tenant autenticado.
3. Cambiar el tenant del token cambia el rol/credencial del lado servidor; las
   filas del otro tenant no son visibles aunque se altere cualquier parámetro de
   la petición. Un tenant sin mapeo se deniega.
4. `product`, KPI distinto, SQL adicional o cualquier selector de objeto no
   soportado no ejecutan SQL y devuelven un error de contrato estable.
5. Scope insuficiente o recurso no visible se rechaza antes de acceso a
   PostgreSQL conforme a los 403/404 ya acordados.
6. Desconexión, timeout o credencial inválida no producen fallback a SQLite ni
   muestran secretos; el API devuelve el error genérico y request ID existentes.
7. El resultado conserva `dataMode: synthetic`, calidad/frescura
   `not_evaluated` y metadatos ausentes explícitos.
8. El modo `postgres_gold_lab` no puede iniciarse con entorno productivo.
9. La herramienta de baseline produce las métricas acordadas y deja constancia
   de los parámetros usados; no compara contra umbrales.

## 5. Pruebas y verificación

- Unitarias: selección SQLite/PostgreSQL, SQL fijo y parámetros, cálculo de
  ingresos, fechas inclusivas, canal, dimensión no soportada, modo productivo,
  fallos y ausencia de fallback.
- Integración PostgreSQL opt-in: ambos roles tenant, RLS y vistas invoker,
  agregados contra SQL Gold de referencia, lectura solamente, timeout y
  credenciales equivocadas. Nunca usar el rol administrador en serving.
- API E2E: autenticación/scopes/visibilidad, request/respuesta compatibles,
  errores seguros y aislamiento entre tenants.
- Baseline manual/repetible: ejecutar el medidor contra la API y PostgreSQL
  locales; guardar reporte no secreto como evidencia de observación.
- No se consideran estas pruebas ni la línea base aceptación productiva, SLA,
  conformidad de todos los criterios de US-005 o cierre de US-005-Q2.

## 6. Exclusiones y gates pendientes

- Flujo/estado persistente de aprobación Data Steward.
- Workload productivo, política por clase, calidad/frescura y umbrales aprobados.
- SLA, SLO, dimensionamiento productivo, cargas representativas y benchmark de
  motores comparativo.
- Conector genérico, SQL libre, ejecución del catálogo completo, dashboards,
  publicación/modelos semánticos y modificación de Gold.
- Cambios de ADR-005/006/014/015/018 o disposición de ASR-004.

## 7. Preguntas de diseño abiertas

- El mapeo de tenant a secreto debe seguir el mecanismo concreto del proceso API
  local (rutas de archivos de secreto por tenant o equivalente seguro). El
  mecanismo debe revisarse antes de implementación; no almacenar DSN/contraseñas
  en el control plane SQLite.
- El protocolo de línea base debe aceptar muestras y concurrencia configurables;
  no se propone un número mínimo estadístico ni umbral de aceptación en esta
  especificación.

## 8. Trazabilidad y estado

- Decisión humana: piloto E2E API→vista Gold sintética PostgreSQL y medición sin
  SLA (2026-10-18).
- Decisión humana: usar adaptador acotado a un KPI/vista; no motor genérico.
- Decisión humana: la aprobación Data Steward se documenta como gate productivo,
  fuera de implementación piloto.
- Evidencia AS-IS: `serving.py`, API-001, `docker-compose.yml`, roles de lectura
  en `init/00-roles.sh`, políticas y vistas en `init/30-gold-views.sql`.
- El documento se presenta para revisión; no autoriza implementación. No se
  modifican estados de US-005, API-001, ADRs ni ASR.
