---
type: ADR
id: ADR-011
title: La capa semantica gobernada es el contrato principal de consumo
description: Se propone que la capa semantica gobernada sea el contrato principal de consumo de la plataforma BI.
tags: [architecture, adr, bi, semantic-governance]
status: draft
adr_status: Propuesto
related: [PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  context: PRD-BI-ANALYTICS-V1.1 sections 1, 3, 4 and 5
  options: agent reconstruction from ADRS-BI-ANALYTICS-V1.1, Decisions and status
  decision: agent proposal recorded in PRD-BI-ANALYTICS-V1.1 section 16
  justification: pending human decision; no human justification recorded
  quality: PRD-BI-ANALYTICS-V1.1 section 15; approved NFR values are missing
  consequences: agent synthesis from PRD-BI-ANALYTICS-V1.1 sections 4, 5, 19 and 20
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-011 - BI semantica con ingenieria de datos complementaria

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, propuesta sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** -

## Contexto

La plataforma debe evolucionar desde una PoC de dashboards hacia una capacidad empresarial multiproducto y multitenant con catalogo semantico, modelos semanticos, KPI, dashboards y agentes IA. El PRD establece que la capa semantica gobernada debe ser el contrato principal de consumo para evitar que el significado de una metrica viva en cada dashboard o consumidor.

**Provenance:** PRD-BI-ANALYTICS-V1.1, secciones 1, 3, 4 y 5.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro el analisis.

1. **Capa semantica gobernada como contrato (propuesta).** Reutiliza definiciones entre dashboards, APIs, exportaciones y agentes IA.
2. **Dashboards como fuente de verdad.** Reduce el tiempo inicial, pero duplica metricas y debilita la trazabilidad.
3. **Tablas fisicas como contrato principal.** Puede optimizar un workload, pero acopla consumidores con la implementacion fisica.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 3 y 4, y ADRS-BI-ANALYTICS-V1.1, tabla Decisiones y estado.

## Decision

**Se propone que BI Analytics Platform v1.1 use una capa semantica gobernada como contrato principal de consumo para dashboards, APIs, exportaciones y agentes IA.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**Argumentos del agente (no son del decisor):**

- Un contrato comun reduce la duplicacion de KPI y facilita el lineage entre fuente, metrica y consumidor.
- Separar el contrato semantico de la implementacion fisica permite cambiar el serving sin cambiar el significado publicado.

**Provenance:** propuesta normalizada desde PRD-BI-ANALYTICS-V1.1 seccion 16 y ADRS-BI-ANALYTICS-V1.1.

**No se decidio todavia:** dominios iniciales, owners, protocolo de aprobacion y versionado de KPI, SLO y autonomia de agentes IA.

## Metas de calidad

`[PENDIENTE]`: no se encontro un ASR o NFR aprobado con metricas.

**Provenance:** PRD-BI-ANALYTICS-V1.1 seccion 15.

## Consecuencias

**Positivas:** consumidores distintos comparten definiciones y lineage.

**Negativas y riesgos:** Semantic Governance necesita ownership, versionado y un proceso real de publicacion.

**Impacto en pruebas:** verificar que dashboard, API y agente IA autorizado reciben la misma definicion y lineage.

**Provenance:** sintesis del agente basada en PRD-BI-ANALYTICS-V1.1 secciones 4, 5, 19 y 20.
