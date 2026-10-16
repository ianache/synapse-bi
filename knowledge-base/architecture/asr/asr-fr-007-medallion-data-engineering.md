---
type: ASR-Candidate
id: ASR-003
title: Ingeniería de datos y Medallion selectivo
description: Candidato para decidir cuándo la preparación física, historización, replay y conformación de datasets deben formar parte de la arquitectura.
status: draft
related: [ADR-001, ADR-005]
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
  - id: ADR-012
    resource: /knowledge-base/architecture/ADR-012-medallion-opcional-por-dataset.md
    title: Medallion opcional por dataset
---

# ASR-003 - Ingeniería de datos y Medallion selectivo

## Classification

- **Requirement IDs:** FR-007 y FR-008.
- **Tipo:** candidato ASR; no es un ASR aprobado.
- **Disposition:** `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]`.
- **Confianza:** Alta.

## Quality concern

Replay, historización, calidad, reconciliación, deduplicación, desacoplamiento de fuentes, coste operativo y consistencia entre datasets preparados y modelos semánticos.

## Decisiones que lo atienden

- [ADR-001 - Arquitectura modular con Core y servicios de ejecución e IA](/knowledge-base/architecture/ADR-001-arquitectura-de-servicios.md)
- [ADR-005 - Motor analítico mediante adaptador y adopción de Trino por fases](/knowledge-base/architecture/ADR-005-motor-analitico.md)

## Evidence

- E-003 y E-004 del RCP-001: ingeniería complementaria y Medallion opcional.
- PRD §§10.3–10.5 define cuándo usar o no usar Bronze/Silver/Gold y qué metadatos debe declarar cada dataset.
- PRD R-02 identifica el riesgo de sobreconstruir Medallion.

## Why it may be architecture-significant

Puede determinar persistencia, formatos, jobs, checkpoints, particionamiento, lineage, recuperación, costes, ownership y el desacoplamiento entre fuentes y serving. También define qué camino sigue un dataset directo frente a uno preparado.

## Affected perspectives

Datos, operación, infraestructura, coste, calidad, recuperación, seguridad y evolución.

## Missing evidence / questions

- ¿Qué fuentes requieren CDC, replay, historización o reconciliación?
- ¿Qué criterios cuantitativos activan Medallion?
- ¿Quién aprueba la creación de un dataset Bronze/Silver/Gold?
- ¿Qué volumen, retención y presupuesto justifican una materialización?

## Human disposition

`[PENDIENTE: arquitecto responsable y Data Engineering]` deben clasificar este candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`.
