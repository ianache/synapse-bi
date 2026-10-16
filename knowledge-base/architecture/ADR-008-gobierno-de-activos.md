---
type: ADR
id: ADR-008
title: Versiones inmutables y publicación controlada de activos
description: Se propone gobernar activos semánticos y analíticos mediante versiones inmutables y publicación controlada.
tags: [architecture, adr, governance, versioning]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-003, ADR-011]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 1, 2, 4 and 8, sections 8.1 and 18; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved publication SLOs were not found
  consequences: agent synthesis from versions, lineage and control plane requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-008 - Versiones inmutables y publicación controlada de activos

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

El control plane posee catálogo, modelos, versiones, políticas, lineage, publicación y auditoría. Cambiar una definición publicada sin control puede romper dashboards, APIs, exportaciones y agentes.

**Provenance:** PRD, principios 1, 2, 4 y 8, secciones 8.1 y 18; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Versiones inmutables y publicación controlada (propuesta).** Hace explícita la evolución y permite reproducir resultados.
2. **Edición in-place.** Es simple, pero rompe reproducibilidad y compatibilidad.
3. **Copias manuales por consumidor.** Evita cambios directos, pero fragmenta governance y lineage.

## Decisión

**Se propone que los activos gobernados se versionen de forma inmutable y se publiquen mediante un flujo controlado con auditoría y compatibilidad explícita.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** esquema de versionado, gates de aprobación, compatibilidad, rollback y retención de versiones.

## Metas de calidad

`[PENDIENTE]`: no se encontraron objetivos aprobados.

## Consecuencias

**Positivas:** reproducibilidad, rollback, lineage y consumidores protegidos de cambios silenciosos.

**Negativas y riesgos:** mayor almacenamiento y necesidad de resolver compatibilidad entre versiones.

**Impacto en pruebas:** publicación, lectura de versiones, compatibilidad, rollback y auditoría de cambios.

