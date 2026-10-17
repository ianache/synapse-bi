---
type: API Contract
id: API-003
title: API del catálogo semántico configurable
description: Contrato aditivo propuesto para borradores, componentes reutilizables y copia segura de US-003.
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: api-designer/0.2.0
  at: 2026-10-16T20:43:42-05:00
sources:
  - id: US003-DESIGN
    resource: /docs/superpowers/specs/2026-10-16-us-003-semantic-catalog-design.md
  - id: SEM-US003-D01-D06
    resource: /docs/ux/us-003/decisions.md
  - id: IMD-002
    resource: /knowledge-base/business/information-model/IMD-002-catalogo-semantico.md
  - id: DM-003
    resource: /knowledge-base/design/data-models/DM-003-semantic-catalog.md
  - id: EXISTING-AUTH
    resource: /codebase/backend/synapse_api/auth.py
  - id: EXISTING-DATASETS
    resource: /codebase/backend/synapse_api/datasets/schemas.py
---

# API-003 — Catálogo semántico

## 1. Alcance, estado y decisiones

Propuesta técnica para el incremento local aceptado en D06, no contrato ya
implementado ni aprobación productiva. Autenticación existente JWT/OIDC; tenant y
subject sólo desde Principal verificado. Separa definiciones nuevas de `/kpis`,
consultas y dashboards de demostración. No ejecuta expresiones ni conecta a Gold.

| ID | Decisión propuesta y procedencia |
| --- | --- |
| SC-D01 | Namespace independiente; additive, sin cambiar consumidores actuales. Diseño §§3/8, D06. |
| SC-D02 | DTO y límites siguientes son INFERENCE técnica para entrada acotada; requieren revisión de este contrato, no se atribuyen al negocio. |
| SC-D03 | Versiones e idempotencia separadas del versionado semántico/publicación. Diseño §8. |
| SC-D04 | Scopes nuevos y gestión sólo admin local; no ampliar al analista. Diseño §9, D06; nombres de scopes son propuesta técnica. |
| SC-D05 | Refs tenant/tipo/dominio, protección irreversible por primer uso y snapshots históricos. D04/D05 y diseño §§4/6/7 aceptado en D06. |
| SC-D06 | Sin DELETE ni publicar/calcular; fórmulas texto, completitud documental derivada. Diseño §§3/5/6 y D06. |

## 2. Recursos y operaciones

Base `/api/v1/semantic-catalog`. JSON camelCase, `extra=forbid` en cada objeto;
tipos estrictos, sin coerción bool/número a texto. UUID opaco generado por servidor.

| Ruta relativa | Métodos | Entrada | Respuesta |
| --- | --- | --- | --- |
| `/domains` | GET, POST | filtros / SaveDomain | DomainPage / 201 Domain |
| `/domains/{id}` | GET, PUT | — / SaveDomain | 200 Domain |
| `/components` | GET, POST | filtros / SaveComponent | ComponentPage / 201 Component |
| `/components/{id}` | GET, PUT | — / SaveComponent | 200 Component |
| `/components/{id}/copies` | POST | CopyComponent | 201 Component |
| `/components/{id}/consumers` | GET | limit, offset | 200 ConsumerPage |
| `/kpi-definitions` | GET, POST | filtros / SaveKpiDefinition | KpiDefinitionPage / 201 KpiDefinition |
| `/kpi-definitions/{id}` | GET, PUT | — / SaveKpiDefinition | 200 KpiDefinition |

GET de ficha y PUT/POST exitosos: ETag `"{version}"`; POST también Location.
Listado: `{items,total,limit,offset}`, orden `updatedAt DESC,id ASC`; consumidores
por `id ASC`. Filtros de listas: `q` opcional hasta 100, `limit` 1..100 default 25,
`offset` >=0 default 0; componentes/KPI admiten `domainId`, componentes `kind`.
No filtro arbitrario ni búsqueda SQL libre. Query desconocida se rechaza 422.
Cada página y total se calculan en la misma transacción de lectura.

## 3. Entradas y límites (SC-D02)

Todos los límites son caracteres Unicode salvo cuerpo: máximo **256 KiB** de
bytes, contado antes de parsear JSON incluso chunked. Rechazar media type distinto
de application/json con 415. Todos los textos se renderizan escapados, nunca HTML.
Nombre: trim+NFC, 1..100 imprimibles; unicidad NFC+casefold por tenant para dominio,
y por tenant/dominio/tipo para componentes y KPI. Sin homogeneizar identificadores
de columnas, fórmulas ni sinónimos a un nombre físico.

| DTO | Campos y reglas |
| --- | --- |
| SaveDomain | `name` obligatorio; `description` hasta 2000 default ""; `owner` nullable hasta 500 default null |
| SaveComponent | `kind` = dimension o measure; `name`, `domainId` obligatorios; `definition` hasta 2000 nullable; `grain`, `unit`, `aggregation` hasta 500 nullable; `synonyms` lista hasta 20 strings 1..100 distintos; `binding` nullable default null |
| Binding | `datasetId` UUID y `column` string exacto 1..128, ambos obligatorios; sólo columna seleccionada en dataset visible actual |
| SaveKpiDefinition | `name`, `domainId` obligatorios; `definition` hasta 2000 nullable; `formula` hasta 8000 nullable; `unit`, `grain`, `owner`, `steward`, `classification`, `accessPolicy`, `freshnessExpectation`, `qualityExpectation` hasta 500 nullable; `filters`, `nullPolicy`, `returnPolicy`, `lateDataPolicy` hasta 2000 nullable; `validFrom`, `validTo` nullable RFC3339; `dimensionIds`, `measureIds` listas hasta 100 UUID distintos cada una default [] |
| CopyComponent | `name` obligatorio, con normalización y límite de nombre; ningún otro campo |

Opcionales ausentes reciben defaults; PUT sustituye todos los campos editables,
no es PATCH. Strings opcionales trim y vacío→null; description trim→""; formula
conserva interior y saltos de línea. Si ambas vigencias existen: validTo>=validFrom.
Dimensión rechaza unit/aggregation no nulos. `kind`/`domainId` inmutables en PUT
de componente; `domainId` inmutable en KPI. Copia conserva dominio/tipo, contenido
y snapshot del original, nuevo nombre/ID/versión 1, sin consumidores/protección.
No recibe ID/origen/protección/estado/version/tenant/subject desde cliente.

Referencias declaradas deben ser visibles, tipo correcto y mismo dominio; no
completar datos automáticamente. Se acepta dataset US-002 en draft o registered:
vincularlo no valida su gobierno. Declarar/cambiar binding requiere acceso a dataset
y source metadata; no comprobar filas ni inferir grano de PK/FK.

## 4. Salidas y completitud

Cada ficha incluye campos de entrada más `id`, `version` entero >=1, `createdAt`,
`updatedAt` UTC, `status="draft"`, `governanceValidation="pending"`,
`completeness="complete"|"incomplete"`, `missingMetadata: string[]`, `warnings`.
No se devuelve tenant/secretos. Componente añade `copyOriginId` nullable,
`protected` bool, `consumerCount` y `bindingSnapshot` nullable. Snapshot contiene
datasetId, datasetVersion, sourceId, observationId, schema, object, column,
columnType; metadata histórica persistida, no datos de negocio. `bindingStatus`
es `absent|current|dataset_changed|column_removed|unavailable` derivado al leer.
Si falta permiso de datasets/sources, devolver unavailable y snapshot=null, nunca
nombres físicos; copia y lectura tampoco sortean autorización de metadatos.
Warnings no contienen valores sensibles ni nombres ajenos.

Dominio completo: description y owner. Dimensión: definition/grain/binding;
medida añade unit/aggregation. KPI: todos sus escalares declarativos de §3, listas
dimensionIds/measureIds no vacías y componentes completos. Vigencia requiere
validFrom; validTo es opcional para vigencia abierta, no faltante obligatorio.
Campos que no aplican se documentan explícitamente, no se inventan por servidor.
Nunca exigir unit/aggregation a dimensión. Dataset changed o column removed o
unavailable implica pendiente de revisión de binding; no reanclar snapshot.
Los paths de `missingMetadata` son nombres camelCase de campos anteriores y
`components.{id}.<campo>` para dependencias del KPI; no mensajes arbitrarios.
Completitud puede cambiar por cambios externos sin incrementar versión del objeto.
Warnings es una lista de códigos sin texto libre:
`binding_dataset_changed|binding_column_removed|binding_unavailable`; el frontend
los traduce a mensajes locales sin interpolar nombres físicos no autorizados.
Páginas de listas usan el mismo DTO de ficha, no un resumen con campos implícitos.

ConsumerPage: items `{id,name,version,domainId}`, total/limit/offset. Protección
es permanente tras primer uso; consumerCount puede volver a cero. Primer uso
marca protected sin incrementar versión de contenido del componente; incluso con
ETag anterior un PUT debe comprobar protección y rechazarlo. ETag no sustituye
autorización ni la comprobación de consumidores.

## 5. Mutaciones, reintentos y concurrencia

POST requiere Idempotency-Key, 1..100 ASCII imprimibles, vigencia 24 h desde alta;
scope `(tenant,subject,operation,resourceTarget,key)`. Copia incluye ID origen en
target. Fingerprint SHA-256 del DTO normalizado con defaults; listas de refs y
sinónimos se ordenan para huella (su orden no tiene semántica), sin ordenarlas
dentro de fórmulas/texto. Comprobar autorización actual antes del replay; para
devolver snapshot con datos físicos también permisos actuales de fuentes/datasets.
Huella distinta→409; misma→misma respuesta original y 201, sin nueva escritura.
Recurso editado después no altera replay. UI debe GET actual tras alta/replay.
No revalidar binding vigente en replay, sí en una creación nueva. Al expirar puede
crearse otro recurso, sujeto a unicidad; no se promete exactly-once indefinido.

PUT requiere If-Match fuerte `"{entero positivo}"`; ausente 428, malformado 422,
obsoleto 412. Autorización/visibilidad antes de devolver información de versión.
Protección de componente se comprueba siempre dentro de la misma transacción que
la edición. Edición de KPI sustituye referencias y protege nuevos componentes
atómicamente con versión/auditoría; nunca modifica contenidos de componentes.
Al conservar binding igual no refrescar snapshot ni invalidar guardado sólo por
cambio externo del dataset. Snapshot histórico se mantiene también en copia;
editar binding de copia nunca usada permite validarlo y renovarlo explícitamente.

## 6. Autorización, errores y observabilidad

GET necesita `semantic:read`; POST/PUT `semantic:read` + `semantic:write`.
Crear/cambiar binding, copiar o leer snapshot físico necesita además
`datasets:read` + `sources:read`. Sin ellos, mutación de binding/copia→403;
lectura semántica sin detalles físicos según §4. IdP productivo no recibe nuevos
grants automáticamente. Local: sólo data-admin/other-data-admin reciben scopes
semánticos; analyst/viewer mantienen sus concesiones previas.

Envelope existente `{error:{code,message,requestId}}`. No interpolar valores del
cliente. Detalles opcionales sólo paths de metadata de allowlist, no cuerpos.

| HTTP | code / condición |
| --- | --- |
| 401 / 403 | authentication_required o invalid_token / permission_denied |
| 404 | not_found para recurso o referencia inexistente/ajena; sin revelar existencia |
| 409 | name_conflict, idempotency_conflict, component_protected |
| 412 / 428 | version_conflict / precondition_required |
| 413 / 415 | body_too_large / unsupported_media_type |
| 422 | validation_error, invalid_idempotency_key, invalid_reference (tipo/dominio visible incorrecto) |
| 503 | storage_unavailable / identity_unavailable |

Sin Cache de definiciones: no-store; X-Request-ID, CORS y cabeceras existentes.
Auditoría: `semantic.domain.create|update`, `semantic.component.create|update|copy`,
`semantic.kpi.create|update`, recurso ID y request ID, en transacción; no fórmula,
metadatos libres, credenciales ni payload en auditoría/logs. Error inesperado→500
internal_error genérico. Reintentos no duplican auditoría.

## 7. Ejemplos, pruebas y gate

Alta dominio: `POST /domains` con Idempotency-Key y `{"name":"Logística"}`.
Alta medida: `{"name":"Tiempo de entrega","kind":"measure","domainId":"<UUID del dominio>"}`.
Alta KPI: `{"name":"Entrega puntual","domainId":"<UUID del dominio>","measureIds":[],"dimensionIds":[]}`.
Son ejemplos incompletos, no payloads con IDs literales implementados ni resultados
calculados. Respuesta de cada alta: version=1, draft, pending, faltantes visibles.

Pruebas de contrato del plan T2–T7: todos los límites con valores frontera,
campos prohibidos anidados, dos tenants, scopes por operación, replay tras edición,
primer uso concurrente, copia sin propagación y binding histórico. OpenAPI generado
deberá concordar antes del cierre. Compatibilidad aditiva; rollback de aplicación
requiere binario que soporte esquema v4 o restore probado (DM-003), no sólo volver
a ejecutar el binario actual que rechaza versiones futuras.

Gate REQUIRES_REVIEW: Producto/usuario revisa límites, scopes, DTO y semántica;
desarrollo/seguridad revisa implementación futura. Contexto/handoff:
[plan T1–T7](../../../docs/superpowers/plans/2026-10-16-us-003-semantic-catalog-plan.md),
[modelo](../data-models/DM-003-semantic-catalog.md),
[UX](../../../docs/ux/us-003/README.md). Revisión técnica documental del autor,
no prueba de API ejecutada ni aprobación humana de este artefacto nuevo.
