---
title: Knowledge Base - BI AI Analytics
status: draft
generated:
  by: agent/gpt-5
  at: 2026-10-16T01:15:43-05:00
---

# Knowledge Base

## Requirement Context Packs

- [RCP-001 - Contexto de requisitos de BI Analytics Platform v1.1](/knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md)
- [RCP-002 — Definición semántica configurable US-003](/knowledge-base/requirements/context-packs/RCP-002-us-003-definicion-semantica.md)
  - [Decisiones D01–D07](/docs/ux/us-003/decisions.md)
  - [Diseño US-003](/docs/superpowers/specs/2026-10-16-us-003-semantic-catalog-design.md)
  - [Plan y alcance del incremento](/docs/superpowers/plans/2026-10-16-us-003-semantic-catalog-plan.md)
  - [UX, evidencia y prueba manual local](/docs/ux/us-003/README.md)

## User Stories

- [US-001 — Registrar fuente y observar esquema](/knowledge-base/requirements/user-stories/US-001-registrar-fuente-y-observar-esquema.md)
- [US-002 — Registrar datasets y metadatos](/knowledge-base/requirements/user-stories/US-002-registrar-datasets-y-metadatos.md)
- [US-003 — Definir elementos semánticos](/knowledge-base/requirements/user-stories/US-003-definir-elementos-semanticos.md)
- [US-004 — Versionar y publicar modelo semántico](/knowledge-base/requirements/user-stories/US-004-versionar-y-publicar-modelo-semantico.md)
  - [Primera entrega — Modelos y borradores versionados: especificación para revisión](/docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md)
  - [Pantallas Stitch US-004 — cuatro vistas desktop y diferencias pendientes](/docs/ux/us-004/README.md)
  - [Plan de implementación primera entrega US-004 — para revisión](/docs/superpowers/plans/2026-10-17-us-004-model-versions-plan.md)
- [US-005 — Resolver consulta semántica: Q1 resuelta para laboratorio; gates productivos pendientes](/knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md)
  - [Incremento de laboratorio: verificación y prueba manual de metadatos ausentes](/docs/ux/us-005/verification.md)
- [US-006 — Componer dashboard semántico](/knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md)
- [US-007 — Ejecutar ingeniería de datos complementaria](/knowledge-base/requirements/user-stories/US-007-ejecutar-ingenieria-de-datos-complementaria.md)
- [US-008 — Evaluar Medallion por dataset](/knowledge-base/requirements/user-stories/US-008-evaluar-medallion-por-dataset.md)
- [US-009 — Aplicar aislamiento por tenant](/knowledge-base/requirements/user-stories/US-009-aplicar-aislamiento-por-tenant.md)
- [US-010 — Explorar datos con IA gobernada](/knowledge-base/requirements/user-stories/US-010-explorar-datos-con-ia-gobernada.md)
- [US-011 — Trazar cambios semánticos y físicos](/knowledge-base/requirements/user-stories/US-011-trazar-cambios-semanticos-y-fisicos.md)
- [US-012 — Navegar catálogo y glosario](/knowledge-base/requirements/user-stories/US-012-navegar-catalogo-y-glosario.md)

## Business Rules

- [BRC-001 - Catálogo de reglas de negocio de BI Analytics Platform v1.1](/knowledge-base/business/rules/BRC-001-reglas-negocio-bi-analytics-v1-1.md)
- [BRC-002 — Gobierno y publicación US-004: Q1–Q5 aprobadas para laboratorio; gates operativos pendientes](/knowledge-base/business/rules/BRC-002-gobierno-publicacion-modelo-semantico.md)

## Business Glossary

- [GLS-001 - Glosario de negocio de BI Analytics Platform v1.1](/knowledge-base/business/glossary/GLS-001-glosario-de-negocio.md)
  - [Dominio — TRM-0024, definición en borrador](/knowledge-base/business/glossary/terms/TRM-0024-dominio.md)

## Modelo de información conceptual

- [IMD-001 — Registro de datasets](/knowledge-base/business/information-model/IMD-001-registro-datasets.md)
- [IMD-002 — Catálogo semántico configurable](/knowledge-base/business/information-model/IMD-002-catalogo-semantico.md)
  - Extensión US-004: modelo de un único dominio y varios modelos por dominio, R-09 / GOV004-12.

## ASR Candidate Catalog

- [ASR Candidate Catalog - BI Analytics Platform v1.1](/knowledge-base/architecture/asr/asr-catalog.md)

## Architecture Decision Records

- [ADRs - BI Analytics Platform v1.1](/knowledge-base/architecture/ADRs.md)
- [ADR-001 a ADR-010 - decisiones Sprint 0](/knowledge-base/architecture/ADRs.md)
- [ADR-019 — Atomic Design en el Design System: decisión aceptada por human:ianache el 2026-10-18; revisión textual pendiente](/knowledge-base/architecture/ADR-019-atomic-design-en-design-system.md)

## Contratos de API

- [API-001 — Backend Python: consultas semánticas y dashboards](/knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md)
- [API-002 — Propuesta de API de datasets](/knowledge-base/design/api-contracts/API-002-dataset-registry.md)
- [API-003 — Catálogo semántico, implementación local autorizada D07](/knowledge-base/design/api-contracts/API-003-semantic-catalog.md)
- [API-004 — Modelos y borradores semánticos, propuesta REQUIRES_REVIEW](/knowledge-base/design/api-contracts/API-004-semantic-model-drafts.md)

## Seguridad y conectividad de fuentes

- [SRC-001 — Registro PostgreSQL y observaciones técnicas](/knowledge-base/design/api-security/SRC-001-postgresql-source-registry.md)

## Modelos de datos

- [DM-001 — Gold retail omnicanal de laboratorio](/knowledge-base/design/data-models/DM-001-retail-gold-study.md)
- [DM-002 — Propuesta de persistencia de datasets](/knowledge-base/design/data-models/DM-002-dataset-registry.md)
- [DM-003 — Catálogo semántico SQLite v4](/knowledge-base/design/data-models/DM-003-semantic-catalog.md)
- [DM-004 — Modelos y borradores SQLite v5, propuesta REQUIRES_REVIEW](/knowledge-base/design/data-models/DM-004-semantic-model-drafts.md)

## Fuentes principales de producto

- [PRD.md](/intents/PRD.md)
- [ADRs.md](/architecture/ADRs.md)
