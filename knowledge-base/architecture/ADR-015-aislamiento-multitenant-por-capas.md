---
type: ADR
id: ADR-015
title: El aislamiento multitenant se aplica por capas y por tier de riesgo
description: Se propone aplicar aislamiento desde la identidad hasta datos derivados, con estrategia fisica seleccionada por tier y riesgo.
tags: [architecture, adr, multitenancy, security, bi]
status: draft
adr_status: Propuesto
related: [ADR-011, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: ADRS-BI-ANALYTICS-V1.1, tema Multitenancy
  context: PRD-BI-ANALYTICS-V1.1 sections 5 and 13
  quality: PRD-BI-ANALYTICS-V1.1 sections 13 and 15; no approved security SLOs
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-015 - Aislamiento multitenant por capas

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, propuesta sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** [ADR-011](/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md)

## Contexto

`tenant_id` no es suficiente: el aislamiento debe cubrir identidad, metadatos, consultas, almacenamiento, cache, materializaciones, exportaciones, jobs, IA, logs, lineage y auditoria.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 5 y 13.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro el analisis.

1. **Aislamiento por capas y tier (propuesta).** Combina controles logicos y fisicos segun sensibilidad, residencia, personalizacion y riesgo.
2. **Filtro confiado de `tenant_id`.** Es simple, pero vulnerable a joins, cache, exports y caminos indirectos.
3. **Aislamiento fisico total para todos.** Refuerza separacion, pero puede imponer coste innecesario.

## Decision

**Se propone aplicar aislamiento multitenant desde la identidad hasta consultas, cache, materializaciones, exportaciones, jobs, IA y observabilidad, seleccionando la estrategia fisica por tier de riesgo.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** tiers concretos, politica de residencia, clasificacion de datos, claves, retencion, borrado y restauracion.

## Metas de calidad

`[PENDIENTE]`: no hay ASR o NFR aprobado con metricas de seguridad.

## Consecuencias

**Positivas:** reduce el riesgo de exposicion cross-tenant y hace verificables los limites de seguridad.

**Negativas y riesgos:** aumenta la superficie de controles y pruebas.

**Impacto en pruebas:** pruebas negativas de consultas, joins, cache, exportaciones, jobs, logs, lineage, recuperacion e IA.

**Provenance:** ADRS-BI-ANALYTICS-V1.1, tema Multitenancy, y PRD-BI-ANALYTICS-V1.1 seccion 13.
