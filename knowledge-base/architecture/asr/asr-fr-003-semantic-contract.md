---
type: ASR-Candidate
id: ASR-001
title: Contrato semántico gobernado y versionado
description: Candidato para asegurar que el significado de negocio, KPI, lineage y publicación formen un contrato común para los consumidores.
status: draft
related: [ADR-003, ADR-009]
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
  - id: ADR-011
    resource: /knowledge-base/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md
    title: BI semantica con ingenieria de datos complementaria
---

# ASR-001 - Contrato semántico gobernado y versionado

## Classification

- **Requirement IDs:** FR-003, FR-004, FR-005, FR-011 y FR-012.
- **Tipo:** candidato ASR; no es todavía un ASR aprobado.
- **Disposition:** `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]`.
- **Confianza:** Alta.

## Quality concern

Consistencia del significado de negocio, versionado compatible, trazabilidad de fuente a consumidor, publicación controlada y disponibilidad de metadatos de calidad/freshness.

## Decisiones que lo atienden

- [ADR-003 - Semantic Registry propio como fuente maestra semántica](/knowledge-base/architecture/ADR-003-fuente-maestra-semantica.md)
- [ADR-009 - Contratos abiertos y versionados](/knowledge-base/architecture/ADR-009-contratos.md)

## Evidence

- E-001 y E-005 del RCP-001: la capa semántica es el contrato principal y debe servir a varios consumidores.
- E-009 del RCP-001: se propone un ciclo de vida de modelos `draft`, `review`, `published`, `deprecated` y `retired`.
- PRD §11.3 exige en KPI fórmula, grano, owner, versión, lineage, estado, freshness y calidad.
- PRD §19 exige consistencia de un KPI publicado y cambio de fórmula versionado.

## Why it may be architecture-significant

Define el contrato transversal entre Semantic Governance, Analytical Serving, Visualization & Experience, APIs y AI Analytics. Cambiarlo puede afectar todos los productos, modelos físicos, permisos, lineage, cachés y consumidores.

## Affected perspectives

Información, funcional, integración, seguridad, datos, operación, evolución y experiencia de usuario.

## Missing evidence / questions

- ¿Quién es el owner y aprobador de una definición de KPI?
- ¿Qué compatibilidad se exige entre versiones y consumidores existentes?
- ¿Qué dominios y KPI representan el MVP?
- ¿Qué evidencia de freshness, calidad y lineage debe ser obligatoria para publicar?

## Human disposition

`[PENDIENTE: arquitecto responsable]` debe clasificar este candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`. No se aprueba ni se diseña una solución en este documento.
