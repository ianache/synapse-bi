---
title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
status: draft
date: 2026-10-15
timezone: America/Lima
---

# Resumen de decisiones

Este archivo funciona como indice. Cada decision arquitectonica tiene su propio ADR independiente.

## Decisiones y ADRs

| Tema | ADR independiente | Estado |
|---|---|---|
| Arquitectura de servicios | [ADR-001 - Arquitectura modular con Core y servicios de ejecución e IA](/knowledge-base/architecture/ADR-001-arquitectura-de-servicios.md) | Propuesto |
| Estrategia multitenant | [ADR-002 - Estrategia multitenant con aislamiento lógico inicial](/knowledge-base/architecture/ADR-002-estrategia-multitenant.md) | Propuesto |
| Fuente maestra semántica | [ADR-003 - Semantic Registry propio como fuente maestra semántica](/knowledge-base/architecture/ADR-003-fuente-maestra-semantica.md) | Propuesto |
| Ontologías | [ADR-004 - Modelo conceptual de ontologías independiente del motor](/knowledge-base/architecture/ADR-004-ontologias.md) | Propuesto |
| Motor analítico | [ADR-005 - Motor analítico mediante adaptador y adopción de Trino por fases](/knowledge-base/architecture/ADR-005-motor-analitico.md) | Propuesto |
| Seguridad de consultas | [ADR-006 - Autorización central con enforcement en motores](/knowledge-base/architecture/ADR-006-seguridad-de-consultas.md) | Propuesto |
| Persistencia de agentes | [ADR-007 - Sesiones durables y contexto aislado para agentes](/knowledge-base/architecture/ADR-007-persistencia-de-agentes.md) | Propuesto |
| Gobierno de activos | [ADR-008 - Versiones inmutables y publicación controlada de activos](/knowledge-base/architecture/ADR-008-gobierno-de-activos.md) | Propuesto |
| Contratos | [ADR-009 - Contratos abiertos y versionados](/knowledge-base/architecture/ADR-009-contratos.md) | Propuesto |
| Estrategia de migración | [ADR-010 - Migración incremental sin reescritura](/knowledge-base/architecture/ADR-010-estrategia-de-migracion.md) | Propuesto |
| Centro de gravedad semantico | [ADR-011 - BI semantica con ingenieria de datos complementaria](/knowledge-base/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md) | Propuesto |
| Medallion | [ADR-012 - Medallion opcional por dataset](/knowledge-base/architecture/ADR-012-medallion-opcional-por-dataset.md) | Propuesto |
| Modelos dimensionales | [ADR-013 - Modelos dimensionales para serving](/knowledge-base/architecture/ADR-013-modelos-dimensionales-para-serving.md) | Propuesto |
| Motores | [ADR-014 - Seleccion de motores por workload](/knowledge-base/architecture/ADR-014-seleccion-de-motores-por-workload.md) | Propuesto |
| Multitenancy | [ADR-015 - Aislamiento multitenant por capas](/knowledge-base/architecture/ADR-015-aislamiento-multitenant-por-capas.md) | Propuesto |
| IA | [ADR-016 - IA sobre modelos autorizados](/knowledge-base/architecture/ADR-016-ia-sobre-modelos-autorizados.md) | Propuesto |
| Capas logicas | [ADR-017 - Capas logicas de la plataforma](/knowledge-base/architecture/ADR-017-capas-logicas-de-la-plataforma.md) | Propuesto |
| Control plane y data plane | [ADR-018 - Separacion de control plane y data plane](/knowledge-base/architecture/ADR-018-separacion-control-plane-data-plane.md) | Propuesto |
| Design System y Atomic Design | [ADR-019 - Atomic Design en el Design System](/knowledge-base/architecture/ADR-019-atomic-design-en-design-system.md) | Propuesto |

## Decisiones extraidas

- Medallion deja de ser una obligacion universal y se activa por dataset.
- El KPI vive en un modelo semantico versionado, no en el dashboard.
- Los modelos dimensionales sirven para analisis y no sustituyen catalogo, glosario ni politicas.
- Los motores se seleccionan por workloads, benchmark y aislamiento multitenant.
- `tenant_id` no es el unico mecanismo de aislamiento.
- La IA consulta modelos, documentos y datos autorizados y no redefine KPI silenciosamente.
- El Design System se propone con Atomic Design y una librería reutilizable de componentes.

## Estado comun

Todos los ADRs estan en `status: draft` y `adr_status: Propuesto`. No se encontro una decision humana aprobatoria, por lo que no se ha incluido `decision` ni `verified`.

## Pendientes transversales

- nombrar arquitecto responsable y owners de dominio;
- aportar workloads representativos y NFR para el benchmark;
- elegir estrategia de aislamiento por tenant y clasificacion de datos;
- definir el MVP semantico, sus KPI y el nivel de autonomia de IA;
- acordar residencia, retencion, borrado y recuperacion.

## Provenance

Las decisiones ADR-011 a ADR-016 se extrajeron del resumen y se contrastaron con [PRD.md](/intents/PRD.md). ADR-017 y ADR-018 se extrajeron de las secciones 8.1 y 8.2 del PRD actual. ADR-019 incorpora la solicitud del usuario sobre Atomic Design y documenta explícitamente que el PRD no definía previamente esa decisión. Cada ADR individual conserva su propio campo `provenance` y sus fuentes abiertas.
