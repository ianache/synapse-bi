# Synapse BI — Backend Python

Primera entrega funcional para US-005, US-006 y el aislamiento de las rutas
implementadas de US-009. API modular FastAPI, SQLite transaccional y contrato
OpenAPI generado en `/openapi.json`. Esta entrega utiliza registros sintéticos
explícitos; no se ha conectado una fuente empresarial ni se han aprobado los ADR.

Ampliación US-001: registro PostgreSQL y observación de metadatos reales del
laboratorio. Las consultas KPI anteriores siguen usando sus fixtures explícitos;
registrar una fuente no redirige los cálculos ni publica semántica.

## Registro de datasets US-002

Se implementan GET/POST `/api/v1/datasets` y GET/PUT `/api/v1/datasets/{id}`.
Contrato: [API-002](../../knowledge-base/design/api-contracts/API-002-dataset-registry.md).
GET requiere datasets:read; POST/PUT requieren además datasets:write y sources:read.
Sólo data-admin/other-data-admin reciben esos scopes en la sesión local; en
OIDC el operador debe mapearlos expresamente. Analistas no reciben permisos nuevos.

POST requiere Idempotency-Key (replay de 24h por tenant/subject); PUT exige
If-Match con ETag, devuelve 428 si falta y 412 si quedó obsoleto. Nombre único
NFC/casefold por tenant; JSON máximo 256 KiB reales. Borrador puede carecer de
gobierno; registro no certifica. Origin/kind inmutables, observaciones exitosas
explícitas y columnas exactas. Guardar sólo consulta snapshots SQLite: no lee
filas ni conecta con PostgreSQL. El registro no modifica catálogo KPI ni Gold.

### Migración y respaldo seguro

El arranque migra automáticamente nueva/v1/v2 a v3, de forma aditiva y
transaccional. Antes de actualizar una base valiosa, realizar backup consistente
con `sqlite3.Connection.backup` y conservar por separado la clave de fuentes
protegida. No copiar sólo el `.db` activo ignorando WAL. La suite verifica
rollback de una migración fallida, conservación de registros anteriores y restore
de la base; el operador sigue siendo responsable del backup real y sus claves.

Rollback funcional: retirar scopes/enlace sin borrar registros. El binario antiguo
sólo admite v1/v2: no ejecutarlo contra v3 ni borrar tablas para retroceder. Un
rollback físico necesita backup previo y decisión sobre escrituras posteriores.
No hay down destructivo automático. Gobierno empresarial, retención/cuotas,
protección integral de metadatos e IAM productivo continúan pendientes.

Pruebas: `uv run --extra test --frozen pytest -p no:cacheprovider`;
BI_TEST_POSTGRES=true agrega la integración local real. Desde codebase,
`npm run test:datasets` cubre el recorrido completo en 8002/5182. Las capturas
de datasets quedan en test-results/dataset-screens, sin credenciales/traces.

## Fuentes de datos: recorrido implementado

Con PostgreSQL del [caso de estudio](../case-study/README.md) iniciado y los
servidores siguientes en marcha, abrir `http://127.0.0.1:5173/fuentes`.
Usar el login lector `bi_reader_global` y su contraseña local de
`case-study/.docker-secrets/reader_global_password.txt` (no copiarla a Git).
El formulario viene preparado para 127.0.0.1:55432, bi_analytics, esquema gold.
Probar conexión → registrar → observar esquema → explorar columnas y relaciones.
La credencial se cifra; al editar hay que ingresar y validar una nueva.

La UI de fuentes utiliza persona local `data-admin` cuando
`VITE_API_AUTH=development`; requiere API aun cuando la demo KPI sea local.
Los scopes son `sources:read`, `sources:write`, `sources:observe`. `analyst`
no tiene estos permisos. `other-data-admin` permite probar aislamiento en local.

Configuración y límites completos en
[SRC-001](../../knowledge-base/design/api-security/SRC-001-postgresql-source-registry.md).
Producción exige `BI_SOURCE_TARGETS` con host/puerto/IP explícitos,
`BI_SOURCE_KEY_FILE` provisionado y TLS verify-full. Desarrollo genera la clave
en el directorio de SQLite y permite sólo loopback:55432 por defecto. No perder
esa clave: es necesaria junto con la base para restaurar las credenciales.
`BI_SOURCE_CA_FILE` configura la CA; `BI_API_PROXY_TARGET` cambia el destino de
la API en Vite. No se permiten DSN ni SQL arbitrarios.

Pruebas desde `codebase` (requieren Docker lab preparado para integración):

```powershell
$env:BI_TEST_POSTGRES = 'true'
uv run --directory backend --extra test --frozen pytest
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:sources
```

El recorrido usa puertos exclusivos 8001/5181 y una base separada
`backend/data/source-browser-tests.db`; no reutiliza servidores previos.
Las capturas sin secretos quedan en `test-results/source-screens`.

## Ejecutar en desarrollo (PowerShell)

Desde `codebase/backend`:

```powershell
uv sync --extra test --frozen
$env:BI_ENVIRONMENT = 'development'
$env:BI_AUTH_MODE = 'development'
$env:BI_SEED_DEMO = 'true'
uv run --frozen uvicorn synapse_api.main:app --host 127.0.0.1 --port 8000
```

API: <http://127.0.0.1:8000/docs>. Health: `/health`. Readiness: `/ready`.
Se crea `data/synapse.db` en el directorio de trabajo. Las tablas de metadatos y
datos analíticos están separadas lógicamente; el motor SQLite es una elección de
desarrollo, no la selección del serving de producción.

Desde otra terminal, en `codebase`:

```powershell
$env:VITE_DATA_SOURCE = 'api'
$env:VITE_API_AUTH = 'development'
npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port 5173
```

Alternativamente, usar `apps/bi-analytics/.env.example` como referencia para un
archivo `.env.local`. Vite reenvía `/api` a `http://127.0.0.1:8000`.
Sin `VITE_DATA_SOURCE=api` se conserva la demostración local anterior. En modo
API no hay fallback silencioso a localStorage. El token de desarrollo dura una
hora, queda sólo en memoria y no se persiste en el navegador. Una sesión nueva
recupera los dashboards desde la base de datos.

## Probar directamente la API

```powershell
$session = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/v1/auth/dev-session' -ContentType 'application/json' -Body '{"persona":"analyst"}'
$headers = @{ Authorization = "Bearer $($session.accessToken)" }
Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/kpis?q=ventas' -Headers $headers
$query = '{"kpiId":"kpi_fin_net_revenue","modelVersion":1,"startDate":"2026-10-01","endDate":"2026-10-03"}'
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/api/v1/queries' -ContentType 'application/json' -Headers $headers -Body $query
```

Ingresos netos del conjunto sintético: `3100.00 PEN`; canal Digital:
`1400.00 PEN`; margen bruto: `43.55 %`; conversión: `18.00 %`. Se calculan desde
los componentes, no desde valores de respuesta predefinidos. Sin registros se
devuelve `status: empty`; con denominador cero, `value: null`. Las fechas del
dataset son 1–3 de octubre de 2026; el dashboard conectado abre ese período.
No se afirma que su calidad o frescura estén certificadas.

El incremento de laboratorio US-005-Q1 tolera metadatos ausentes sin bloquear
el cálculo sintético: devuelve linaje vacío con `metadata.lineageStatus=unavailable`
y conserva los controles de calidad/frescura como `not_evaluated`.
La UI señala los faltantes sin generar linaje o dimensiones de ejemplo.
Para consultas, un KPI no visible devuelve 404 genérico y un KPI visible sin
`queries:execute` devuelve 403; ambos se resuelven antes de ejecutar el cálculo.
Ver [evidencia y prueba manual US-005](../../docs/ux/us-005/verification.md).

## Endpoints

| Método | Ruta `/api/v1` | Permiso / comportamiento |
| --- | --- | --- |
| POST | `/auth/dev-session` | Sólo modo development/test explícito y cliente loopback; personas `analyst`, `viewer`, `other-tenant`. |
| GET | `/me` | Identidad, tenant y scopes del JWT validado. |
| GET | `/kpis` | `catalog:read`; q, category, owner, sort, limit, offset. |
| GET | `/kpis/{id}?version=1` | Definición publicada, dimensiones y lineage del modelo. |
| POST | `/queries` | `queries:execute`; KPI/version, fechas, channel y groupBy permitidos. |
| GET | `/dashboards` | `dashboards:read`; sólo propios o compartidos del mismo tenant. |
| GET | `/dashboards/{id}` | Devuelve `ETag` con la versión actual. |
| POST | `/dashboards` | `dashboards:write`; nombre, dashboard personal; `Idempotency-Key` opcional. |
| PUT | `/dashboards/{id}/widgets/{kpiId}` | Propietario + permiso de escritura; cuerpo kpiId/modelVersion; `If-Match` obligatorio. |
| DELETE | `/dashboards/{id}/widgets/{kpiId}` | Mismos controles de edición y versión. |

Todos los DTO usan camelCase. El listado pagina con límite máximo 100. Las
consultas admiten ventanas de hasta 366 días y dimensiones de una lista cerrada;
no hay endpoint de SQL arbitrario. Los widgets conservan la versión del modelo.
Se serializan escrituras con transacciones y control optimista de versiones.

Errores: `{ "error": { "code": "…", "message": "…", "requestId": "…" } }`.
401: token ausente/inválido; 403: permiso insuficiente; 404: recurso no visible;
409: nombre o clave de idempotencia en conflicto; 412: versión obsoleta;
422: payload inválido; 428: falta If-Match; 503: almacenamiento/identidad no
disponibles. El cliente conserva la selección y permite recargar/reintentar.

## Identidad y configuración de producción

Por defecto, el backend exige OIDC y no arranca sin configuración. No se acepta
tenant/usuario desde headers inventados ni desde cuerpos de solicitudes.

| Variable | Uso |
| --- | --- |
| `BI_ENVIRONMENT` | production (defecto), development o test. |
| `BI_AUTH_MODE` | oidc (defecto) o development. Development se rechaza en production. |
| `BI_SEED_DEMO` | false por defecto; true sólo fuera de production. |
| `BI_DATABASE_PATH` | Ruta SQLite, por defecto `data/synapse.db`. |
| `BI_OIDC_ISSUER` | Emisor autorizado, exacto. |
| `BI_OIDC_AUDIENCE` | Audience esperada, por defecto `synapse-bi-api`. |
| `BI_OIDC_JWKS_URL` | URL HTTPS fija de claves públicas; nunca tomada del JWT. |
| `BI_OIDC_PUBLIC_KEY` | Alternativa: clave pública RSA PEM para verificación offline. |
| `BI_ALLOWED_ORIGINS` | Orígenes HTTP(S) explícitos separados por coma; defecto localhost/127.0.0.1 puertos 5173 y 4173. |

JWT: RS256, firma, issuer, audience y expiración; claims obligatorios sub,
tenant_id, iat, exp, iss, aud. Los scopes de esta entrega son `catalog:read`,
`queries:execute`, `dashboards:read`, `dashboards:write`.
El proveedor debe emitirlos o adaptarse mediante un mapeo revisado. La API
verifica tokens; no implementa un servidor de identidad ni el flujo SSO del
navegador. `ApiRepository` acepta un callback `getAccessToken` como punto de
integración; el arranque estándar de la UI sólo conecta automáticamente la
sesión de desarrollo explícita.

La sesión de desarrollo no aparece en OpenAPI en modo OIDC, no se puede emitir
desde clientes remotos ni orígenes web ajenos y no introduce claves fijas en el
código. Reiniciar la API invalida sus tokens. En producción se requiere el
proveedor OIDC, el motor/fuente de datos y políticas de negocio aún pendientes;
la API no se presenta como despliegue productivo completo.

## Estructura y pruebas

- `config.py`, `auth.py`: configuración, JWT y scopes.
- `catalog.py`: lectura de definiciones publicadas y búsqueda.
- `dashboards.py`: visibilidad, persistencia, idempotencia y concurrencia.
- `serving.py`: consultas permitidas, Decimal y metadatos de confianza.
- `database.py`: esquema v1, claves compuestas tenant/recurso, transacciones.
- `demo.py`: fixtures sintéticos insertados sólo mediante opt-in.
- `app.py`: composición, rutas, errores, CORS y request IDs.
- `semantic_catalog/`: US-003, dominios/componentes/KPI declarativos en SQLite v4;
  referencias, protección/copia, versiones e idempotencia. No SQL de usuario ni ejecución de fórmulas.

US-003 añade `/api/v1/semantic-catalog` y scopes `semantic:read`/`semantic:write`;
personas locales data-admin/other-data-admin únicamente. No conceder nuevos scopes
productivos de forma automática. API/modelo: [API-003](../../knowledge-base/design/api-contracts/API-003-semantic-catalog.md),
[DM-003](../../knowledge-base/design/data-models/DM-003-semantic-catalog.md).
Inicialización v4 es aditiva; respaldar consistentemente antes de migrar una base
valiosa. Binarios viejos rechazan v4: rollback exige conservar v4 y restaurar una
copia probada v3 en archivo nuevo, no borrar tablas ni usar down automático.

```powershell
uv run --extra test --frozen pytest
```

Pruebas de firma y claims, scopes, consultas, aislamiento, dashboards privados,
errores, persistencia tras reinicio, idempotencia y escrituras concurrentes.
No se sobrescriben dashboards al reiniciar el seed. Auditoría de consultas y
mutaciones con tenant, subject, acción, recurso y request ID, sin tokens ni
payloads. Políticas de retención, operación de claves y cobertura de otras
rutas de plataforma quedan pendientes.

Desde `codebase`, para verificar el frontend integrado:

```powershell
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npx playwright test --config playwright.api.config.ts
```

La configuración inicia los servicios si no están activos. Su base separada es
`backend/data/browser-tests.db`; si reutiliza servicios existentes, las pruebas
crean dashboards con nombres únicos en ese entorno de desarrollo.

La integración y las decisiones provisionales están registradas en
[`API-001`](../../knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md).
Referencias de implementación: [seguridad FastAPI](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/),
[verificación JWT y JWKS](https://pyjwt.readthedocs.io/en/latest/usage.html).
