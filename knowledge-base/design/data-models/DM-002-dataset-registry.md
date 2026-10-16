---
type: Data Model
id: DM-002
title: Persistencia del registro de datasets
description: Modelo lógico y propuesta física SQLite v3 para US-002, sin modificar Gold.
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: data-model-designer/0.2.0
  at: 2026-10-16T13:48:30-05:00
sources:
  - id: IMD-001
    resource: /knowledge-base/business/information-model/IMD-001-registro-datasets.md
  - id: API-002
    resource: /knowledge-base/design/api-contracts/API-002-dataset-registry.md
  - id: US-002
    resource: /knowledge-base/requirements/user-stories/US-002-registrar-datasets-y-metadatos.md
  - id: UX-US002-D01
    resource: /docs/ux/us-002/README.md
  - id: UX-US002-D02
    resource: /docs/ux/us-002/README.md
  - id: CURRENT-DATABASE
    resource: /codebase/backend/synapse_api/database.py
  - id: CURRENT-SOURCES
    resource: /codebase/backend/synapse_api/sources.py
---

# DM-002 — Registro de datasets

## 1. Alcance, evidencia y alternativas

Entrada conceptual: IMD-001 (CONDITIONAL, cuatro relaciones, cardinalidades y
dos términos pendientes). Propuesta física para el incremento local, no
aprobación del motor productivo. API-002 documenta decisiones DS-D01 a DS-D09.

AS-IS inspeccionado: SQLite guarda fuentes, observaciones, dashboards y auditoría;
`source_observations` tiene clave compuesta tenant/source/id y snapshot JSON.
La tabla `idempotency` actual referencia dashboards: **no reutilizarla para datasets**.
La inspección previa a este incremento admitía versiones 1 y 2, sin tablas v3.
Tras UX-US002-D03, la implementación local añade las cuatro tablas y migración v3.

Se recomienda ampliar ese control plane (API-002 opción 1). Migrar todo a
PostgreSQL o crear otro servicio se dejan fuera; Gold no recibe escrituras.
No hay tabla dataset, actor ni reglas de gobierno nuevas en la fuente de datos.

## 2. Decisiones de persistencia

| ID | Propuesta | Procedencia / razón |
| --- | --- | --- |
| DM2-D01 | Agregado Dataset, sus columnas e inputs en SQLite; escrituras atómicas | INFERENCE de API-002 DS-D02/06 y patrón Database.connect(write=True). |
| DM2-D02 | Referencias compuestas con tenant y sin cascadas destructivas | INFERENCE de US-009 y claves existentes; evita cruces y pérdida de procedencia. |
| DM2-D03 | Copiar metadatos técnicos observados al crear; conservar enlace al snapshot | INFERENCE: ficha reproducible, sin reconsultar PostgreSQL ni reanclar automáticamente. |
| DM2-D04 | Idempotencia específica del nuevo recurso, no mezclar con dashboards | Evidencia directa del esquema actual; inferencia de API-002 DS-D06. |
| DM2-D05 | Migración v3 aditiva, backup/restore y ningún down automático | INFERENCE operativa; no borrar datos existentes. |
| DM2-D06 | Índices, límites y política de unicidad | INFERENCE operativa alineada con DS-D09; revisar antes de aplicar. |

El usuario aprobó este modelo y API-002 para el incremento local mediante
UX-US002-D02, después de confirmar los borradores en UX-US002-D01. No se crea
ni aprueba un ADR, ni se valida una topología o motor productivo.

## 3. Modelo lógico y ownership

| Agregado o referencia | Responsabilidad | Relación |
| --- | --- | --- |
| Dataset | Identidad del catálogo, tipo declarado, origen, gobierno y estado de registro | Un tenant posee 0..N datasets; identidad global opaca y clave acotada al tenant |
| Selección de columnas | Nombres y metadatos técnicos de una observación | Dataset contiene 1..500 columnas, según propuesta de validación estructural |
| Inputs declarados | Procedencias adicionales de una preparación ya existente | Dataset preparado contiene 0..20 en borrador; registrado exige al menos uno, mínimo local aprobado |
| Observación de salida | Snapshot exitoso del objeto seleccionado | N datasets pueden referenciar la misma observación; referencia inmutable propuesta |
| Respuesta idempotente | Resultado original de una creación | Asociada a tenant, subject, operación y clave |

El módulo de datasets es dueño de sus tablas; Source Connectivity conserva
ownership de fuentes/observaciones. No editar snapshots ni secretos desde el
módulo nuevo. Responsable de negocio declarado es un atributo, no el usuario
técnico ni una regla de autorización.

## 4. Esquema físico del incremento local

SQLite TEXT para identificadores/timestamps UTC y textos; INTEGER para versión,
posición y flags. Los límites de texto y cuerpos son los de API-002.

### dataset_registry

- tenant_id, id: NOT NULL, PRIMARY KEY compuesta.
- name, normalized_name: NOT NULL; UNIQUE(tenant_id, normalized_name).
- description: NOT NULL, vacío permitido.
- kind: NOT NULL, CHECK direct/prepared.
- registration_status: NOT NULL, CHECK draft/registered.
- source_id, observation_id, schema_name, object_name: NOT NULL, origen inmutable.
- owner_declared, classification_declared, freshness_expectation, load_reference:
  TEXT nullable; null expresa ausencia, no un valor ficticio «desconocido».
- process_reference: TEXT nullable; sólo para kind prepared.
- medallion_document: TEXT nullable; objeto JSON con las cinco declaraciones
  descritas en API-002. No deducirlo de schema_name.
- source_metadata_document: TEXT NOT NULL; objeto técnico del snapshot de salida,
  con columnas y restricciones de origen; sólo campos sanitizados de SRC-001.
  Se genera en servidor, nunca se acepta como documento del cliente.
- created_by, created_at, updated_at: TEXT NOT NULL; identidad/fechas del servidor.
- version: INTEGER NOT NULL, CHECK version >= 1, empieza en 1.
- FK(tenant_id, source_id, observation_id) →
  source_observations(tenant_id, source_id, id), ON DELETE RESTRICT.

CHECK adicionales: prepared/direct coherente con process_reference; registered
requiere owner_declared, classification_declared y freshness_expectation no vacíos.
La validez del snapshot, presencia de inputs, selección y campos condicionales
se valida transaccionalmente en servicio: no afirmar que un CHECK local pueda
comprobar filas de otra tabla o contenido de una observación.

No guardar governanceValidation ni scores configurables por cliente. Completitud
y missingMetadata se derivan de los valores con el mismo evaluador en GET y en
escritura. Clasificación, owner y expectativas siguen siendo declaraciones.

### dataset_columns

- tenant_id, dataset_id, column_name: TEXT NOT NULL; PRIMARY KEY compuesta.
- ordinal: INTEGER NOT NULL y positivo; UNIQUE(tenant_id, dataset_id, ordinal).
- FK(tenant_id, dataset_id) → dataset_registry(tenant_id, id), RESTRICT.
- El nombre debe existir en source_metadata_document, validado por servicio.
  El ordinal conserva orden de snapshot, no el orden arbitrario del request.

Metadatos de columnas viven una sola vez en source_metadata_document; esta tabla
representa la selección. SourceConstraints se muestran como restricciones del
objeto, sin convertir una proyección de PK compuesta en clave del dataset.

### dataset_inputs

- tenant_id, dataset_id: TEXT NOT NULL; ordinal INTEGER positivo.
- source_id, observation_id, schema_name, object_name: TEXT NOT NULL.
- observed_metadata_document: TEXT NOT NULL; copia técnica de cada input exitoso.
- PRIMARY KEY(tenant_id, dataset_id, ordinal).
- UNIQUE(tenant_id, dataset_id, source_id, observation_id, schema_name, object_name).
- FK(tenant_id, dataset_id) → dataset_registry(tenant_id,id), RESTRICT.
- FK(tenant_id,source_id,observation_id) → source_observations(tenant_id,source_id,id), RESTRICT.

No enlaces recursivos a otros datasets en esta versión: los inputs son objetos
observados. El servicio rechaza el mismo origen de salida y duplicados. No hay
fetch de URLs del proceso ni importación automática de linaje a nivel de columna.

### dataset_requests

- tenant_id, subject, operation, key: TEXT NOT NULL, PRIMARY KEY compuesta;
  operation fija `datasets.create` en esta versión.
- fingerprint, dataset_id, response_document, created_at, expires_at: TEXT NOT NULL.
- FK(tenant_id,dataset_id) → dataset_registry(tenant_id,id), RESTRICT.
- Documento de respuesta sin credenciales; ventana de replay propuesta 24 h.
  Eliminar sólo caché vencida mediante rutina futura explícita; no borrar datasets.
- Audit_events existente recibe acción/recurso y contexto técnico, sin payloads.

### Índices y consistencia de filtrado

- dataset_registry(tenant_id, updated_at DESC, id ASC).
- dataset_registry(tenant_id, kind, registration_status, updated_at DESC, id ASC).
- dataset_registry(tenant_id, source_id, observation_id).
- dataset_inputs(tenant_id, source_id, observation_id).
- dataset_requests(expires_at).

Completitud se calcula con la misma regla también para filtros/total **antes**
de paginar. Puede utilizar predicado de lectura o evaluar candidatos del tenant
en la entrega local; no filtrar sólo una página ni mantener un flag desincronizado.
La implementación deberá medir ese coste; catálogo grande requiere evolución
del almacenamiento/consulta, no se promete rendimiento no medido.

No exigir extensión JSON de SQLite no verificada; validar/deserializar documentos
en la aplicación. Todas las consultas parametrizadas. No concatenar identificadores
de objetos de PostgreSQL como SQL ejecutable.

## 5. Transacciones y concurrencia

Creación: autorizar → normalizar DTO → BEGIN IMMEDIATE → buscar replay válido
del tenant/subject → resolver todos los snapshots dentro del tenant → validar
objetos/columnas y estado → comprobar nombre → insertar agregado/selección/inputs
→ calcular respuesta → insertar replay y auditoría → commit. Ante error, rollback
total: ni dataset parcial, ni replay huérfano, ni evento de éxito.

Edición: autorizar y exigir If-Match → BEGIN IMMEDIATE → buscar dataset del tenant
→ comparar versión/origen/tipo → validar selección/gobierno → reemplazar selección
e inputs, incrementar versión y updated_at → auditar → commit. Las copias de origen
no se sustituyen por el snapshot más reciente; inputs nuevos deben resolverse con
su observación explícita. CreatedAt/createdBy no cambian.

La fuente puede estar desconectada: el flujo no invoca SourceService.connector.
Si su configuración cambió, la respuesta informa la versión observada y la actual;
no atribuye metadatos antiguos a otra conexión ni elimina la referencia histórica.

## 6. Migración, respaldo y reversión

DM2-D05 propone una migración numerada v3. Primero inspeccionar versión y
rechazar versiones futuras no soportadas; preservar rutas de inicialización
desde base nueva, v1 y v2. Crear las tablas/índices nuevos y registrar versión 3
en una transacción de migración explícita, sin asumir que executescript conserva
una transacción externa. Fallo intermedio debe dejar versión y tablas coherentes.

No alterar datos de kpis/dashboards/sources/source_observations ni credenciales.
No escribir en Docker, cambiar roles de PostgreSQL ni modificar tablas Gold.
No tocar la tabla de idempotencia de dashboards para acomodar otros recursos.

Backup consistente de SQLite con WAL mediante mecanismo de backup/pausa
controlada, no copia aislada del .db mientras sigue escribiendo. Conservar clave
de fuentes existente con protección separada y comprobar restore de ambas piezas.
Estos son requisitos de verificación futura, no backups ya realizados.

Rollback funcional desactiva nuevas rutas/scopes sin borrar datos. El binario
anterior sólo admite v1/v2: no desplegarlo contra v3. Rollback físico requiere
backup previo y acuerdo explícito sobre escrituras posteriores; no hay down
destructivo automático ni pérdida silenciosa de registros.

## 7. Privacidad, retención y operación

Los metadatos pueden ser sensibles; scope de lectura del catálogo no expone
secretos de conexión. No duplicar password/ciphertext/host/usuario en dataset.
Los comentarios técnicos sí pueden existir en la copia; revisión de política
de metadatos sensibles pendiente (SRC-001). Clasificación libre no es una ACL.

No se declara cifrado integral de SQLite: Fernet existente protege credenciales
de fuentes, no todos los metadatos. ACL, cifrado de disco/backup, cuotas, retención
de registros/observaciones/auditoría y operación de claves requieren responsables
de Seguridad/Plataforma. No borrar observaciones referenciadas por conveniencia.

## 8. Pruebas, trazabilidad y gate

DS-T01/02 prueban borrador, completitud y regla propuesta de registro. DS-T03/04
validan referencias, FK, estado y tenant; DS-T05/06 idempotencia y concurrencia;
DS-T07 persistencia sin conexión; DS-T08 no modifica Gold ni catálogo semántico.
Añadir migración nueva/v1/v2, rechazo de versión futura, fallo a mitad sin
metadatos de migración falsos y restore consistente. Verificar columnas de fuente
seleccionadas y restricciones compuestas sin inferir unicidad de la proyección.

DM2-D01 a DM2-D06 y el contrato asociado fueron aceptados para el incremento
local en UX-US002-D02. Gate REQUIRES_REVIEW y status draft conservan los pendientes
de revisión formal/productiva: ownership empresarial, retención y motor definitivo.
IMD-001 sigue CONDITIONAL. No hay handoff productivo aprobado. La implementación
local verificó migración nueva/v1/v2, rechazo previo de versión futura, fallo
intermedio sin tablas/marca v3, conservación de registros y ciphertext, FK,
escrituras concurrentes, rollback del agregado, backup SQLite y recuperación
con una nueva app. GET/list comparten una transacción de lectura para evitar
mezclar versiones durante un PUT concurrente. Backend: 84 pruebas con PostgreSQL opt-in; 83 y una omitida
sin opt-in. No se realizó ni se afirma un backup operativo de la base del usuario.
La evidencia y revisión de cierre corresponden al
[plan de desarrollo](../../../docs/superpowers/plans/2026-10-16-us-002-dataset-registry-plan.md),
ejecutado localmente tras UX-US002-D03, con checkpoints en su ledger propio.
