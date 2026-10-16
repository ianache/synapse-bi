---
type: ADR
id: ADR-010
title: Migración incremental sin reescritura
description: Se propone evolucionar desde la PoC mediante migración incremental, contratos de compatibilidad y coexistencia controlada.
tags: [architecture, adr, migration, evolution]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-001, ADR-009]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 sections 3, 5, 17 and 18, and change CHG-01; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved migration targets and cutover windows were not found
  consequences: agent synthesis from reversibility and phased roadmap requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-010 - Migración incremental sin reescritura

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

La PoC demuestra experiencia, pero no necesariamente seguridad, gobierno, escalabilidad ni contratos de producción. El roadmap prioriza validación, contratos, núcleo semántico y aislamiento antes de ampliar capacidades.

**Provenance:** PRD, secciones 3, 5, 17 y 18, y CHG-01; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Evolución incremental sin reescritura (propuesta).** Reduce riesgo y permite validar contratos por etapas.
2. **Reescritura completa de la PoC.** Puede limpiar deuda, pero retrasa aprendizaje y aumenta riesgo de alcance.
3. **Mantener la PoC como plataforma productiva.** Acelera una salida aparente, pero hereda límites no validados.

## Decisión

**Se propone migrar incrementalmente mediante coexistencia controlada, contratos versionados, adaptadores y cortes reversibles, sin una reescritura total.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** fases exactas, criterios de salida, estrategia de datos, ventana de cutover, compatibilidad de UX y retiro de la PoC.

## Metas de calidad

`[PENDIENTE]`: no se encontraron objetivos aprobados de migración, disponibilidad o cutover.

## Consecuencias

**Positivas:** aprendizaje temprano, reversibilidad y reducción de riesgo de big bang.

**Negativas y riesgos:** coexistencia temporal, duplicación de operación y necesidad de reconciliación.

**Impacto en pruebas:** contract tests, dual-read o dual-write cuando aplique, reconciliación, rollback y pruebas de compatibilidad.

