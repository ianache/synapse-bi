---
type: ADR
id: ADR-014
title: Los motores se seleccionan por workload y aislamiento multitenant
description: Se propone seleccionar los motores fisicos mediante benchmark y criterios de aislamiento, sin fijar una marca por adelantado.
tags: [architecture, adr, bi, data-platform, benchmarking]
status: draft
adr_status: Propuesto
related: [ADR-011, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: ADRS-BI-ANALYTICS-V1.1, tema Motores
  context: PRD-BI-ANALYTICS-V1.1 sections 8, 11 and 12
  quality: PRD-BI-ANALYTICS-V1.1 sections 12 and 15; benchmark criteria exist but NFR values are pending
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-014 - Seleccion de motores por workload

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, propuesta sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** [ADR-011](/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md)

## Contexto

El PRD separa control plane, preparacion y serving. La seleccion concreta del motor no puede cerrarse sin workloads representativos y criterios de concurrencia, aislamiento, portabilidad, observabilidad y coste.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 8, 11 y 12.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro el analisis.

1. **Control plane relacional, preparacion desacoplada cuando aplique y serving SQL columnar/OLAP validado (propuesta).** Mantiene separacion logica y permite validar el serving.
2. **Un unico motor para todo.** Simplifica la topologia, pero aumenta acoplamiento y riesgo.
3. **Motor especializado por producto.** Puede optimizar cargas locales, pero fragmenta gobierno y habilidades.

## Decision

**Se propone seleccionar los motores fisicos mediante benchmark de workloads y criterios de aislamiento multitenant, preservando el contrato semantico frente al cambio de motor.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** productos concretos, proveedor cloud, formato de tabla, dimensionamiento, tier de aislamiento y objetivos de coste/rendimiento.

## Metas de calidad

`[PENDIENTE]`: hay criterios de evaluacion, pero no NFR aprobados con valores.

## Consecuencias

**Positivas:** evita decisiones por preferencia y mantiene abierta la portabilidad.

**Negativas y riesgos:** requiere invertir en benchmark, observabilidad y plan de salida.

**Impacto en pruebas:** medir dashboards, exploracion, refresh, exportacion, concurrencia, aislamiento, coste y cambio de version semantica.

**Provenance:** ADRS-BI-ANALYTICS-V1.1, tema Motores, y PRD-BI-ANALYTICS-V1.1 secciones 12 y 15.
