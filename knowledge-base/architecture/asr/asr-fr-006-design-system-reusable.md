---
type: ASR-Candidate
id: ASR-006
title: Design System reutilizable basado en Atomic Design
description: Candidato para asegurar una librería compartida de componentes, patrones y tokens para las experiencias multiproducto.
status: draft
generated:
  by: agent/gpt-5
  at: 2026-10-15T00:00:00-05:00
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADR-019
    resource: /knowledge-base/architecture/ADR-019-atomic-design-en-design-system.md
    title: Atomic Design en el Design System
  - id: ADR-017
    resource: /knowledge-base/architecture/ADR-017-capas-logicas-de-la-plataforma.md
    title: Capas logicas de la plataforma
---

# ASR-006 - Design System reutilizable basado en Atomic Design

## Classification

- **Requirement ID:** FR-006, más decisión propuesta en ADR-019.
- **Tipo:** candidato ASR; no es un ASR aprobado.
- **Disposition:** `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]`.
- **Confianza:** Media; Atomic Design fue solicitado por el usuario pero no está definido en el PRD.

## Quality concern

Consistencia visual y de interacción, accesibilidad, compatibilidad entre productos, reutilización, versionado, gobernanza de contribuciones y velocidad de evolución del Design System.

## Evidence

- PRD §2.1 y CHG-01 describen la evolución desde una PoC y la reutilización de UX/componentes.
- PRD FR-006 exige componer dashboards y visualizaciones mediante consultas reutilizables, en un contexto multiproducto.
- ADR-019 propone Atomic Design, librería reutilizable y Claude Design, pero deja abiertos framework, ownership, versionado, accesibilidad y primer release.

## Why it may be architecture-significant

Una librería compartida se convierte en una dependencia transversal de productos y experiencias. Sus contratos, versionado, accesibilidad y distribución pueden afectar la capacidad de entregar funcionalidades, la compatibilidad y la operación de todo el portfolio.

## Affected perspectives

Experiencia, frontend, integración, evolución, accesibilidad, operación de librería y gobierno de producto.

## Missing evidence / questions

- ¿Se confirma Atomic Design como estándar obligatorio o guía?
- ¿Cuál es la taxonomía y qué queda fuera de la librería?
- ¿Qué framework, repositorio, empaquetado y estrategia de releases se usarán?
- ¿Quién aprueba contribuciones y breaking changes?
- ¿Qué métricas de accesibilidad, adopción, cobertura y compatibilidad se exigirán?
- ¿Cómo se integra Claude Design con tokens, documentación y código?

## Human disposition

`[PENDIENTE: producto, UX, frontend y arquitecto responsable]` deben clasificar este candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`.
