# PostgreSQL — Caso de estudio de ventas omnicanal

Fuente analítica local para avanzar US-001 (descubrir esquema), US-002
(registrar datasets) y posteriormente US-003/004/005. Es una base PostgreSQL
real con **datos sintéticos**, no una fuente empresarial ni un pipeline ETL.

Elegimos empezar por **Gold dimensional** porque el recorrido actual necesita
consultar KPI desde datasets preparados. Un esquema transaccional `oltp` de
clientes, pedidos, líneas, pagos y devoluciones será útil al implementar
extracción, CDC o transformaciones; no es un requisito para consumir una fuente
Gold ya preparada. Esta entrega no modifica el control plane SQLite del
backend ni conecta automáticamente el ejecutor semántico a PostgreSQL.

## Arranque

En PowerShell, desde `codebase/case-study`:

```powershell
python prepare.py
docker compose config --quiet
docker compose up -d --wait postgres
docker compose run --rm verify
```

`prepare.py` genera tres contraseñas distintas en `.docker-secrets/`, sin
imprimirlas ni sustituir archivos existentes. Ejecútalo con la misma cuenta de
Windows que utiliza Docker Desktop. Son secretos locales de Compose montados
como archivos; no equivalen a un gestor de secretos productivo. En POSIX el
script crea directorio/archivos con permisos 0700/0600; en Windows también se
deben respetar las ACL de la cuenta. La carpeta está excluida de Git.

Se fija `postgres:18.6`, la última versión estable verificada el 2026-10-16 en
la [imagen oficial](https://hub.docker.com/_/postgres) y el
[registro de versiones PostgreSQL](https://www.postgresql.org/docs/release/).
`latest` apuntaba a la misma versión; se fija el número para evitar cambios
inesperados de major. Digest observado:
`sha256:74935e72241653ca55e0414067e6d8763aceb8a810eb51b452253ec3dcfc4336`.
No se actualiza un directorio de datos entre versiones major cambiando sólo la
etiqueta. El volumen usa `/var/lib/postgresql`, ubicación de la imagen 18+.

## Conexión desde DBeaver, pgAdmin o un futuro conector

| Campo | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Puerto host | `55432` (cambiable con POSTGRES_PORT) |
| Base | `bi_analytics` |
| Esquema | `gold` |
| Usuario de tenant Global | `bi_reader_global` |
| Contraseña de Global | Archivo `.docker-secrets/reader_global_password.txt` |
| Usuario de otro tenant | `bi_reader_other` |
| Contraseña del otro tenant | Archivo `.docker-secrets/reader_other_password.txt` |
| Administrador del laboratorio | `bi_admin`, contraseña en `.docker-secrets/admin_password.txt` |
| TLS | No configurado en este laboratorio de loopback |

Para consultar como administrador dentro del contenedor:

```powershell
docker compose exec postgres psql -U bi_admin -d bi_analytics
```

Para verificar credenciales y controles de acceso reales, usar el servicio
`verify`: inicia conexiones TCP separadas con las contraseñas de ambos lectores.
No usar `bi_admin` como credencial del conector: es superusuario de bootstrap y
no representa el aislamiento de un consumidor.

El puerto sólo se publica en loopback. Dentro de la red Compose el endpoint es
`postgres:5432`. Una aplicación ejecutada en el host utiliza `127.0.0.1:55432`.
`POSTGRES_IMAGE`/`POSTGRES_PORT` son sobrescrituras opcionales, documentadas en
`.env.example`; no requieren crear `.env` para el arranque por defecto.

## Modelo y grano

| Tabla | Grano / propósito |
| --- | --- |
| `dim_tenant` | Tenant y moneda PEN. |
| `dim_date` | Día del calendario 2026, compartido. |
| `dim_product` | Producto por tenant; SKU, categoría y marca. |
| `dim_customer` | Cliente sintético por tenant; segmento y región, sin PII real. |
| `dim_store` | Tienda física o virtual por tenant. |
| `dim_channel` | Canal Digital o Tienda por tenant. |
| `dim_return_reason` | Motivo de devolución por tenant. |
| `fact_sales` | Una línea de pedido completado. |
| `fact_returns` | Un evento de devolución parcial de una línea original. |
| `fact_sessions_daily` | Día/canal/tenant; sesiones elegibles y convertidas. |
| `fact_inventory_daily` | Saldo al cierre del día/producto/tienda/tenant. |
| `case_study_manifest` | Versión y procedencia sintética del dataset; marcador de inicialización. |

Ventas: 2026-09-01 a 2026-10-15; devoluciones hasta 2026-10-18. Dos tenants
(`demo-global`, `demo-other`), 8 productos, 40 clientes, 3 tiendas y 2 canales
por tenant. El segundo tenant usa precios/costos dobles para que una fuga de
datos cambie los resultados de forma detectable. Las dimensiones reutilizan
claves locales; las FK incluyen tenant para mantener relaciones correctas.
El modelo usa atributos actuales (tipo 1), sin historia SCD2 en esta versión.

### Contratos de agregación del caso

- Ventas después de descuentos = cantidad × precio − descuento.
- Ingresos netos = ventas después de descuentos − reembolsos.
- Una devolución se reconoce en su **fecha de devolución**. No reexpresa la
  venta original. Los importes están en PEN, sin impuestos, envío ni FX.
- Costo neto = costo vendido − reversión de costo de las unidades devueltas.
- Margen bruto = (ingresos netos − costo neto) / ingresos netos × 100.
- Conversión = suma de sesiones convertidas / suma de sesiones elegibles × 100.
  El fixture supone un pedido por sesión convertida; no se infiere esa regla
  para un negocio real. No promediar porcentajes diarios.
- Inventario es semi-aditivo: sumar productos/tiendas de una misma fecha,
  no saldos de fechas distintas. No se simula reconciliación de movimientos de
  stock; el fixture de inventario es independiente del flujo de ventas.
- División por cero devuelve NULL; no se fabrica un 0%.

Vistas disponibles: `v_revenue_movements` (eventos firmados),
`v_revenue_daily` (día/canal/producto), `v_kpi_daily` (día/canal) y
`v_inventory_latest` (último snapshot por tenant).
La unión de ventas y devoluciones se hace como ledger antes de agregar;
sesiones se une al mismo grano día/canal. Así varias devoluciones no duplican
ventas ni denominadores.

## Aislamiento y permisos

Los lectores tienen SELECT, sin CREATE ni escrituras; sus sesiones tienen
read-only por defecto y timeout de consultas de cinco segundos. Las diez
tablas tenant-scoped tienen RLS forzado. Las vistas son `security_invoker` y
preservan la identidad del lector. Cada login tiene un tenant fijo en la
política SQL y no puede cambiar de rol; no se confía en un parámetro GUC
`app.tenant_id` que el cliente pueda manipular.

Calendario y manifiesto son globales y no contienen datos de clientes. El
catálogo estructural es común a los tenants; los nombres de tablas no son
secretos por tenant. Este diseño de roles sirve para **dos tenants de prueba**;
la futura estrategia de credenciales por fuente/tenant debe revisarse antes
de extenderlo a producción. No se otorgan permisos por defecto a tablas nuevas.

## Verificación reproducible

```powershell
docker compose run --rm verify
```

Comprueba conteos, reconciliación de ingresos/costos/sesiones, múltiples
devoluciones, snapshot más reciente, FK/checks, RLS, vistas invoker, logins de
ambos lectores, bloqueo de escritura y de cambio de rol. No borra datos:
los intentos de inserción de prueba están en subtransacciones rechazadas o
revertidas. `examples.sql` incluye consultas de KPI, inventario y descubrimiento.

Resultados esperados para **todo el fixture**, incluidas devoluciones de octubre
16–18 (no sólo hasta la fecha de última venta):

| Tenant | Ingresos netos PEN | Ganancia bruta PEN | Margen bruto | Conversión |
| --- | ---: | ---: | ---: | ---: |
| demo-global | 316458.75 | 122058.75 | 38.57% | 5.04% |
| demo-other | 632917.50 | 244117.50 | 38.57% | 5.04% |

Conteos globales: 2160 líneas de venta, 360 devoluciones, 180 filas de sesiones,
2160 snapshots de inventario y 365 fechas. Los snapshots más recientes son
48 filas globales o 24 por tenant. Estos valores no son comparables con los
fixtures SQLite anteriores: son datasets, períodos y convenciones diferentes.

## Ciclo de vida, cambios y recuperación

`docker compose stop postgres` detiene el laboratorio;
`docker compose up -d --wait postgres` lo vuelve a iniciar. `docker compose down`
retira contenedores/red pero conserva el volumen `synapse-bi-study_postgres_data`.
No usar `down -v` para tareas normales: eliminaría los datos.

Los scripts de `init/` sólo se ejecutan cuando el volumen está vacío, según el
entrypoint oficial. Cambiar SQL o archivos de contraseña no migra una base ya
inicializada ni rota sus credenciales. Una inicialización fallida debe
diagnosticarse con `docker compose logs postgres`; no se elimina automáticamente
el volumen. Aplicar cambios mediante migraciones o usar un proyecto/volumen de
laboratorio nuevo explícito. Las contraseñas existentes se conservan al repetir
`prepare.py`; guardar esos archivos fuera de Git si se desea recuperar el mismo
volumen desde otro equipo.

No hay HA ni política de backup/RPO/RTO en este entorno local. No contiene
datos sensibles reales. Un backup exportable puede generarse con `pg_dump`
antes de una migración; la operación y restauración productivas son trabajo
posterior, no garantías de esta entrega.

## Siguiente incremento

Implementar US-001 contra esta base: conexión de sólo lectura, comprobación de
acceso y observación de `gold` mediante information_schema/pg_catalog. Después
registrar datasets (US-002), mapear/publicar KPI (US-003/004) y agregar un
ejecutor PostgreSQL al backend (US-005). La existencia del esquema Gold no
publica automáticamente definiciones semánticas gobernadas.

Diseño y trazabilidad: [DM-001](../../knowledge-base/design/data-models/DM-001-retail-gold-study.md).
