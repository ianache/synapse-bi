---
type: ADR
id: ADR-012
title: Medallion se activa de forma opcional por dataset
description: Se propone aplicar Medallion solo a datasets con una necesidad demostrable de preparacion, historizacion o desacoplamiento.
tags: [architecture, adr, data-engineering, medallion]
status: draft
adr_status: Propuesto
related: [ADR-011, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: ADRS-BI-ANALYTICS-V1.1, tema Medallion
  context: PRD-BI-ANALYTICS-V1.1 sections 1, 6, 10 and 11
  options: agent reconstruction from PRD-BI-ANALYTICS-V1.1 section 12.3
  quality: PRD-BI-ANALYTICS-V1.1 section 15; no approved metrics
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-012 - Medallion opcional por dataset

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, propuesta sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** [ADR-011](/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md)

## Contexto

Medallion puede aportar replay, historizacion, calidad, reutilizacion y desacoplamiento, pero imponerlo a toda fuente puede generar duplicacion, coste y latencia innecesarios.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 1, 6, 10 y 11.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro el analisis.

1. **Medallion por dataset cuando se justifique (propuesta).** Activa capas cuando exista una necesidad operacional o de negocio.
2. **Medallion obligatorio.** Uniforma el procesamiento, pero sobreconstruye casos simples.
3. **Sin preparacion fisica.** Simplifica el inicio, pero no resuelve historizacion, replay o calidad compleja.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 6, 10 y 12.3.

## Decision

**Se propone activar Medallion por dataset solo cuando replay, historizacion, calidad, reutilizacion, volumen o desacoplamiento lo justifiquen.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** criterios cuantitativos, owner de aprobacion, formato de tablas, retencion y estrategia de costes.

## Metas de calidad

`[PENDIENTE]`: no hay ASR o NFR aprobado con metricas.

## Consecuencias

**Positivas:** menor duplicacion y adopcion progresiva de ingenieria fisica.

**Negativas y riesgos:** requiere criterios documentados y puede producir arquitecturas heterogeneas entre datasets.

**Impacto en pruebas:** comparar fuente directa, Gold materializado y Medallion completo en workloads representativos.

**Provenance:** ADRS-BI-ANALYTICS-V1.1, tema Medallion, y PRD-BI-ANALYTICS-V1.1 secciones 10, 11, 12 y 18.
