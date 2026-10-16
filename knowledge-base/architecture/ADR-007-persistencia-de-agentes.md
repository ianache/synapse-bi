---
type: ADR
id: ADR-007
title: Sesiones durables y contexto aislado para agentes
description: Se propone persistir sesiones de agentes de forma durable y aislar el contexto por sesión, tenant y autorización.
tags: [architecture, adr, ai, agents, persistence]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-016]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 2, 6 and 7, bounded context AI Analytics; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: retention and availability targets were not found
  consequences: agent synthesis from AI session and grounding requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-007 - Sesiones durables y contexto aislado para agentes

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

AI Analytics necesita sesiones, grounding, explicaciones, feedback y trazabilidad. El contexto de una sesión no debe mezclarse con otro tenant, usuario, modelo autorizado o conversación.

**Provenance:** PRD, principios 2, 6 y 7 y bounded context AI Analytics; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Sesiones durables y contexto aislado (propuesta).** Permite reanudar, auditar y aplicar límites de autorización.
2. **Contexto sólo en memoria.** Simplifica el prototipo, pero pierde continuidad y trazabilidad.
3. **Contexto compartido por tenant.** Reduce duplicación, pero eleva riesgo de contaminación entre sesiones.

## Decisión

**Se propone persistir sesiones de agentes de forma durable y aislar su contexto por sesión, tenant, usuario y modelo autorizado.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** almacén, retención, cifrado, límites de contexto, borrado y recuperación ante fallo.

## Metas de calidad

`[PENDIENTE]`: no se encontraron objetivos aprobados de retención, disponibilidad o latencia.

## Consecuencias

**Positivas:** continuidad, auditoría y aislamiento explícito.

**Negativas y riesgos:** coste de persistencia, protección de datos conversacionales y gestión de expiración.

**Impacto en pruebas:** reanudación, concurrencia, aislamiento negativo, borrado y grounding sólo con artefactos autorizados.

