---
type: ADR
id: ADR-006
title: Autorización central con enforcement en motores
description: Se propone centralizar la decisión de autorización y reforzarla en cada motor o componente que ejecute consultas.
tags: [architecture, adr, security, authorization, queries]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-002, ADR-016]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 2, 6 and 7, risks R-03 and R-06; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved security objectives were not found
  consequences: agent synthesis from access governance and bounded context rules
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-006 - Autorización central con enforcement en motores

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

Las consultas deben respetar tenant, roles, políticas de fila/columna, clasificación y reglas de acceso. La autorización no puede depender sólo de la UI ni de un único filtro aplicado por un consumidor.

**Provenance:** PRD, principios 2, 6 y 7, riesgos R-03 y R-06; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Autorización central y enforcement en motores (propuesta).** Unifica la decisión y evita que un runtime olvide aplicar la política.
2. **Autorización sólo en API gateway.** Simplifica el perímetro, pero no protege accesos internos o consultas directas.
3. **Autorización independiente por motor.** Puede aprovechar capacidades nativas, pero fragmenta políticas y auditoría.

## Decisión

**Se propone centralizar la decisión de autorización y exigir enforcement en cada motor, caché, exportación y componente de consulta.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** PDP/PEP concretos, lenguaje de políticas, propagación de contexto y modelo de auditoría.

## Metas de calidad

`[PENDIENTE]`: no se encontraron métricas aprobadas de seguridad.

## Consecuencias

**Positivas:** políticas consistentes, defensa en profundidad y trazabilidad.

**Negativas y riesgos:** dependencia operativa del servicio de autorización y complejidad de propagación de contexto.

**Impacto en pruebas:** casos negativos por tenant, rol, fila, columna, exportación, caché y consulta generada por IA.

