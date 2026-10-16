---
type: ADR
id: ADR-001
title: Arquitectura modular con Core y servicios de ejecución e IA
description: Se propone una arquitectura modular con un Core común y servicios especializados de ejecución e inteligencia artificial.
tags: [architecture, adr, services, modularity]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1, ADR-017, ADR-018]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 sections 5, 8, 9 and 18; user-provided Sprint 0 ADR table
  options: agent reconstruction from the proposal; alternatives were not recorded by the decider
  decision: proposal from the user-provided Sprint 0 table, pending human approval
  justification: no human justification recorded
  quality: approved NFR targets were not found
  consequences: agent synthesis from bounded contexts and control/data plane separation
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /knowledge-base/architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1
---

# ADR-001 - Arquitectura modular con Core y servicios de ejecución e IA

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redacción:** agente/gpt-5, propuesta; no hay `verified`.
- **ASR relacionados:** ninguno identificado de forma directa
- **Depende de / Reemplaza a:** -

## Contexto

La plataforma debe soportar catálogo, gobierno semántico, serving analítico, experiencias y capacidades de IA sin mezclar sus contratos. El PRD separa bounded contexts y distingue control plane de data plane.

**Provenance:** PRD, secciones 5, 8, 9 y 18; tabla de ADRs de Sprint 0 proporcionada por el usuario.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis de alternativas.

1. **Core modular más servicios de ejecución e IA (propuesta).** Centraliza contratos y gobierno, manteniendo especializados los runtimes.
2. **Monolito funcional único.** Simplifica el arranque, pero mezcla ciclos de cambio y límites de seguridad.
3. **Microservicios desde el inicio.** Aísla despliegues, pero añade coste operativo antes de validar workloads.

## Decisión

**Se propone adoptar un Core modular y servicios especializados de ejecución e IA, con contratos explícitos entre módulos.**

**Justificación:** [PENDIENTE]. El decisor no la registró.

**Argumentos del agente (no son del decisor):** la propuesta conserva modularidad sin imponer una distribución física prematura.

**Provenance:** PRD, secciones 5, 8.1, 8.2 y 9.

**No se decidió todavía:** límites exactos de despliegue, protocolos, ownership, topología de runtime y estrategia de escalado.

## Metas de calidad

`[PENDIENTE]`: no se encontraron NFR aprobados con métricas.

## Consecuencias

**Positivas:** contratos y gobierno comunes, evolución independiente de ejecución e IA y menor acoplamiento entre experiencias y motores.

**Negativas y riesgos:** el Core puede convertirse en cuello de botella; deben evitarse dependencias cíclicas y APIs internas no gobernadas.

**Impacto en pruebas:** validar contratos entre módulos, aislamiento de fallos y autorización en cada servicio que lea o materialice datos.

