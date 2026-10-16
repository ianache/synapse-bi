---
type: ADR
id: ADR-009
title: Contratos abiertos y versionados
description: Se propone usar OpenAPI, JSON Schema y eventos versionados como contratos de integración.
tags: [architecture, adr, contracts, openapi, json-schema, events]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-003, ADR-005]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 4 and 5, bounded contexts and integration rules; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved compatibility targets were not found
  consequences: agent synthesis from open-by-contract and portable semantic requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-009 - Contratos abiertos y versionados

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

La plataforma integra bounded contexts, experiencias, serving, control plane y agentes IA. Los contratos deben sobrevivir a cambios de motor y evitar dependencias implícitas entre consumidores.

**Provenance:** PRD, principios 4 y 5, bounded contexts y reglas de integración; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **OpenAPI, JSON Schema y eventos versionados (propuesta).** Hace explícitos payloads, compatibilidad y evolución.
2. **Contratos informales en código.** Reduce documentación inicial, pero permite divergencia y acoplamiento.
3. **Contrato propietario del motor.** Puede optimizar un proveedor, pero reduce portabilidad.

## Decisión

**Se propone formalizar APIs con OpenAPI, payloads con JSON Schema y eventos con esquemas y versionado compatibles.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** reglas de compatibilidad, registro de esquemas, transporte de eventos, política de deprecación y ownership.

## Metas de calidad

`[PENDIENTE]`: no se encontraron objetivos aprobados de compatibilidad.

## Consecuencias

**Positivas:** interoperabilidad, pruebas de contrato y evolución explícita.

**Negativas y riesgos:** coste de mantener esquemas y gates de compatibilidad.

**Impacto en pruebas:** contract testing, validación de esquemas, compatibilidad hacia atrás y rechazo de payloads inválidos.

