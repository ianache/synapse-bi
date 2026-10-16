---
type: API Contract
id: API-002
title: Registro de datasets y metadatos
description: Contrato propuesto para conectar las pantallas US-002 con el backend existente.
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: api-designer/0.2.0
  at: 2026-10-16T13:48:30-05:00
sources:
  - id: US-002
    resource: /knowledge-base/requirements/user-stories/US-002-registrar-datasets-y-metadatos.md
  - id: UX-US002-D01
    resource: /docs/ux/us-002/README.md
  - id: UX-US002-D02
    resource: /docs/ux/us-002/README.md
  - id: IMD-001
    resource: /knowledge-base/business/information-model/IMD-001-registro-datasets.md
  - id: DM-002
    resource: /knowledge-base/design/data-models/DM-002-dataset-registry.md
  - id: API-001
    resource: /knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md
  - id: SRC-001
    resource: /knowledge-base/design/api-security/SRC-001-postgresql-source-registry.md
---

# API-002 — Contrato propuesto de datasets

## 1. Objetivo, estado y alternativas

Conectar catálogo, selección de origen, formulario y ficha de US-002 a la API
Python. El usuario confirmó guardar borradores incompletos (UX-US002-D01).
El usuario aprobó después este contrato y DM-002 para el incremento local y
la preparación del plan (UX-US002-D02). La ejecución local se autorizó en
UX-US002-D03 y los cuatro endpoints están implementados.

Opciones consideradas:

1. **Ampliar el backend y registro SQLite actuales — recomendada para el
   incremento local.** Reutiliza identidad, auditoría y observaciones, con
   migración aditiva. No decide el almacén productivo.
2. Trasladar ahora el control plane a PostgreSQL: exige migrar fuentes,
   dashboards y secretos además de datasets; excede este incremento.
3. Crear otro servicio: añade despliegue, identidad y consistencia distribuida
   sin necesidad demostrada para el laboratorio.

Se propone la opción 1. PostgreSQL Gold sigue siendo una fuente externa de
lectura. No se crean tablas de catálogo en `gold`, no se leen filas ni se
ejecutan procesos de preparación. US-003/004/007/008 quedan fuera de alcance.

## 2. Decisiones y procedencia

| ID | Propuesta o decisión | Procedencia / razón |
| --- | --- | --- |
| DS-D01 | Permitir borradores incompletos, mostrar faltantes, sin aprobación implícita | FACT: UX-US002-D01 confirmado por usuario. |
| DS-D02 | Dataset anclado a una observación exitosa, objeto y selección explícita de columnas; origen y tipo inmutables después de crear | INFERENCE de UX US-002 y aislamiento histórico de SRC-001. Cambiar de origen/tipo crea otro dataset. |
| DS-D03 | `registrationStatus=draft|registered` separado de `completeness=complete|incomplete` y `governanceValidation=pending` | INFERENCE para distinguir registro, presencia de campos y autoridad; aceptada para incremento local en UX-US002-D02. |
| DS-D04 | Registro no borrador exige responsable, clasificación y expectativa de frescura declarados, además del linaje técnico; preparado exige proceso e inputs; Medallion exige sus campos adicionales | Mínimo local basado en US-002 AC-1 y BR-005 citada allí, aprobado en UX-US002-D02. La autoridad y políticas empresariales de US-002-Q1 siguen pendientes. |
| DS-D05 | Lectura/escritura con `datasets:read` / `datasets:write`; tenant del JWT | INFERENCE compatible con API-001/SRC-001; mapeo IAM productivo pendiente. |
| DS-D06 | POST idempotente y edición optimista con ETag/If-Match | INFERENCE del patrón de dashboards, evitando duplicados y pérdida de cambios. |
| DS-D07 | No abrir PostgreSQL al guardar/editar; validar contra snapshot persistido | INFERENCE para preservar observación y no depender de disponibilidad de la fuente. |
| DS-D08 | Clasificación y responsable como valores declarados; frescura/calidad `not_evaluated` | US-002-Q1/GQ-02 abiertas. No inventar taxonomía aprobada, IAM, objetivos ni mediciones. |
| DS-D09 | Límites y unicidad descritos abajo | INFERENCE operativa provisional para el laboratorio; no NFR/SLA aprobado. |

## 3. Actor, permisos y fronteras

Actor Data Engineering. OAuth2/OIDC/JWT mantiene el comportamiento existente;
no hay nuevo emisor de tokens. No aceptar tenant, subject, estado de aprobación
ni credenciales desde el cuerpo. `extra=forbid`, camelCase, sin SQL/DSN.

- GET datasets: requiere `datasets:read`; autoriza metadatos técnicos del
  catálogo de su tenant, no secretos de conexiones ni filas de negocio.
- POST/PUT: requiere `datasets:read`, `datasets:write` y `sources:read` para
  validar origen e inputs. No requiere `sources:observe`: observar es otra acción.
- Persona local `data-admin` recibe los nuevos scopes sólo en development/test.
  No ampliar los permisos del analista por defecto. Otro tenant recibe 404.
- Responsable declarado no controla permisos; `createdBy` viene del JWT y es
  distinto de ownership de negocio. No hay edición basada en texto del owner.

## 4. Recursos

Prefijo `/api/v1`. Endpoints nuevos y aditivos; no cambiar contratos de US-001.

| ID | Método y ruta | Resultado |
| --- | --- | --- |
| DS-R01 | GET `/datasets` | Página filtrada del tenant. |
| DS-R02 | POST `/datasets` | 201, Location, ETag; requiere Idempotency-Key. |
| DS-R03 | GET `/datasets/{id}` | Ficha completa y ETag; 404 si no visible. |
| DS-R04 | PUT `/datasets/{id}` | Reemplaza datos editables, 200 y nuevo ETag; requiere If-Match. |

No DELETE, publicación, certificación, ejecución SQL, carga ni endpoint de
evaluación de frescura. El historial técnico ya existente se consulta mediante
`GET /sources/{sourceId}/observations/{observationId}` con `sources:read`.

GET listado: `q` hasta 200 caracteres sobre nombre/objeto, `kind=direct|prepared`,
`registrationStatus=draft|registered`, `completeness=complete|incomplete`,
`limit=1..100` (defecto 50), `offset=0..10000`. Filtros omitidos no restringen.
Orden fijo `updatedAt DESC, id ASC`; página `{items,total,limit,offset}`.
No se ofrece un listado ilimitado. Filtros/orden se aplican antes de paginar;
las páginas por offset no prometen una instantánea frente a ediciones concurrentes.

## 5. DTO de escritura

Mismo cuerpo en POST y PUT; PUT no es un patch y los valores null limpian campos
opcionales. `preparation` es null si Directo; `medallion` null si no se declara
ese alcance. No inferir tipo por tabla/vista ni Medallion por nombre `gold`.

```json
{
  "name": "Ventas omnicanal",
  "description": "Registro técnico del laboratorio",
  "kind": "direct",
  "saveAs": "draft",
  "origin": {
    "sourceId": "<id-de-fuente>",
    "observationId": "<id-de-observacion-exitosa>",
    "schema": "gold",
    "object": "fact_sales"
  },
  "selectedColumns": ["tenant_id", "sales_line_key", "sale_amount"],
  "governance": {
    "owner": null,
    "classification": null,
    "freshnessExpectation": null,
    "loadReference": null
  },
  "preparation": null,
  "medallion": null
}
```

Contrato de campos (DS-D09):

- Nombre obligatorio aun en borrador: trim, NFC, 1–100 caracteres imprimibles;
  unicidad por tenant con NFC + casefold. Descripción hasta 2000; vacía permitida.
- Origin obligatorio y existente, observación `success`, objeto exacto de esa
  observación. Identificadores tratados como valores, nunca SQL.
- SelectedColumns: 1–500 nombres distintos, cada uno hasta 128 caracteres y
  presente en el objeto. Respuesta usa el orden de columnas del snapshot.
  Identificadores con espacios/comillas son válidos si coinciden con el snapshot.
- Owner, classification, freshnessExpectation, loadReference: texto opcional
  hasta 500 caracteres; trim, vacío se normaliza a null. Valores libres declarados,
  no una lista corporativa ficticia. LoadReference no se usa para consultar datos.
  La UI envía placeholders como null, no como valores prellenados «Por definir».
  Completitud mide presencia, no veracidad ni aprobación del contenido declarado.
- Prepared: `preparation={processReference,inputOrigins}`. ProcessReference es
  texto hasta 1000, no URL a ejecutar. InputOrigins hasta 20 referencias con la
  misma forma de Origin, sin duplicados ni la propia salida; todas existentes,
  exitosas y del mismo tenant. Son referencias a objetos observados, no a datasets
  recursivos; no se resuelven direcciones externas ni se inventan pipelines.
- Medallion: objeto opcional con schemaDescription, partitionPolicy,
  retentionPolicy, minimumQuality, tenantPolicy; textos hasta 500 cada uno,
  opcionales en borrador. Son declaraciones, no políticas aplicadas por la API.
- Cuerpo máximo 256 KiB, además de límites individuales; nunca truncar en silencio.

Una selección parcial de una PK/UQ compuesta no se anuncia como clave del dataset.
Las restricciones se muestran como **restricciones del objeto de origen**, sin
inferir grano, unicidad de la proyección ni relaciones semánticas.

## 6. Validación, estados y respuesta

DS-D01 aplica sólo a metadatos de gobierno/preparación, no permite referencias
rotas, nombre vacío o columnas inexistentes. Errores estructurales rechazan
también un borrador. El servidor calcula `missingMetadata` en este orden:
owner, classification, freshnessExpectation; si preparado, preparation.processReference
y preparation.inputOrigins; si Medallion, sus cinco campos anteriores en ese orden.
El linaje de salida está presente por el origen válido obligatorio.

- `saveAs=draft`: acepta faltantes y conserva `registrationStatus=draft`, incluso
  si se completaron todos los campos. Completitud se calcula independientemente.
- `saveAs=registered`: si faltan metadatos devuelve 422 `metadata_incomplete`,
  con `details.missingMetadata` (nombres de campos, no sus valores); si no, estado
  registered. **DS-D04 está aceptada para el incremento local; no aprueba el gobierno del dataset.**
- En PUT se puede volver explícitamente a draft para retirar metadatos; no
  degradar un registro automáticamente cuando saveAs pide registered.
- Lectura siempre muestra `governanceValidation=pending`, freshness/quality con
  `status=not_evaluated`, sin scores ni fecha de última carga inventada.

Ficha: id, name, description, kind, registrationStatus, completeness,
missingMetadata, governanceValidation, origin (incluye nombre de fuente, tipo
de objeto, observedAt, sourceVersion y currentSourceVersion), selectedColumns
con name/position/type/nullable/generated/comment copiados del snapshot,
sourceConstraints del objeto, governance, preparation, medallion, freshness,
quality, lineage, version, createdAt, updatedAt y createdBy. No contraseñas,
cifrado, claims completos ni parámetros de conexión. Fila de listado omite
columnas, restricciones, inputs y documentos largos; mantiene las claves
necesarias para identificar, filtrar y abrir la ficha.

Lineage lo produce el servidor: fuente → observación → objeto → dataset;
inputs preparados y proceso aparecen como declaraciones diferenciadas. Cambio
de configuración de la fuente se informa, no reancla ni invalida silenciosamente
la observación histórica. Guardar funciona si PostgreSQL está detenido, siempre
que exista una observación exitosa persistida y la autorización siga vigente.

## 7. Idempotencia, errores y concurrencia

Idempotency-Key obligatoria, 1–100 caracteres imprimibles. Alcance tenant +
subject + operación POST datasets. Fingerprint SHA-256 del DTO normalizado,
columnas ordenadas según snapshot e inputs ordenados por referencia. Ventana
propuesta de 24 h: misma clave/cuerpo devuelve el 201 y DTO original; clave con
cuerpo distinto, 409. Después de vencer no se garantiza replay; la unicidad de
nombre sigue evitando duplicados del mismo nombre. Autorización se comprueba
antes del replay. El cliente conserva clave ante fallo de red de resultado incierto.

ETag `"1"`, `"2"`, etc. If-Match ausente: 428; mal formado: 422; versión obsoleta:
412. PUT devuelve sólo tras commit de agregado, inputs, selección y auditoría.
Origin y kind no pueden cambiar por PUT: 409 `origin_immutable`. No hay
last-write-wins. Un POST repetido sin conservar clave no crea otro nombre idéntico.

Errores uniformes `{error:{code,message,requestId,details?}}`:
401 identidad, 403 scope, 404 referencia/recurso de otro tenant o inexistente,
409 conflicto de nombre/clave/origen, 412 versión, 413 tamaño,
422 estructura/columnas/observación fallida/metadatos requeridos,
428 precondición, 503 almacenamiento. Details sólo incluye rutas de campos
permitidas para `metadata_incomplete`; no mensajes SQL, cuerpos ni secretos.
`Cache-Control: no-store`, X-Request-ID y CORS conservan la política existente.

## 8. Frontend y pruebas de aceptación propuestas

Rutas `/datasets`, `/datasets/nuevo`, `/datasets/{id}`, `/datasets/{id}/editar`.
El explorador US-001 habilita Registrar dataset sólo con permisos y snapshot
exitoso; los parámetros preseleccionan origen, pero la API lo valida de nuevo.
Las cuatro capturas vigentes están en el [diseño UX](../../../docs/ux/us-002/README.md).
No hay catálogo ficticio como fallback si falla la API. La ficha y edición
obtienen estado persistido; registrar no añade KPI ni cambia consultas existentes.

| ID | Prueba futura | Trazabilidad |
| --- | --- | --- |
| DS-T01 | Crear borrador sin owner/clase/frescura; recargar y ver faltantes | UX-US002-D01, DS-D01 |
| DS-T02 | Completar, registrar y mantener validación pendiente | US-002 AC-1, DS-D03/04 aceptadas para incremento local |
| DS-T03 | Rechazar objeto/columna inexistente u observación fallida, aun en borrador | DS-D02/07 |
| DS-T04 | 401/403/404 y referencias de inputs de otro tenant | DS-D05, US-009 parcial |
| DS-T05 | Reintentar POST sin duplicado; conflicto de clave distinta carga | DS-D06 |
| DS-T06 | Dos ediciones con mismo If-Match: sólo una escribe; 428/412 | DS-D06 |
| DS-T07 | Reiniciar API; conservar ficha y columnas; detener PostgreSQL y guardar desde snapshot | DS-D07, DM-002 |
| DS-T08 | No alterar KPI, datos Gold, fuentes ni observaciones | US-001/002 y no-goals |
| DS-T09 | Preparado/Medallion declarados sin ejecutar procesos ni inferir tipo | US-002, DS-D04/08 |
| DS-T10 | E2E cuatro pantallas, errores/reintento, teclado, axe y móvil | Diseños UX, US-002 §9 |

## 9. Operación, compatibilidad y gate

Despliegue futuro: migración aditiva v3 descrita en DM-002; backup previo y
pruebas de restore. Scopes nuevos no se conceden automáticamente en producción.
Auditar dataset.create/update/draft/registration con tenant, subject, recurso,
request ID y fecha, sin payload ni valores de metadatos. Métricas operativas:
duración, código de resultado y conflictos, sin etiquetas de cardinalidad libre.
No afirmar observabilidad productiva ya implantada.

Rollback funcional: desactivar nuevos scopes/enlace y conservar registros.
No ejecutar binarios que rechacen schema v3 ni borrar tablas para retroceder.
Retención, cuotas por tenant, clasificación sensible de comentarios, IAM y motor
productivo requieren revisión de responsables, como en SRC-001.

El contrato y DM-002 fueron aprobados para el incremento local en UX-US002-D02.
Gate REQUIRES_REVIEW y status draft se conservan para revisión formal/productiva;
no existe aprobación productiva ni se añade una identidad de revisor no informada.
IMD-001 permanece CONDITIONAL en sus términos y cardinalidades de negocio.
El plan de implementación está en
[US-002 Dataset Registry](../../../docs/superpowers/plans/2026-10-16-us-002-dataset-registry-plan.md),
ejecutado localmente mediante Native/inline tras UX-US002-D03. Evidencia:
backend 84 pruebas con PostgreSQL opt-in, frontend 50, navegador datasets 3;
tipos/build correctos. Se verificaron DS-T01..10 mediante pruebas de política,
migración, observaciones, servicio, HTTP, reinicio y navegador. DS-T07 simula
connector caído sin detener Docker; DS-T08 compara KPI y snapshot antes/después.
La revisión independiente de cierre se registra en el ledger del plan. Los
pendientes formales/productivos siguen abiertos; no se inventa aprobador nominal.
