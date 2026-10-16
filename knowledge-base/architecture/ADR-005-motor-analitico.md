---
type: ADR
id: ADR-005
title: Motor analítico mediante adaptador y adopción de Trino por fases
description: Se propone abstraer el motor mediante un adaptador y evaluar Trino por fases, sin fijar un motor único sin benchmark.
tags: [architecture, adr, analytical-serving, trino]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-014]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 5 and 8, sections 12 and 18; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: workloads and approved benchmark thresholds were not found
  consequences: agent synthesis from portability and benchmark requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-005 - Motor analítico mediante adaptador y adopción de Trino por fases

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

El PRD exige seleccionar el serving analítico por workloads, aislamiento, portabilidad, concurrencia, coste e historización. La propuesta de Sprint 0 indica un Cube mediante adaptador y Trino por fases.

**Provenance:** PRD, principios 5 y 8, secciones 12 y 18; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Adaptador de motor con Trino por fases (propuesta).** Mantiene el contrato estable y permite validar capacidades progresivamente.
2. **Acoplamiento directo a un motor único.** Reduce código inicial, pero dificulta sustitución y benchmark comparativo.
3. **Múltiples motores desde el inicio.** Puede cubrir workloads diversos, pero aumenta operación y fragmentación.

## Decisión

**Se propone encapsular el motor analítico detrás de un adaptador y evaluar/adoptar Trino por fases, condicionado a benchmark y aislamiento.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** resultado del benchmark, topología de Trino, formatos, catálogo técnico y motores alternativos.

## Metas de calidad

`[PENDIENTE]`: no se encontraron umbrales aprobados de latencia, concurrencia o coste.

## Consecuencias

**Positivas:** portabilidad, reversibilidad y validación incremental.

**Negativas y riesgos:** el adaptador puede limitar capacidades específicas; el benchmark es obligatorio antes de comprometer producción.

**Impacto en pruebas:** pruebas de contrato del adaptador, workloads representativos, aislamiento por tenant y plan de salida.

