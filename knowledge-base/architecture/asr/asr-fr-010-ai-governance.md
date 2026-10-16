---
type: ASR-Candidate
id: ASR-005
title: IA gobernada, grounding y auditabilidad
description: Candidato para asegurar que la IA consulte sólo contextos autorizados y que sus respuestas sean trazables sin poder redefinir KPI.
status: draft
related: [ADR-006, ADR-007]
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
  - id: ADR-016
    resource: /knowledge-base/architecture/ADR-016-ia-sobre-modelos-autorizados.md
    title: IA sobre modelos autorizados
---

# ASR-005 - IA gobernada, grounding y auditabilidad

## Classification

- **Requirement ID:** FR-010.
- **Tipo:** candidato ASR; no es un ASR aprobado.
- **Disposition:** `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]`.
- **Confianza:** Alta.

## Quality concern

Autorización, confidencialidad, exactitud contextual, auditabilidad, lineage, control de autonomía y no modificación silenciosa de definiciones gobernadas.

## Decisiones que lo atienden

- [ADR-006 - Autorización central con enforcement en motores](/knowledge-base/architecture/ADR-006-seguridad-de-consultas.md)
- [ADR-007 - Sesiones durables y contexto aislado para agentes](/knowledge-base/architecture/ADR-007-persistencia-de-agentes.md)

## Evidence

- E-007 del RCP-001: IA sólo sobre modelos, documentos y datos autorizados.
- PRD §13.3 exige resolver identidad, tenant, producto, rol y políticas antes del grounding.
- PRD R-06 identifica respuestas plausibles pero no auditables.
- PRD §19 prohíbe que un agente publique o cambie KPI fuera del flujo de gobierno.

## Why it may be architecture-significant

La IA introduce una ruta de consumo que cruza identidad, tenancy, Semantic Governance, Analytical Serving, búsqueda/grounding, auditoría y experiencia. Una arquitectura que permita acceso directo a fuentes puede invalidar controles de seguridad y significado.

## Affected perspectives

Seguridad, datos, integración, experiencia, operación, cumplimiento y evolución.

## Missing evidence / questions

- ¿Qué nivel de autonomía se permite al agente?
- ¿Qué formatos de citas, lineage y registro de consultas son obligatorios?
- ¿Qué sesiones, prompts y respuestas se retienen y por cuánto tiempo?
- ¿Qué proveedores o modelos están autorizados?

## Human disposition

`[PENDIENTE: producto, seguridad y arquitecto responsable]` deben clasificar este candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`.
