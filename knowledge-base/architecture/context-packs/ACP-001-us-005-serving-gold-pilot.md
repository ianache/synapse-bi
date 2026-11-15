---
type: ArchitectureContextPack
id: ACP-001
title: Contexto de arquitectura — Piloto de serving Gold para US-005
description: Evidencia AS-IS, impactos y vacíos para integrar de forma acotada el API de consulta semántica con una vista Gold sintética PostgreSQL y medir una línea base de laboratorio.
status: draft
generated:
  by: architecture-context-builder/1.0
  at: 2026-10-18T00:00:00-05:00
sources:
  - id: US-005
    resource: /knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md
  - id: API-001
    resource: /knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md
  - id: DM-004
    resource: /knowledge-base/design/data-models/DM-004-semantic-model-drafts.md
  - id: ADR-005
    resource: /knowledge-base/architecture/ADR-005-motor-analitico.md
  - id: ADR-006
    resource: /knowledge-base/architecture/ADR-006-seguridad-de-consultas.md
  - id: ADR-014
    resource: /knowledge-base/architecture/ADR-014-seleccion-de-motores-por-workload.md
  - id: ADR-015
    resource: /knowledge-base/architecture/ADR-015-aislamiento-multitenant-por-capas.md
  - id: ADR-018
    resource: /knowledge-base/architecture/ADR-018-separacion-control-plane-data-plane.md
  - id: ASR-004
    resource: /knowledge-base/architecture/asr/asr-fr-005-serving-portability.md
  - id: GOLD-CASE-STUDY
    resource: /codebase/case-study/README.md
  - id: POSTGRES-COMPOSE
    resource: /codebase/case-study/docker-compose.yml
  - id: GOLD-VIEWS
    resource: /codebase/case-study/init/30-gold-views.sql
  - id: QUERY-SERVING
    resource: /codebase/backend/synapse_api/serving.py
  - id: QUERY-DATABASE
    resource: /codebase/backend/synapse_api/database.py
  - id: DATASET-POLICY
    resource: /codebase/backend/synapse_api/datasets/policy.py
  - id: DATASET-REGISTRY
    resource: /codebase/backend/synapse_api/datasets/service.py
  - id: POSTGRES-CONNECTOR
    resource: /codebase/backend/synapse_api/source_connector.py
  - id: AUTH-SCOPES
    resource: /codebase/backend/synapse_api/auth.py
---

# ACP-001 — Contexto de arquitectura para el piloto US-005

## 1. Propósito y alcance

Preparar el diseño de un incremento de laboratorio que conecte una consulta
acotada del API de US-005 con datos sintéticos de ventas en una vista Gold de
PostgreSQL y mida el recorrido extremo a extremo. El usuario confirmó ese límite
el 2026-10-18.

Este piloto no selecciona el workload productivo, no fija SLA ni umbrales de
calidad/frescura, no habilita SQL libre y no convierte borradores de US-003/US-004
en modelos ejecutables. La elegibilidad productiva exige política aprobada por
dataset; el usuario identificó al responsable del dataset/Data Steward como
aprobador para este alcance. La aplicación hoy no implementa ese flujo.

## 2. Evidencia, hechos e inferencias

### Hechos observados

- El serving actual resuelve un KPI, valida el scope `queries:execute` y luego
  admite únicamente `data_mode="synthetic"`; para otros modos responde 503.
- El camino sintético ejecuta consultas parametrizadas sobre tablas SQLite
  (`sales`/`sessions`) mediante un mapeo de KPI acotado. No acepta SQL enviado
  por el usuario.
- El conector PostgreSQL actual observa metadata/esquema para registrar fuentes;
  su contrato explícito evita leer filas de negocio.
- El registro de datasets conserva atributos de gobierno. La validación actual
  comprueba presencia de algunos metadatos; no hay estado de aprobación de
  política. `governance_validation` se expone como `pending`.
- Las definiciones del catálogo semántico y los borradores de modelo no ejecutan
  consultas sobre datasets.
- Los scopes actuales incluyen `datasets:read` y `datasets:write`, sin un scope
  separado para aprobar política de gobierno.
- El caso Gold usa PostgreSQL 18.6 en loopback, base `bi_analytics`, esquema
  `gold`; el fixture documenta 2.160 filas sintéticas de ventas y datos de dos
  tenants. Hay vistas Gold como `gold.v_kpi_daily` y `gold.v_revenue_daily`.
- `gold.v_kpi_daily` expone, entre otros, `tenant_id`, `date_key`, `channel_key`,
  `net_revenue`, `gross_profit`, `gross_margin_pct`, `eligible_sessions`,
  `converting_sessions` y `conversion_pct`.
- El repositorio describe políticas de solo lectura, aislamiento por tenant y
  vistas de seguridad en el caso de estudio. Estas propiedades deben volver a
  verificarse contra la configuración efectiva antes de usarlas como evidencia
  de seguridad del nuevo camino de serving.
- ADR-005, ADR-006, ADR-014, ADR-015, ADR-018 y ASR-004 están en estado propuesto,
  borrador o candidato. Este contexto no los aprueba ni cambia su estado.

### Inferencias para validar en el diseño

- El cambio cruza API, autenticación/autorización, conexión a datos, modelo de
  configuración, observabilidad y pruebas de integración; por ello es un cambio
  arquitectónicamente significativo aunque el workload sea de laboratorio.
- `gold.v_kpi_daily` parece una vista candidata adecuada para una primera consulta
  acotada, pero la selección de KPI, grano, filtros y mapeo debe decidirse en el
  diseño y probarse contra el contrato real de US-005.
- Una medición sobre el fixture pequeño solo caracteriza ese entorno y esa carga;
  no predice capacidad productiva.

## 3. Arquitectura AS-IS (resumen)

```text
Cliente → API US-005 → identidad/scope → resolver KPI
                              ├─ modo synthetic → SQL parametrizado → SQLite demo
                              └─ otro modo → 503

Registro de fuente → conector PostgreSQL → observación de esquema (sin filas)
Registro de datasets → metadatos de gobierno (sin aprobación de política)
Catálogo/modelos semánticos → metadatos y borradores (sin ejecución)
```

No se encontró un ejecutor conectado a PostgreSQL Gold desde el camino de
consulta semántica.

## 4. Impacto potencial

| Perspectiva | Clasificación | Impacto / evidencia |
|---|---|---|
| Serving e integración | DIRECT | El API y su adaptador de consulta deben alcanzar una vista Gold de forma acotada; hoy el camino es SQLite. |
| Datos y contratos | DIRECT | Debe existir asociación explícita entre consulta/KPI, dataset autorizado, vista y columnas; hoy no se ejecutan bindings semánticos. |
| Seguridad/autorización | DIRECT | Identidad, scope, tenant, acceso de solo lectura y autorización del dataset deben preservarse en el nuevo camino. El conector de metadata no es suficiente como enforcement de filas. |
| Gobierno | DIRECT | La política aprobada por Data Steward es gate productivo acordado, pero la app no registra aprobación ni autoridad. Debe aclararse si el piloto solo mide o implementa el gate. |
| Operación/secretos | DIRECT | Se requiere configuración segura de conexión de laboratorio y gestión de ciclo de vida; los secretos existentes no deben mostrarse ni copiarse. |
| Observabilidad/rendimiento | DIRECT | Medición extremo a extremo incluyendo API, autorización y acceso a PostgreSQL; registrar entorno y configuración, sin umbral de aceptación inventado. |
| UX | POTENTIAL | La salida puede necesitar identificar fuente/dataset y naturaleza sintética; preservar los estados de confianza y calidad ya establecidos en US-005. |
| Portabilidad | POTENTIAL | La consulta inicial a PostgreSQL no resuelve la elección del motor ni demuestra portabilidad del serving. ASR-004 permanece candidato. |
| Producción | NO_IMPACT (por exclusión) | El piloto no aprueba uso productivo, NFR, SLA ni política por clase global. |

## 5. Vacíos y decisiones pendientes

1. ¿El piloto implementa el registro/flujo de aprobación Data Steward, o la
   aprobación solo queda como criterio y gate documentado fuera del sistema?
2. ¿Qué KPI único representa mejor el piloto y cómo se asocia inequívocamente al
   dataset/vista Gold? `kpi_fin_net_revenue` es candidato, no decisión ratificada.
3. ¿Cómo se obtiene el tenant confiable y se garantiza el aislamiento en la
   conexión de serving? La seguridad del conector de observación no debe
   reutilizarse por suposición.
4. ¿Qué rol/esquema PostgreSQL de laboratorio se usará y cómo se evita privilegio
   administrativo? Usar solo una cuenta de lectura limitada.
5. ¿Cómo se parametrizan conexión y secretos sin introducir credenciales en
   código, documentación, logs o respuestas API?
6. ¿Qué protocolo reproducible define la línea base (ambiente, calentamiento,
   número de muestras, concurrencia, p50/p95, throughput y registro de fallos)?
   Son dimensiones sugeridas, no metas de servicio aprobadas.
7. ¿Qué mínimo verificable constituye una política aprobada por dataset
   (versionado, aprobador, fecha, vigencia, calidad/frescura y estado)? No se
   deben inventar umbrales.

## 6. Revisión crítica

- Riesgo de confundir el conector de introspección con un conector seguro de
  serving: tienen propósito y amenaza distintos.
- Riesgo de tratar aislamiento de tenant en el fixture como autorización
  suficiente: el API debe establecer el contexto de forma confiable y no depender
  de filtros controlados por el cliente.
- Riesgo de convertir la línea base sintética en promesa de capacidad o SLA.
- Riesgo de ejecutar KPI/modelos no publicados o bindings semánticos incompletos;
  el incremento debe usar una ruta fija y explícita, no un ejecutor general.
- Riesgo de afirmar “política aprobada” con solo campos presentes: hoy no existe
  aprobación persistida ni rol Data Steward en la aplicación.
- Ninguno de los ADR candidatos citados aporta por sí solo una decisión técnica
  aprobada para este piloto.

## 7. Validación humana registrada

- 2026-10-18: `human:ianache` seleccionó integración extremo a extremo del API
  con una vista Gold sintética y medición E2E; no solo benchmark aislado de DB.
- 2026-10-18: `human:ianache` seleccionó al responsable del dataset/Data Steward
  como aprobador de la política por dataset.
- 2026-10-18: `human:ianache` aprobó para documentar un diseño con adaptador
  PostgreSQL acotado a un KPI/vista y dejó el flujo de aprobación Data Steward
  como gate productivo, fuera del piloto.
- Decisiones anteriores de US-005: piloto sintético de ventas en PostgreSQL,
  línea base sin SLA, política aprobada requerida para producción. No se fijaron
  umbrales de producción.

## 8. Siguiente gate

El contexto fue validado y la especificación de diseño aprobada por
`human:ianache` el 2026-10-18. El siguiente gate es revisar/aprobar el
[plan de implementación](/docs/superpowers/plans/2026-10-18-us-005-postgres-gold-pilot-plan.md)
y escoger método de ejecución. No se aprueba aquí ejecución de borradores ni
cambios a ADR/ASR.
