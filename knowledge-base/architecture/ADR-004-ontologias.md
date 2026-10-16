---
type: ADR
id: ADR-004
title: Modelo conceptual de ontologías independiente del motor
description: Se propone mantener el modelo conceptual de ontologías independiente de cualquier motor de serving o persistencia.
tags: [architecture, adr, ontology, semantic-model]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-003, ADR-013]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 sections 8.1, 9, 12 and 18; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved NFR targets were not found
  consequences: agent synthesis from portable semantic and conceptual model principles
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-004 - Modelo conceptual de ontologías independiente del motor

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

El PRD distingue conceptos de negocio, relaciones, sinónimos y reglas de acceso de la implementación física. Las ontologías y cubos completos quedan fuera del primer alcance, pero el modelo conceptual debe poder evolucionar.

**Provenance:** PRD, secciones 8.1, 9, 12 y 18; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Modelo conceptual independiente del motor (propuesta).** Permite mapear el significado a distintos servings.
2. **Ontología definida dentro del motor analítico.** Simplifica un primer despliegue, pero acopla semántica y serving.
3. **Ontología completa desde v1.** Aumenta riesgo antes de validar el núcleo semántico.

## Decisión

**Se propone mantener un modelo conceptual de ontologías independiente del motor, con mapeos explícitos hacia modelos semánticos y serving.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** lenguaje de modelado, nivel de formalidad ontológica, herramienta, alcance del MVP y proceso de versionado.

## Metas de calidad

`[PENDIENTE]`: no se encontraron objetivos aprobados.

## Consecuencias

**Positivas:** portabilidad, evolución incremental y separación entre significado y ejecución.

**Negativas y riesgos:** habrá que mantener mapeos y resolver ambigüedades entre modelo conceptual y físico.

**Impacto en pruebas:** validar consistencia de conceptos, relaciones, sinónimos y mapeos a modelos publicados.

