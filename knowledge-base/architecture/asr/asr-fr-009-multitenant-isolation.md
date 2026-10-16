---
type: ASR-Candidate
id: ASR-002
title: Aislamiento multitenant transversal
description: Candidato para asegurar que el límite de tenant se preserve en identidad, datos, derivados, consultas, exportaciones, IA y observabilidad.
status: draft
related: [ADR-002, ADR-006]
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
  - id: ADR-015
    resource: /knowledge-base/architecture/ADR-015-aislamiento-multitenant-por-capas.md
    title: Aislamiento multitenant por capas
---

# ASR-002 - Aislamiento multitenant transversal

## Classification

- **Requirement ID:** FR-009.
- **Tipo:** candidato ASR; no es un ASR aprobado.
- **Disposition:** `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]`.
- **Confianza:** Alta.

## Quality concern

Confidencialidad, integridad del límite de tenant, autorización consistente y ausencia de exposición cross-tenant en caminos directos e indirectos.

## Decisiones que lo atienden

- [ADR-002 - Estrategia multitenant con aislamiento lógico inicial](/knowledge-base/architecture/ADR-002-estrategia-multitenant.md)
- [ADR-006 - Autorización central con enforcement en motores](/knowledge-base/architecture/ADR-006-seguridad-de-consultas.md)

## Evidence

- E-006 del RCP-001: `tenant_id` no es suficiente.
- PRD §13.2 enumera controles obligatorios para consultas, claves, cachés, materializaciones, exportaciones, jobs, lineage, borrado, restauración y auditoría.
- R-03 y R-09 del PRD identifican impacto crítico por fuga cross-tenant y datos sensibles en capas intermedias.

## Why it may be architecture-significant

Cruza todos los bounded contexts y condiciona identidad, control plane, data plane, almacenamiento, procesamiento, cachés, archivos, IA, logging, pruebas y recuperación. Una omisión en un solo camino puede invalidar la propiedad de seguridad completa.

## Affected perspectives

Seguridad, datos, infraestructura, integración, operación, cumplimiento, recuperación y desarrollo.

## Missing evidence / questions

- ¿Qué clasificación de datos y tiers de tenant existen?
- ¿Qué tenants requieren aislamiento físico y cuáles pueden compartir recursos?
- ¿Qué pruebas negativas, auditorías y evidencias son obligatorias?
- ¿Qué residencia, retención, borrado y restauración aplica por tenant?

## Human disposition

`[PENDIENTE: arquitecto responsable y seguridad]` deben clasificar este candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`.
