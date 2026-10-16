---
type: ADR
id: ADR-016
title: La IA consulta solo modelos y datos autorizados
description: Se propone limitar la exploracion IA a modelos, documentos y datos autorizados y mantener el gobierno de KPI fuera del agente.
tags: [architecture, adr, ai, governance, security]
status: draft
adr_status: Propuesto
related: [ADR-011, ADR-015, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: ADRS-BI-ANALYTICS-V1.1, tema IA
  context: PRD-BI-ANALYTICS-V1.1 sections 5, 9, 13 and 14
  quality: PRD-BI-ANALYTICS-V1.1 sections 7, 13 and 15; no approved AI SLOs
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-016 - IA sobre modelos autorizados

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, propuesta sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** [ADR-011](/architecture/ADR-011-bi-semantica-ingenieria-datos-complementaria.md), [ADR-015](/architecture/ADR-015-aislamiento-multitenant-por-capas.md)

## Contexto

La IA puede explicar y explorar, pero el acceso directo a cualquier fuente puede romper seguridad, definiciones de negocio y trazabilidad. El grounding debe resolverse despues de identidad, tenant, producto, rol y politicas.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 5, 9, 13 y 14.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro el analisis.

1. **IA sobre modelos, documentos y datos autorizados (propuesta).** Preserva gobierno, aislamiento y lineage.
2. **IA con acceso directo a fuentes.** Amplia la cobertura, pero dificulta autorizacion, consistencia y auditoria.
3. **IA sin datos empresariales.** Reduce riesgo, pero limita la utilidad analitica.

## Decision

**Se propone que la IA consulte solo modelos, documentos y datos autorizados y no redefina ni publique KPI fuera del flujo de gobierno.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** proveedores de modelos, politica de prompts, retencion de sesiones, nivel de autonomia, formato de citas y protocolo de aprobacion humana.

## Metas de calidad

`[PENDIENTE]`: no hay ASR o NFR aprobado con metricas de IA.

## Consecuencias

**Positivas:** respuestas mas auditables, consistentes con KPI publicados y alineadas con tenancy.

**Negativas y riesgos:** reduce la cobertura de consultas y exige resolver autorizacion antes del grounding.

**Impacto en pruebas:** probar fuga cross-tenant, citas de lineage, consultas fuera del modelo, cambios de KPI y publicaciones no autorizadas.

**Provenance:** ADRS-BI-ANALYTICS-V1.1, tema IA, y PRD-BI-ANALYTICS-V1.1 secciones 7, 13, 14 y 19.
