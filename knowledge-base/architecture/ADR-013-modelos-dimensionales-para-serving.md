---
type: ADR
id: ADR-013
title: Los modelos dimensionales sirven al analisis sin sustituir la semantica gobernada
description: Se propone usar modelos dimensionales como forma de serving analitico y no como sustituto del catalogo, glosario o politicas.
tags: [architecture, adr, bi, dimensional-modeling]
status: draft
adr_status: Propuesto
related: [ADR-011, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: ADRS-BI-ANALYTICS-V1.1, tema Modelos dimensionales
  context: PRD-BI-ANALYTICS-V1.1 sections 5, 8, 9 and 11
  quality: PRD-BI-ANALYTICS-V1.1 section 15; no approved metrics
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-013 - Modelos dimensionales para serving

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, propuesta sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** [ADR-011](/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md)

## Contexto

La dimensionalidad ayuda al serving y a las consultas analiticas, pero no expresa por si sola conceptos, sinonimos, reglas, ownership, lineage o politicas de acceso.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 5, 8, 9 y 11.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro el analisis.

1. **Dimensionalidad como forma de serving (propuesta).** Optimiza consultas sin convertirse en fuente del significado.
2. **Dimensionalidad como modelo semantico completo.** Simplifica una implementacion, pero pierde conceptos y gobierno que no caben en tablas.
3. **Sin modelo dimensional.** Reduce trabajo inicial, pero limita ciertos workloads analiticos.

## Decision

**Se propone usar modelos dimensionales para serving analitico, manteniendo el catalogo, glosario, lineage y politicas en la capa semantica gobernada.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** dimensiones iniciales, estrategia de historizacion, materializaciones y convenciones de modelado.

## Metas de calidad

`[PENDIENTE]`: no hay ASR o NFR aprobado con metricas.

## Consecuencias

**Positivas:** separa significado de optimizacion fisica y permite adaptar el serving.

**Negativas y riesgos:** exige sincronizar definiciones semanticas con estructuras dimensionales.

**Impacto en pruebas:** verificar consistencia de KPI, grano, aditividad, lineage y filtros de tenant.

**Provenance:** ADRS-BI-ANALYTICS-V1.1, tema Modelos dimensionales, y PRD-BI-ANALYTICS-V1.1 secciones 5, 8, 9 y 11.
