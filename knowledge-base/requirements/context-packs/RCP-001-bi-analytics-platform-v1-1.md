---
type: RequirementContextPack
id: RCP-001
title: Contexto de requisitos - BI Analytics Platform v1.1
description: Contexto funcional trazable para refinar requisitos de una plataforma BI semantica empresarial, multiproducto y multitenant.
status: draft
generated:
  by: agent/gpt-5
  at: 2026-10-15T00:00:00-05:00
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
    version: 1.1
    date: 2026-10-15
related: []
---

# Requirement Context Pack - BI Analytics Platform v1.1

## 1. Metadata y pregunta de trabajo

- **Producto o proceso:** BI Analytics Platform.
- **Código o iniciativa:** BI Analytics Platform v1.1, opción A.
- **Responsable funcional:** `[PENDIENTE: nombrar responsable funcional y owners de dominio]`.
- **Fecha:** 2026-10-15.
- **Pregunta de trabajo:** ¿Qué contexto funcional mínimo y trazable debe validarse para convertir la propuesta de BI semántica con ingeniería de datos complementaria en requisitos refinables?
- **Estado:** Borrador; requiere validación humana.
- **Fuente autorizada:** PRD-BI-ANALYTICS-V1.1 (`/intents/PRD.md`).

## 2. Objetivo y alcance

### Objetivo de negocio

Proporcionar una plataforma empresarial multiproducto y multitenant que convierta datos operacionales y analíticos en modelos semánticos reutilizables, métricas gobernadas y experiencias de análisis coherentes, trazables y autorizadas.

El resultado observable esperado es que un mismo KPI publicado pueda consumirse de forma consistente desde dashboards, APIs, exportaciones y respuestas IA autorizadas, con origen, grano, frescura, calidad, ownership y lineage visibles.

**Provenance:** PRD-BI-ANALYTICS-V1.1, secciones 1, 4 y 19.

### Incluido

- Catálogo de fuentes, datasets, entidades, dimensiones, medidas, KPI y modelos semánticos.
- Versionado y publicación de modelos semánticos.
- Consumo por dashboards, charts, KPI cards, consultas, APIs, exportaciones y agentes IA.
- Fuentes directas y datasets preparados mediante ingeniería de datos complementaria.
- Medallion opcional por dataset cuando exista una necesidad documentada.
- Calidad, freshness, estado de publicación y lineage.
- Aislamiento multitenant en lectura, escritura, metadatos, consultas, almacenamiento, cachés, exportaciones, jobs, IA y observabilidad.
- Ontologías, cubos y extensiones posteriores al núcleo semántico.

### Excluido

- Reemplazar un lakehouse corporativo general.
- Copiar físicamente todos los datos de todos los dominios.
- Fijar una nube, herramienta o motor propietario sin workloads representativos.
- Entrenar modelos fundacionales propios.
- Permitir que IA publique o redefina KPI sin gobierno.
- Resolver residencia de datos sin una política empresarial validada.

### Restricciones conocidas

- No hay NFR aprobados con valores de volumen, concurrencia, latencia, disponibilidad, freshness, retención o recuperación.
- No están confirmadas las fuentes concretas, contratos existentes ni motores desplegados.
- No se ha confirmado el arquitecto responsable, el primer dominio ni los owners.
- Las decisiones arquitectónicas visibles son propuestas, no aprobaciones humanas.

**Provenance:** PRD-BI-ANALYTICS-V1.1, secciones 2.2, 2.3, 15 y 20.

## 3. Resumen ejecutivo del contexto

La iniciativa evoluciona desde una PoC de dashboards hacia una plataforma de análisis gobernada. El problema principal no es sólo visualizar datos: es compartir significado de negocio, evitar KPI duplicados, mantener lineage, controlar calidad y freshness, y aplicar aislamiento multitenant también en caminos indirectos como cachés, exportaciones e IA.

La propuesta prioriza una capa semántica gobernada como contrato de consumo. La ingeniería de datos se incorpora cuando una fuente directa no basta para historización, CDC, replay, reconciliación, calidad, volumen, concurrencia o desacoplamiento. La plataforma debe permanecer abierta al cambio de motor y no asumir que todos los datasets requieren el mismo pipeline físico.

El contexto es suficiente para iniciar descubrimiento funcional y definir contratos conceptuales, pero no para cerrar la selección de motores, prometer rendimiento, decidir tiers de aislamiento ni aprobar la arquitectura.

## 4. Registro de evidencia

| ID | Hallazgo | Fuente y fragmento | Tipo | Confianza |
|---|---|---|---|---|
| E-001 | La capa semántica gobernada es el contrato principal de consumo. | PRD, sección 1: “El contrato principal de consumo es la capa semántica gobernada”. | Hecho | Alta |
| E-002 | La plataforma es empresarial, multiproducto y multitenant. | PRD, sección 1. | Hecho | Alta |
| E-003 | La ingeniería de datos es complementaria y prepara o sirve datos cuando la semántica no basta. | PRD, secciones 1 y 4. | Hecho | Alta |
| E-004 | Medallion es opcional y se activa por criterios de valor, no universalmente. | PRD, secciones 1, 6 y 10. | Hecho | Alta |
| E-005 | El modelo semántico debe servir a dashboards, APIs, exportaciones y agentes IA. | PRD, secciones 4, 8 y 19. | Hecho | Alta |
| E-006 | El tenant es un límite de seguridad y gobierno, no sólo un filtro `tenant_id`. | PRD, principios de diseño y sección 13. | Hecho | Alta |
| E-007 | La IA sólo debe usar modelos, documentos y datos autorizados y no cambiar KPI silenciosamente. | PRD, secciones 2.3, 5, 13, 14 y 19. | Hecho | Alta |
| E-008 | Se proponen capas lógicas y separación de control plane/data plane. | PRD, sección 8. | Hecho | Alta |
| E-009 | Los estados de modelo semántico propuestos son draft, review, published, deprecated y retired. | PRD, FR-004, sección 14. | Hecho | Alta |
| E-010 | No existen NFR aprobados ni datos suficientes para cerrar motor, tier de aislamiento o promesas de rendimiento. | PRD, sección 15. | Hecho | Alta |
| E-011 | El primer dominio, owners, workloads y políticas de residencia/retención requieren decisión humana. | PRD, sección 20. | Hecho | Alta |
| E-012 | Los actores organizacionales y autorizadores concretos no están identificados. | Ausencia declarada en PRD, secciones 2.2, 15 y 20. | Vacío | Alta |

## 5. Hechos confirmados

- El contrato de consumo debe ser semántico y gobernado, no una definición local de dashboard.
- El alcance incluye una plataforma empresarial multiproducto y multitenant.
- El núcleo funcional incluye catálogo, glosario, entidades, dimensiones, medidas, KPI, relaciones, modelos semánticos, publicación y lineage.
- Los modelos semánticos tienen ciclo de vida y deben exponer calidad, freshness y origen.
- Data Engineering puede producir datasets preparados, pero no es el dueño del significado oficial de los KPI.
- Medallion, modelos dimensionales, caché y búsqueda vectorial son capacidades condicionadas por el caso de uso; no son automáticamente la fuente de verdad.
- Visualization & Experience y AI Analytics no deben acceder directamente a fuentes o tablas sin una ruta autorizada.
- El aislamiento debe cubrir datos derivados, archivos, logs, jobs, cachés, exportaciones y contexto IA.
- El PRD no autoriza todavía una marca, motor, nube, tier de tenant ni SLO.

**Provenance:** PRD-BI-ANALYTICS-V1.1, secciones 1, 4, 5, 8, 9, 10, 11, 12, 13, 14 y 15.

## 6. Supuestos e hipótesis

### Supuestos provisionales

- **S-001:** Semantic Governance será una capacidad con ownership funcional explícito. Requiere confirmación del responsable de negocio/arquitectura.
- **S-002:** Un mismo modelo semántico podrá ser consumido por varios productos y experiencias. Requiere validar contratos y límites de tenant.
- **S-003:** El MVP comenzará con un dominio y workloads representativos, aunque el dominio no está definido. Requiere decisión humana.

### Hipótesis del agente

- **H-001:** La mayor parte del valor inicial puede obtenerse con un núcleo semántico y fuentes gobernadas directas, agregando preparación física sólo donde los criterios lo justifiquen.
- **H-002:** Las políticas de acceso, calidad, freshness y lineage deberán ser atributos visibles del modelo semántico para que consumidores funcionales puedan tomar decisiones informadas.
- **H-003:** La IA debe ser tratada como consumidor sujeto a los mismos límites de tenant y publicación que dashboards y APIs.

Estas hipótesis no son decisiones ni requisitos aprobados.

## 7. Vacíos y preguntas abiertas

| Pregunta | Destinatario | Prioridad | Estado |
|---|---|---|---|
| ¿Quién es el responsable funcional y quién acepta las decisiones arquitectónicas? | Negocio / ARQ | Alta | Abierta |
| ¿Cuál es el primer dominio y quién es su owner/steward? | Negocio | Alta | Abierta |
| ¿Qué fuentes y workloads representan el MVP? | Negocio / AF / DEV | Alta | Abierta |
| ¿Qué volumen, crecimiento, concurrencia y freshness se esperan por tenant? | Negocio / DEV / ARQ | Alta | Abierta |
| ¿Qué NFR deben gobernar el benchmark y la aceptación? | ARQ / DEV / QA | Alta | Abierta |
| ¿Qué tenants o clases de datos requieren aislamiento físico? | Negocio / Seguridad / ARQ | Alta | Abierta |
| ¿Qué política de residencia, retención, borrado y recuperación aplica? | Negocio / Legal / Seguridad | Alta | Abierta |
| ¿Qué KPI, dimensiones y relaciones son imprescindibles para el primer release? | Negocio / AF | Alta | Abierta |
| ¿Qué estados, permisos y evidencias requiere el flujo de publicación de un modelo o KPI? | Negocio / AF / ARQ | Alta | Abierta |
| ¿Qué nivel de autonomía se permite a los agentes IA? | Negocio / Seguridad / ARQ | Alta | Abierta |
| ¿Qué capacidades de la PoC se reutilizan con evidencia de producción? | Producto / DEV / ARQ | Media | Abierta |

## 8. Mapa funcional

### Actores

Los siguientes son roles o bounded contexts funcionales descritos por el PRD; no equivalen todavía a personas, equipos o permisos organizacionales confirmados.

- **Owner/steward de negocio:** define significado, ownership y aprobación de KPI.
- **Source Connectivity:** registra conectores, credenciales referenciadas, salud y esquemas observados.
- **Data Engineering:** prepara datasets, jobs, calidad técnica, checkpoints e historización cuando aplica.
- **Semantic Governance:** administra glosario, entidades, dimensiones, medidas, KPI, versiones, publicación y lineage lógico.
- **Analytical Serving:** resuelve consultas semánticas, agregaciones, materializaciones y freshness.
- **Visualization & Experience:** compone dashboards, charts, filtros, layouts y exportaciones mediante consultas autorizadas.
- **AI Analytics:** facilita exploración y explicación con grounding autorizado, citas y trazabilidad.
- **Tenant & Access Governance:** administra tenant, membresías, roles, políticas de fila/columna, claves y auditoría.
- **Arquitecto responsable:** valida decisiones y NFR; aún no identificado.

### Procesos y estados

1. Registrar una fuente y observar su esquema sin convertirlo automáticamente en significado de negocio.
2. Registrar un dataset directo o preparado con owner, clasificación, freshness y lineage.
3. Definir entidades, dimensiones, medidas, KPI, jerarquías, sinónimos y relaciones.
4. Versionar y publicar un modelo semántico en estados `draft`, `review`, `published`, `deprecated` o `retired`.
5. Resolver una consulta semántica con políticas de tenant y devolver calidad, freshness y lineage.
6. Consumir el resultado en dashboard, API, exportación o agente IA autorizado.
7. Ejecutar ingeniería complementaria con errores, reintentos, calidad, historización y trazabilidad cuando corresponda.
8. Cambiar una definición de KPI distinguiendo cambio semántico de cambio físico y registrando consumidores afectados.

### Datos relevantes

- Tenant, producto, dominio, usuario, membresía, rol y política de acceso.
- Fuente, conexión, esquema observado, dataset, clasificación, owner y freshness.
- Entidad, dimensión, medida, KPI, fórmula, unidad, grano, aditividad, versión, vigencia y estado.
- Modelo semántico, filtros, jerarquías, sinónimos, relaciones, lineage y publicación.
- Job, transformación, checkpoint, resultado de calidad, error, reintento e historización.
- Consulta semántica, plan, resultado temporal, caché, materialización y exportación.
- Dashboard, chart, KPI card, API, sesión IA, grounding, explicación y cita de lineage.
- Auditoría de acceso, cambio de modelo, publicación y uso de datos.

### Dependencias y consumidores

- Fuentes operacionales y analíticas autorizadas.
- Conectores, APIs, bases de datos, archivos y eventos, aunque las fuentes concretas están pendientes.
- Control plane para metadatos, políticas, publicación y auditoría.
- Data plane para datos, datasets preparados, tablas, consultas y artefactos derivados.
- Dashboards, APIs, exportaciones y agentes IA como consumidores del contrato semántico.
- Benchmark de workloads para seleccionar motores y materializaciones.

No se confirma ninguna tecnología, proveedor, contrato externo o integración concreta que no esté identificada en el PRD.

## 9. Restricciones y riesgos funcionales

| ID | Riesgo o restricción | Impacto funcional | Tratamiento inicial |
|---|---|---|---|
| R-001 | KPI duplicados o incompatibles entre productos. | Resultados inconsistentes y pérdida de confianza. | Ownership, glosario, versionado y publicación centralizada. |
| R-002 | Fuga cross-tenant por joins, cachés, exports, IA o logs. | Incidente de seguridad y violación de límites de negocio. | Políticas centralizadas, aislamiento por capas y pruebas negativas. |
| R-003 | Medallion impuesto sin necesidad. | Coste, latencia y duplicación innecesarios. | Criterios por dataset y registro de coste/beneficio. |
| R-004 | Motor sin capacidad para los workloads reales. | Consultas lentas, fallos o imposibilidad de escalar. | Benchmark con NFR y plan de salida por contrato. |
| R-005 | Freshness, disponibilidad o recuperación asumidas sin aprobación. | Expectativas funcionales incumplidas. | Declarar estado por dataset y acordar objetivos. |
| R-006 | IA responde sin grounding o lineage auditable. | Respuestas plausibles pero no verificables. | Modelos autorizados, citas, auditoría y límites de publicación. |
| R-007 | Sensibilidad de datos no clasificada. | Exposición en capas intermedias o exportaciones. | Clasificación, minimización, mascarado y controles por columna. |
| R-008 | Ontología/cubo demasiado ambicioso para el MVP. | Retraso del núcleo semántico. | Priorizar relaciones y dominios necesarios. |

## 10. Decisiones y validación humana

| Decisión o validación | Responsable | Evidencia | Fecha |
|---|---|---|---|
| Usar una capa semántica gobernada como contrato principal. | Arquitecto responsable pendiente | PRD, sección 1; decisiónStatus indica ADR propuesto | Pendiente |
| Activar ingeniería de datos y Medallion sólo cuando exista necesidad demostrable. | Arquitecto responsable pendiente | PRD, secciones 1, 6 y 10 | Pendiente |
| Mantener aislamiento multitenant en todas las capas relevantes. | Arquitecto/seguridad pendiente | PRD, principios y sección 13 | Pendiente |
| Permitir IA sólo sobre modelos, documentos y datos autorizados. | Arquitecto/seguridad/producto pendiente | PRD, secciones 2.3, 5, 13 y 14 | Pendiente |
| Aprobar el presente contexto para continuar a refinamiento. | Responsable funcional pendiente | Checklist de validación humana | Pendiente |

No se ha identificado una decisión humana aprobatoria en la fuente abierta.

## 11. Knowledge Candidates con provenance

| Candidato | Provenance | Verificador | Estado |
|---|---|---|---|
| Contrato semántico gobernado como interfaz común de consumo. | PRD-BI-ANALYTICS-V1.1, secciones 1, 4 y 5. | Arquitecto responsable + owner de Semantic Governance | Pendiente |
| Modelo de KPI con fórmula, grano, aditividad, owner, versión, lineage y estado. | PRD-BI-ANALYTICS-V1.1, sección 11.3. | Owner de dominio + AF | Pendiente |
| Criterios para activar Medallion por dataset. | PRD-BI-ANALYTICS-V1.1, secciones 10.3 y 10.4. | Arquitecto + Data Engineering | Pendiente |
| Controles de aislamiento multitenant por capas. | PRD-BI-ANALYTICS-V1.1, sección 13.2. | Seguridad + Arquitecto | Pendiente |
| IA grounded sólo en modelos y datos autorizados. | PRD-BI-ANALYTICS-V1.1, secciones 13.3, 14 y 19. | Producto + Seguridad + Arquitecto | Pendiente |
| Estados del ciclo de vida de un modelo semántico. | PRD-BI-ANALYTICS-V1.1, FR-004. | Owner de Semantic Governance | Pendiente |

Estos candidatos no deben convertirse en conocimiento canónico hasta ser revisados y aprobados con provenance.

## 12. Handoff para el siguiente rol

### Qué puede usar el siguiente rol

- El problema de negocio, objetivo y alcance de la plataforma.
- El contrato semántico como centro de consumo propuesto.
- El inventario inicial de actores conceptuales, procesos, estados y datos.
- Los requisitos funcionales FR-001 a FR-012 como material de entrada, aún no refinados.
- La matriz de preguntas abiertas y riesgos para planificar descubrimiento.
- Los Knowledge Candidates como entradas para glosario, reglas, modelo conceptual y User Stories, sujetos a validación.

### Qué debe validar antes de continuar

- Responsable funcional, arquitecto responsable y owners de dominio.
- Dominio, fuentes, tenants y workloads del MVP.
- NFR, clasificación, residencia, retención y estrategia de aislamiento.
- Definiciones y gobernanza de KPI, estados, permisos y aprobadores.
- Contratos funcionales entre modelos semánticos, datasets preparados y consumidores.
- Política de grounding, citas, auditoría y autonomía de IA.
- Si el contexto queda aprobado con pendientes o debe volver a descubrimiento.

### Artefactos relacionados

- [PRD.md](/intents/PRD.md)
- [ADRs.md](/architecture/ADRs.md)
- [ADR-011](/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md)
- [ADR-012](/architecture/ADR-012-medallion-opcional-por-dataset.md)
- [ADR-013](/architecture/ADR-013-modelos-dimensionales-para-serving.md)
- [ADR-014](/architecture/ADR-014-seleccion-de-motores-por-workload.md)
- [ADR-015](/architecture/ADR-015-aislamiento-multitenant-por-capas.md)
- [ADR-016](/architecture/ADR-016-ia-sobre-modelos-autorizados.md)
