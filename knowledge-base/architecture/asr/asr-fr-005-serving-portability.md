---
type: ASR-Candidate
id: ASR-004
title: Serving analítico, benchmark y portabilidad del contrato
description: Candidato para asegurar que el serving soporte los workloads reales y que el cambio de motor no rompa el contrato semántico.
status: draft
related: [ADR-005, ADR-009]
generated:
  by: agent/gpt-5
  at: 2026-10-15T00:00:00-05:00
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
    title: Requirement Context Pack - BI Analytics Platform v1.1
  - id: ADR-014
    resource: /knowledge-base/architecture/ADR-014-seleccion-de-motores-por-workload.md
    title: Seleccion de motores por workload
---

# ASR-004 - Serving analítico, benchmark y portabilidad

## Classification

- **Requirement IDs:** FR-005 y FR-011.
- **Tipo:** candidato ASR; no es un ASR aprobado.
- **Disposition:** `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]`.
- **Confianza:** Alta.

## Quality concern

Concurrencia, consultas ad hoc, frescura, observabilidad, seguridad, coste, portabilidad y reversibilidad del motor de serving.

## Decisiones que lo atienden

- [ADR-005 - Motor analítico mediante adaptador y adopción de Trino por fases](/knowledge-base/architecture/ADR-005-motor-analitico.md)
- [ADR-009 - Contratos abiertos y versionados](/knowledge-base/architecture/ADR-009-contratos.md)

## Evidence

- PRD §12 recomienda minimizar motores y seleccionar serving mediante benchmark.
- PRD §12.2 define criterios de aislamiento, SQL, concurrencia, coste, portabilidad, historización, observabilidad, seguridad y evolución.
- E-010 del RCP-001 declara que faltan NFR y workloads para cerrar la selección.
- R-04 del PRD identifica el riesgo de un motor sin soporte para concurrencia o consultas ad hoc.

## Why it may be architecture-significant

La decisión condiciona almacenamiento, materializaciones, cachés, contratos físicos, consultas, operación, presupuesto y plan de salida. Afecta todos los consumidores del modelo semántico aunque el motor no sea visible para ellos.

## Affected perspectives

Rendimiento, datos, infraestructura, coste, operación, seguridad, integración y evolución.

## Missing evidence / questions

- ¿Qué workloads, volúmenes y concurrencia representan el MVP?
- ¿Qué objetivos NFR aprobados gobiernan el benchmark?
- ¿Qué motores existen hoy y qué costes de migración tienen?
- ¿Qué funciones deben ser portables y cuál es el plan de salida?

## Human disposition

`[PENDIENTE: arquitecto responsable]` debe clasificar este candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`.
