---
type: RequirementContextPack
id: RCP-005
title: Ingeniería de datos complementaria para US-007
description: Contexto funcional, evidencia y decisiones abiertas para el primer incremento de preparación de datos.
status: draft
generated:
  by: af-requirement-context-builder/1.0
  at: 2026-10-31T23:45:13-05:00
sources:
  - id: US-007
    resource: /knowledge-base/requirements/user-stories/US-007-ejecutar-ingenieria-de-datos-complementaria.md
  - id: US-002
    resource: /knowledge-base/requirements/user-stories/US-002-registrar-datasets-y-metadatos.md
  - id: US-008
    resource: /knowledge-base/requirements/user-stories/US-008-evaluar-medallion-por-dataset.md
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
  - id: DATASET-FORM
    resource: /codebase/apps/bi-analytics/src/pages/datasets/DatasetForm.tsx
  - id: DATASET-DETAIL
    resource: /codebase/apps/bi-analytics/src/pages/datasets/DatasetDetail.tsx
  - id: DM-001
    resource: /knowledge-base/design/data-models/DM-001-retail-gold-study.md
  - id: SRC-001
    resource: /knowledge-base/design/api-security/SRC-001-postgresql-source-registry.md
---

# RCP-005 — Ingeniería de datos complementaria para US-007

## 1. Metadata y pregunta de trabajo

- Producto: BI Analytics Platform. Iniciativa: US-007 / FR-007.
- Responsable funcional: por confirmar entre Producto y Data Engineering.
- Pregunta: ¿qué primer caso de preparación requiere el usuario y qué información y controles deben permitir ejecutarlo y comprobar su resultado?
- Estado: borrador para descubrimiento; no aprueba un alcance implementable ni una solución.

## 2. Objetivo y alcance

**Objetivo de negocio:** permitir que Data Engineering obtenga y verifique resultados de preparación rastreables cuando el consumo directo de un dataset no satisface la necesidad [US-007; PRD §14].

**Incluido en el análisis:** selección del caso/dataset; relación con proceso e insumos; inicio y seguimiento; resultados de calidad, errores, reintentos y trazabilidad; responsabilidades y decisiones de primer incremento [US-007].

**Excluido por ahora:** selección de tecnología u orquestador; políticas, umbrales, tiempos o capacidades no aprobados; afirmar que Medallion sea obligatorio [US-007; PRD §§10 y 14].

## 3. Resumen ejecutivo del contexto

El PRD describe ingeniería complementaria para casos donde el consumo semántico directo no basta. El primer incremento acordado es backend-first para ventas con CDC sintético en PostgreSQL Gold: Data Engineering entrega lotes CDC o BI los lee por polling cada minuto desde la fuente registrada. Ambos flujos validan y materializan versiones inmutables en `prepared`, sin escribir en `gold`; los resultados también aparecen en el catálogo existente. La UI se difiere. El backend y su API aún no se han implementado. Quedan decisiones sobre la tabla/consulta CDC, definición exacta de evento inválido, registro de metadatos de catálogo y retención de linaje/configuración.

## 4. Registro de evidencia

| ID | Hallazgo | Fuente | Tipo | Confianza |
|---|---|---|---|---|
| E-01 | FR-007 enumera ejecuciones, calidad, errores, reintentos y trazabilidad. | PRD §14 FR-007; US-007 §§4–5 | Hecho documental | Alta |
| E-02 | La preparación complementa la semántica cuando esta no basta. | PRD §§1 y 4; RCP-001 §3 | Hecho documental | Alta |
| E-03 | US-007 identifica selección de caso/dataset y tratamiento de fallas como pendientes bloqueantes. | US-007 §§12 y 17 | Hecho documental | Alta |
| E-04 | La UI de datasets declara referencia e inputs; no ejecuta ni consulta el proceso. | DATASET-FORM; DATASET-DETAIL | Hecho de implementación localizado | Alta |
| E-05 | Medallion se evalúa por dataset; no se presume universal. | US-008; PRD §10 | Hecho documental | Alta |
| E-06 | El usuario eligió continuar con US-007. | Conversación actual, 2026-10-31 | Decisión humana de selección | Alta |
| E-07 | El primer incremento registra y consulta ejecuciones externas; los resultados pueden ingresar por registro manual de Data Engineering o integración automática. | Conversación actual, 2026-10-31 | Decisión humana de alcance y mecanismos | Alta |
| E-08 | El caso inicial es ventas con historial/CDC. | Conversación actual, 2026-11-01 | Decisión humana de caso | Alta |
| E-09 | El incremento debe producir un dataset preparado y versionado para consumo, además del registro de ejecución y trazabilidad. | Conversación actual, 2026-11-01 | Decisión humana de resultado | Alta |
| E-10 | El dataset preparado de ventas expone el historial completo de altas, cambios y bajas y también el estado vigente. | Conversación actual, 2026-11-01 | Decisión humana de semántica CDC | Alta |
| E-11 | Cada ejecución exitosa crea una versión inmutable; una fallida conserva su registro, pero no reemplaza la versión consumible vigente. | Conversación actual, 2026-11-01 | Decisión humana de versionado | Alta |
| E-12 | En este incremento el historial CDC se conserva sin vencimiento. | Conversación actual, 2026-11-01 | Decisión humana de retención | Alta |
| E-13 | Los eventos CDC se ordenan por la secuencia/posición del origen cuando esté disponible; si falta, se usa la fecha/hora del evento de origen y los empates se marcan como ambiguos. | Conversación actual, 2026-11-01 | Decisión humana de orden | Alta |
| E-14 | Bloquean la publicación de una versión: clave de negocio ausente, evento CDC inválido, campos obligatorios ausentes y duplicados por identificador de origen. | Conversación actual, 2026-11-01 | Decisión humana de calidad | Alta |
| E-15 | Ante falla se registra el intento y evidencia, se conserva disponible la última versión exitosa y Data Engineering puede reintentar manualmente; no hay reintentos automáticos. | Conversación actual, 2026-11-01 | Decisión humana de fallas/reintentos | Alta |
| E-16 | Cada evento CDC debe incluir identificador único de origen, clave de negocio, operación (alta/cambio/baja) y fecha/hora del evento; altas/cambios requieren imagen posterior completa, bajas requieren la clave. La posición CDC del origen es opcional. | Conversación actual, 2026-11-01 | Decisión humana de contrato de evento | Alta |
| E-17 | El caso de estudio ya contiene ventas sintéticas en PostgreSQL Gold, pero declara fuera de alcance ETL y CDC; no se ha localizado un flujo CDC implementado. | DM-001 §Contexto, alcance y decisiones; inspección del repositorio, 2026-11-01 | Hecho de documentación/código | Alta |
| E-18 | Para este incremento de laboratorio se generarán eventos CDC sintéticos sobre la base existente de ventas PostgreSQL Gold. | Conversación actual, 2026-11-01 | Decisión humana de fuente para laboratorio | Alta |
| E-19 | BI leerá automáticamente los eventos CDC desde PostgreSQL en el laboratorio. | Conversación actual, 2026-11-01 | Decisión humana de integración | Alta |
| E-20 | La lectura automática se activará por polling periódico; el intervalo queda pendiente. | Conversación actual, 2026-11-01 | Decisión humana de activación | Alta |
| E-21 | En laboratorio, BI consulta PostgreSQL cada minuto y retoma desde la última posición procesada para evitar reprocesar eventos ya registrados. | Conversación actual, 2026-11-01 | Decisión humana de intervalo/idempotencia | Alta |
| E-22 | Data Engineering puede registrar ejecuciones manuales y reintentar dentro de su tenant; consumidores autenticados de ese tenant consultan ejecuciones y versiones publicadas; no se permite acceso cross-tenant. | Conversación actual, 2026-11-01 | Decisión humana de autorización | Alta |
| E-23 | Data Engineering ve código/mensaje técnico saneado y conteos afectados; consumidores solo ven estado y si se publicó versión. Ningún rol ve payload crudo, secretos ni datos personales en el mensaje. | Conversación actual, 2026-11-01 | Decisión humana de exposición de errores | Alta |
| E-24 | Cada ejecución muestra ID, dataset/proceso, origen manual/automático, inicio/fin, estado, conteos por operación y rechazados, resultados de controles, versión publicada y referencia a la última versión exitosa. | Conversación actual, 2026-11-01 | Decisión humana de consulta | Alta |
| E-25 | Cada versión publicada conserva linaje inmutable al dataset fuente, proceso/configuración, ejecución que la produjo y rango de posiciones/eventos CDC consumido. | Conversación actual, 2026-11-01 | Decisión humana de linaje | Alta |
| E-26 | Estados de ejecución: Recibida, Procesando, Publicada, Fallida técnica y Rechazada por calidad. Cada reintento crea un nuevo intento enlazado al anterior, conservando todo el historial. | Conversación actual, 2026-11-01 | Decisión humana de estados/reintentos | Alta |
| E-27 | No hay máximo fijo de reintentos manuales; Data Engineering puede reintentar cuando corresponda y cada intento queda enlazado y auditado. | Conversación actual, 2026-11-01 | Decisión humana de límite de reintentos | Alta |
| E-28 | SRC-001 documenta registro de fuentes PostgreSQL por tenant, scopes separados, secreto protegido, conexión desde backend y cuenta lectora sin privilegios elevados. | SRC-001 §Actores, fronteras y decisiones / §Operación local y configuración | Hecho documental de diseño existente | Alta |
| E-29 | El polling CDC reutilizará el registro PostgreSQL existente de US-001, con credencial lectora por tenant y conexión exclusiva desde backend. | Conversación actual, 2026-11-01 | Decisión humana de integración/credenciales | Alta |
| E-30 | Las versiones del dataset preparado se persistirán en un esquema PostgreSQL `prepared` separado de `gold`, usando una credencial escritora distinta a la credencial lectora de la fuente. | Conversación actual, 2026-11-01 | Decisión humana de destino de salida | Alta |
| E-31 | En el flujo manual Data Engineering entrega un lote de eventos CDC con el esquema aprobado; el backend lo valida y materializa la versión preparada. | Conversación actual, 2026-11-02 | Decisión humana de entrada manual | Alta |
| E-32 | El dataset preparado de ventas también debe registrarse en el catálogo existente, además de exponerse mediante API de versiones. | Conversación actual, 2026-11-02 | Decisión humana de catálogo | Alta |
| E-33 | La administración de la fuente PostgreSQL reutiliza el scope existente `sources:write`. | Conversación actual, 2026-11-02 | Decisión humana de autorización | Alta |
| E-34 | En el laboratorio, los registros de ejecución y la evidencia de fallas saneada se conservan sin vencimiento. | Conversación actual, 2026-11-02 | Decisión humana de retención | Alta |

## 5. Hechos confirmados

- US-007 está en borrador y su preparación figura CONDITIONAL [US-007 §§1, 17].
- El registro existente conserva una referencia declarada e inputs observados de un dataset preparado, sin certificar ejecución [E-04].
- El caso inicial confirmado es ventas con historial/CDC y un dataset preparado versionado para consumo [E-08; E-09].
- La salida CDC contiene el historial completo de altas, cambios y bajas y el estado vigente [E-10].
- Cada ejecución exitosa crea una versión inmutable; una ejecución fallida no sustituye la versión consumible vigente [E-11].
- En este incremento el historial CDC no tiene vencimiento [E-12].
- Los eventos se ordenan por secuencia/posición del origen; si falta, se usa fecha/hora del evento y los empates se marcan ambiguos [E-13].
- Bloquean publicar una versión: clave de negocio ausente, evento CDC inválido, campos obligatorios ausentes o duplicados por identificador de origen. El conjunto mínimo confirmado es identificador de origen, clave de negocio, operación, fecha/hora y datos posteriores completos para alta/cambio; baja requiere la clave; la posición CDC es opcional [E-16]. La definición formal de evento inválido sigue pendiente [E-14].
- Ante falla, se registra el intento y su evidencia, se mantiene la última versión exitosa disponible y Data Engineering puede reintentar manualmente; no se ejecutan auto-retries [E-15].
- La política de retención indefinida del historial CDC y reintentos manuales ilimitados está aprobada para este incremento; no representa una política productiva general [E-12; E-27].

## 6. Supuestos e hipótesis

- **Hipótesis H-01:** una primera entrega acotada por un caso concreto facilitaría validar valor y responsabilidades. No es alcance aprobado.
- **Hipótesis H-02:** la referencia de proceso declarada en US-002 podría vincularse a un proceso ejecutable o externo; su identidad y validez no están demostradas [DATASET-FORM].
- **Supuesto provisional:** el resultado de una ejecución necesita asociarse a su dataset y a una persona o proceso responsable; campos y cardinalidades requieren decisión humana.

## 7. Vacíos y preguntas abiertas

| ID | Pregunta | Destinatario | Prioridad | Estado |
|---|---|---|---|---|
| Q1 | ¿Cuál es el caso concreto, dataset y resultado esperado del primer incremento? | Producto / Data Engineering | Alta | Resuelta: ventas con historial/CDC; dataset preparado y versionado para consumo |
| Q2 | ¿Cómo ingresan al primer incremento los resultados de ejecuciones externas? | Producto / Data Engineering | Alta | Resuelta: registro manual e integración automática |
| Q3 | ¿Qué controles de calidad validar sobre el dataset CDC antes de hacerlo consumible? | Data Engineering / owner | Alta | Resuelta: cuatro controles bloqueantes; umbrales cuantitativos no definidos |
| Q4 | ¿Qué definición exacta hace inválido un evento CDC? | Owner de dataset / Data Engineering | Alta | Parcial: contrato mínimo y controles bloqueantes definidos; criterios detallados de validación son propuesta de diseño |
| Q5 | ¿Qué límite aplica a reintentos manuales? | Data Engineering / operaciones | Alta | Resuelta: sin máximo fijo; Data Engineering reintenta manualmente y cada intento queda enlazado/auditado; sin auto-retry |
| Q7 | ¿Qué estados y campos mínimos debe mostrar la consulta de ejecuciones/versiones? | Data Engineering / UX / Seguridad | Alta | Resuelta: estados y campos visibles definidos |
| Q8 | ¿Qué retención aplica a linaje/configuración del proceso y qué metadatos del catálogo tendrá el dataset generado? | Data Engineering / Semantic Governance | Alta | Parcial: registro en catálogo y vínculos de linaje acordados; valores de metadatos y retención de linaje abiertos |
| Q9 | ¿Qué estructura de eventos y condiciones operativas aplican al polling CDC desde PostgreSQL? | Data Engineering / operaciones | Media | Parcial: poll cada minuto, fuente lectora existente y destino `prepared` con writer separado acordados; esquema/consulta CDC pendientes |
| Q10 | ¿El registro manual recibe metadatos del resultado o un lote de eventos CDC para materializar la versión preparada? | Producto / Data Engineering | Alta | Resuelta: lote CDC según E-16, validado/materializado por backend |
| Q11 | ¿Qué rol administra la fuente PostgreSQL y qué retención aplica a evidencia de falla? | Producto / Seguridad | Alta | Resuelta para laboratorio: `sources:write`; runs/evidencia saneada sin vencimiento |

## 8. Actores, procesos, datos y dependencias

- **Actor inicial:** Data Engineering registra/reintenta y prepara dentro del tenant; consumidores autenticados del mismo tenant leen las versiones publicadas [E-22].
- **Proceso acordado:** recibir lote manual o leer CDC automáticamente cada minuto; validar; registrar estados Recibida/Procesando/Publicada/Fallida técnica/Rechazada por calidad; publicar nueva versión únicamente con éxito. Reintento siempre manual y cada intento permanece enlazado [E-15; E-21; E-26; E-27].
- **Datos acordados:** evento CDC mínimo, metadatos de ejecución, conteos/calidad, checkpoint, versión preparada y linaje [E-16; E-24; E-25]. Esquema SQL y metadatos del registro automático son detalles de diseño.
- **Dependencias:** US-002 registra datasets; US-008 evalúa Medallion cuando corresponda. Relación con serving de US-005 depende del caso y de las decisiones de datos [US-007 §11].
- **Consumidores:** Data Engineering ve detalle saneado y consumidores del tenant ven estado/salida publicada; el resultado también se registra en el catálogo [E-22; E-23; E-32].

## 9. Restricciones y riesgos funcionales

- No presentar una referencia declarada como evidencia de ejecución o calidad verificada [E-04].
- La política base de falla/reintento y publicación está acordada [E-11, E-14, E-15]; quedan pendientes estados visibles, límite de reintentos y definición exacta de evento inválido.
- El aislamiento por tenant está acordado para runs y versiones. La fuente usa `sources:write`; la retención de ejecuciones/evidencia saneada es indefinida solo en laboratorio [E-22; E-33; E-34].
- Medallion no es requisito universal y su activación necesita justificación [US-008].
- La interfaz aplicable debe seguir las referencias Stitch aprobadas y el mandato local; no existe todavía una pantalla aprobada para este flujo en este pack [AGENTS.md].

## 10. Decisiones y validación humana

| Decisión | Responsable | Evidencia | Estado |
|---|---|---|---|
| Continuar con US-007 como siguiente requerimiento | Usuario | Conversación actual, 2026-10-31 | Confirmada |
| Primer incremento: registro manual de lotes CDC y lectura automática desde PostgreSQL, backend-first | Usuario | E-07, conversación actual | Confirmada; fuente/consulta CDC física pendiente |
| Caso y resultado del primer incremento: ventas con historial/CDC y dataset preparado versionado para consumo | Usuario | E-08 y E-09, conversación actual, 2026-11-01 | Confirmada |
| Contenido CDC: altas, cambios, bajas y estado vigente; historial sin vencimiento | Usuario | E-10 y E-12, conversación actual | Confirmada |
| Versionado: versión inmutable por ejecución exitosa; fallo no reemplaza versión consumible vigente | Usuario | E-11, conversación actual, 2026-11-01 | Confirmada |
| Retención del historial CDC sin vencimiento en este incremento | Usuario | E-12, conversación actual, 2026-11-01 | Confirmada |
| Orden CDC por secuencia/posición de origen, con fecha/hora del evento como fallback y empates ambiguos | Usuario | E-13, conversación actual, 2026-11-01 | Confirmada |
| Cuatro controles estructurales bloquean publicar versión: clave ausente, evento inválido, campos obligatorios ausentes, duplicado por ID de origen | Usuario | E-14, conversación actual, 2026-11-01 | Confirmada; semántica formal de evento inválido pendiente |
| Fallas: registrar intento/evidencia, conservar versión exitosa, permitir reintento manual por Data Engineering; sin reintento automático | Usuario | E-15, conversación actual, 2026-11-01 | Confirmada |
| Evento CDC mínimo y contenido para alta/cambio/baja, con posición de origen opcional | Usuario | E-16, conversación actual, 2026-11-01 | Confirmada |
| Fuente del laboratorio: eventos CDC sintéticos sobre ventas PostgreSQL Gold existente | Usuario | E-17/E-18, conversación actual, 2026-11-01 | Confirmada |
| Integración automática: polling PostgreSQL cada minuto desde última posición procesada | Usuario | E-19/E-20/E-21, conversación actual | Confirmada |
| Configuración CDC: reutilizar fuente US-001, credencial lectora tenant-scoped, conexión backend-only | Usuario | E-28/E-29 | Confirmada; contrato de lectura CDC pendiente |
| Destino preparado: esquema PostgreSQL `prepared`, separado de `gold`, con escritor distinto | Usuario | E-30 | Confirmada |
| Entrada manual: lote CDC validado/materializado por backend | Usuario | E-31 | Confirmada |
| Catálogo: el dataset preparado también se registra en el catálogo existente y se expone por API de versiones | Usuario | E-32 | Confirmada |
| Administración de la fuente mediante `sources:write` | Usuario | E-33 | Confirmada |
| Registros de ejecución y evidencia saneada sin vencimiento en laboratorio | Usuario | E-34 | Confirmada |
| Registro en cat?logo existente del dataset preparado y exposici?n por API de versiones | Usuario | E-32 | Confirmada |
| Acceso: Data Engineering registra/reintenta; consumidores autenticados consultan salidas; límite tenant | Usuario | E-22 | Confirmada |
| Errores saneados por rol; sin payload crudo, secretos ni datos personales; evidencia de laboratorio sin vencimiento | Usuario | E-23/E-34 | Confirmada |
| Administraci?n de la fuente mediante `sources:write`; ejecuciones/evidencia saneada sin vencimiento en laboratorio | Usuario | E-33/E-34 | Confirmada |
| Campos y estados por ejecución: E-24/E-26 | Usuario | E-24/E-26 | Confirmada |
| Linaje por versión: fuente, proceso/configuración, ejecución y rango CDC inmutables | Usuario | E-25 | Confirmada; retención de linaje pendiente |
| Estados y reintentos: E-26; intentos manuales sin máximo fijo, E-27 | Usuario | E-26/E-27 | Confirmada |


| Validación funcional del pack | Responsable funcional por asignar | Pendiente | Abierta |

## 11. Knowledge Candidates con provenance

| Candidato | Provenance | Verificador | Estado |
|---|---|---|---|
| Asociación de una ejecución con dataset, proceso, historial CDC y versión de salida | E-08; E-09 | Data Engineering / owner | Confirmado; historial CDC incluye altas, cambios y bajas más estado vigente [E-10]; cada ejecución exitosa produce versión inmutable y el fallo no desplaza la consumible [E-11] |
| Separación de ejecución directa y registro de ejecución externa | E-07; límite de DATASET-FORM | Producto / Data Engineering | Decidido para primer incremento: registrar/consultar ejecuciones externas; BI no las inicia |

## 12. Handoff para el siguiente rol

El diseño backend está en `docs/superpowers/specs/2026-11-02-us-007-backend-cdc-design.md` y pendiente de aprobación humana. Las decisiones humanas de alcance y las respuestas al Builder Check están incorporadas; el contrato SQL CDC y metadatos concretos de catálogo quedan como propuestas de diseño. La UI Stitch se difiere al siguiente incremento. No se implementó código.
