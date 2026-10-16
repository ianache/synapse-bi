---
type: ADR
id: ADR-002
title: Estrategia multitenant con aislamiento lógico inicial
description: Se propone un modelo híbrido de tenancy con aislamiento lógico inicial y evolución por tier o riesgo.
tags: [architecture, adr, multitenancy, security]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-006, ADR-015]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 principles 5 and 6, risks R-03 and R-04; user-provided Sprint 0 ADR table
  options: agent reconstruction; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved isolation and compliance targets were not found
  consequences: agent synthesis from tenant boundary and layered isolation requirements
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
---

# ADR-002 - Estrategia multitenant con aislamiento lógico inicial

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** [ASR-009 - aislamiento multitenant por capas]
- **Depende de / Reemplaza a:** -

## Contexto

El tenant es un límite de seguridad y no sólo un filtro de interfaz. El aislamiento debe cubrir metadatos, cachés, exportaciones, logs, claves, jobs y datos derivados.

**Provenance:** PRD, principios 5 y 6, riesgos R-03 y R-04; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis.

1. **Modelo híbrido con aislamiento lógico inicial (propuesta).** Permite comenzar con separación lógica y reservar aislamiento físico para tiers o riesgos que lo requieran.
2. **Aislamiento físico por tenant desde el inicio.** Maximiza separación, pero incrementa coste y complejidad operativa.
3. **Aislamiento sólo por `tenant_id`.** Reduce esfuerzo inicial, pero no protege cachés, exports, jobs ni metadatos.

## Decisión

**Se propone adoptar un modelo híbrido con aislamiento lógico inicial y aislamiento físico por tier, riesgo o requisito cuando corresponda.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**No se decidió todavía:** clasificación de tiers, criterios de promoción a aislamiento físico, residencia, claves dedicadas y estrategia de migración entre tiers.

## Metas de calidad

`[PENDIENTE]`: no se encontraron objetivos aprobados de fuga, disponibilidad o rendimiento.

## Consecuencias

**Positivas:** entrada gradual, menor coste inicial y posibilidad de reforzar aislamiento donde la evidencia lo exija.

**Negativas y riesgos:** un error de enforcement puede producir fuga entre tenants; las políticas deben aplicarse de forma transversal.

**Impacto en pruebas:** pruebas negativas de fila, columna, caché, exportación, logs, jobs y acceso a modelos por tenant.

