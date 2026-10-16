---
type: ADR
id: ADR-003
title: Semantic Registry propio como fuente maestra semántica
description: Se propone un Semantic Registry propio como autoridad para definiciones, versiones, owners y lineage semántico.
tags: [architecture, adr, semantic-governance, registry]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-011]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 1, 2 and 7, bounded context Semantic Governance; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved NFR targets were not found
  consequences: agent synthesis from semantic contract and publication requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
  - id: ASR-FR-003
    resource: /knowledge-base/architecture/asr/asr-fr-003-semantic-contract.md
    title: Semantic contract
---

# ADR-003 - Semantic Registry propio como fuente maestra semántica

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** [ASR-FR-003 - contrato semántico]
- **Depende de / Reemplaza a:** -

## Contexto

El significado de negocio no debe vivir en dashboards, tablas físicas ni prompts. Semantic Governance posee entidades, dimensiones, medidas, KPI, relaciones, owners, versiones y lineage lógico.

**Provenance:** PRD, principios 1, 2 y 7, bounded context Semantic Governance; ASR-FR-003.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Semantic Registry propio (propuesta).** Controla el contrato, publicación y evolución semántica.
2. **Catálogo de un proveedor como fuente maestra.** Reduce construcción inicial, pero acopla el contrato de negocio a una herramienta.
3. **Dashboards o tablas como fuente maestra.** Es rápido para una PoC, pero duplica definiciones y debilita lineage.

## Decisión

**Se propone que un Semantic Registry propio sea la fuente maestra de definiciones, versiones, owners, publicación y lineage semántico.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** tecnología de persistencia, modelo exacto de publicación, compatibilidad entre versiones y ownership operativo.

## Metas de calidad

`[PENDIENTE]`: no se encontraron métricas NFR aprobadas.

## Consecuencias

**Positivas:** contrato portable, trazabilidad y reutilización entre dashboards, APIs, exportaciones y agentes IA.

**Negativas y riesgos:** requiere gobierno, versionado y migraciones de definiciones.

**Impacto en pruebas:** validar que los consumidores usan versiones publicadas y que una definición no puede cambiar silenciosamente.

