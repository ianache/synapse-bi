# US-007 · Validación manual del backend

Este incremento entrega el backend CDC de ventas en el laboratorio. No incluye pantallas; las comprobaciones visuales contra Stitch quedan para el incremento de UI.

## Laboratorio local

1. Inicializa PostgreSQL con el perfil de caso de estudio y aplica las migraciones SQL `25-cdc-sales-events.sql` y `40-cdc-prepared-schema.sql`.
2. Configura el registro PostgreSQL existente con un usuario lector tenant, declara el esquema `gold` y confirma que la fuente observa `gold.fact_sales`.
3. Configura `BI_PREPARED_WRITER_SECRET_FILE` con la credencial separada del rol `bi_prepared_writer`.
4. Inicia el backend en `development` o `test`. El polling permanece apagado por defecto.
5. Para revisar polling, fija `BI_PREPARATION_POLLING_ENABLED=true` en laboratorio y reinicia la API. El intervalo es de 60 segundos; no se habilita en producción.

Las ejecuciones, versiones, eventos y evidencia de error saneada se conservan sin vencimiento en este laboratorio. La fuente CDC sintética y el dataset preparado no alteran las tablas Gold de ventas.

## Configurar pipeline

Con una identidad del tenant con `datasets:write` y `sources:read`, identifica `sourceId` e `inputDatasetId` del catálogo de ventas y crea el pipeline:

```http
POST /api/v1/preparation-pipelines
Authorization: Bearer <token>
Content-Type: application/json

{"sourceId":"<source-id>","inputDatasetId":"<fact-sales-dataset-id>","preparedDatasetName":"Ventas preparadas","enabled":false}
```

La respuesta entrega el ID del dataset preparado. Ese registro aparece en el catálogo existente con ID asignado por sistema y conserva los metadatos declarados de entrada. Las omisiones de gobernanza mantienen la completitud como incompleta.

## Enviar lote manual

```http
POST /api/v1/preparation-runs
Authorization: Bearer <token>
Content-Type: application/json

{"pipelineId":"<pipeline-id>","events":[{"sourceEventId":"manual-001","businessKey":9000001,"operation":"insert","eventTimestamp":"2026-11-02T10:00:00Z","sourcePosition":1,"afterImage":{"tenant_id":"demo-global","sales_line_key":9000001,"order_number":"ORD-9000001","line_number":1,"sale_date_key":20260901,"product_key":1,"customer_key":1,"store_key":1,"channel_key":1,"quantity":2,"unit_price":10,"gross_amount":20,"discount_amount":0,"sale_amount":20,"cost_amount":12,"loaded_at":"2026-09-01T00:00:00Z"}}]}
```

Operaciones permitidas: `insert`, `update` y `delete`. Inserción y actualización requieren una imagen completa de ventas; borrado requiere clave y no admite `afterImage`. Las cuatro fallas de calidad que bloquean publicación son clave ausente, evento/operación inválida, campos requeridos ausentes y `sourceEventId` duplicado. La respuesta informa estado, contadores, controles, versión publicada o última versión exitosa. El cuerpo no se almacena como evidencia de fallo.

## Revisar y reintentar

Data Engineering puede listar las ejecuciones por tenant y revisar el detalle saneado:

```http
GET /api/v1/preparation-runs?pipeline_id=<pipeline-id>&limit=50&offset=0
GET /api/v1/preparation-runs/<run-id>
```

Un reintento manual debe reenviar el lote corregido y queda vinculado al intento previo:

```http
POST /api/v1/preparation-runs/<run-id>/retry
Content-Type: application/json

{"events":[{"sourceEventId":"manual-001-corrected","businessKey":9000001,"operation":"insert","eventTimestamp":"2026-11-02T10:00:00Z","sourcePosition":1,"afterImage":{"tenant_id":"demo-global","sales_line_key":9000001,"order_number":"ORD-9000001","line_number":1,"sale_date_key":20260901,"product_key":1,"customer_key":1,"store_key":1,"channel_key":1,"quantity":2,"unit_price":10,"gross_amount":20,"discount_amount":0,"sale_amount":20,"cost_amount":12,"loaded_at":"2026-09-01T00:00:00Z"}}]}
```

Para una ejecución de polling fallida, omite el cuerpo: el backend vuelve a leer el rango que quedó retenido desde el checkpoint vigente. No hay reintentos automáticos. Un poll sin eventos no crea ejecución ni versión.

## Consumir una versión

Identidades con `datasets:read` pueden consultar versiones, historial CDC y estado vigente con paginación:

```http
GET /api/v1/prepared-datasets/<dataset-id>/versions?limit=50&offset=0
GET /api/v1/prepared-datasets/<dataset-id>/versions/<version-id>/history?limit=100&offset=0
GET /api/v1/prepared-datasets/<dataset-id>/versions/<version-id>/current-state?limit=100&offset=0
```

El historial conserva altas, cambios y bajas. El estado vigente refleja la última imagen por clave y no incluye claves borradas. Cada versión referencia dataset de entrada, proceso/configuración, ejecución y rango de capturas CDC consumido.

## Controles esperados

- `quality_rejected` no desplaza la última versión exitosa.
- Una versión publicada es inmutable; la baja permanece en historial y remueve la clave del estado de esa versión.
- Un tenant distinto recibe un recurso no disponible, sin revelar IDs ni metadatos ajenos.
- Consumidores no reciben evidencia técnica saneada de Data Engineering ni el lote CDC enviado.
- El usuario PostgreSQL lector tiene solo lectura sobre la fuente; el writer separado no escribe Gold.
- El polling está deshabilitado en producción y usa bloqueo advisory para evitar que instancias paralelas procesen el mismo pipeline a la vez.

La automatización verifica los contratos y el aislamiento. La aceptación del backend en la aplicación se completa mediante pruebas manuales del entorno; esta guía no certifica fidelidad visual de UI.

## Resultado de validaci?n de implementaci?n (2026-11-14)

Se implement? la proyecci?n de versi?n PostgreSQL en las lecturas del cat?logo SQLite; retries de polling limitados por `source_range_end`; bloqueo advisory compartido por tenant/pipeline para ejecuciones manuales y polling; paginaci?n de runs con consultas limitadas a `offset + limit` por pipeline; y m?ximo de 500 eventos por lote API.

Desde `codebase/backend`:

```text
python -m pytest
234 passed, 2 skipped in 51.90s
```

Los dos casos omitidos son integraciones PostgreSQL opt-in. No estaban configuradas `US007_TEST_POSTGRES_PORT` ni las rutas locales de secretos reader/writer. La verificaci?n Docker del caso de estudio y la aceptaci?n CDC contra una base nueva siguen pendientes: los cuatro archivos locales de secretos no existen y Docker no permite conectar al pipe `docker_engine` (permission denied). No se generaron secretos ni se modific? Docker. La gu?a no declara completo el plan de implementaci?n.
