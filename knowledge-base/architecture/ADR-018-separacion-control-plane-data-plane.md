---
type: ADR
id: ADR-018
title: Control plane y data plane se mantienen separados logicamente
description: Se propone separar logicamente metadatos, gobierno y publicacion de los datos, procesamiento y artefactos derivados.
tags: [architecture, adr, bi, control-plane, data-plane]
status: draft
adr_status: Propuesto
related: [ADR-011, ADR-015, ADR-017, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: PRD-BI-ANALYTICS-V1.1 section 8.2
  context: PRD-BI-ANALYTICS-V1.1 sections 5, 8 and 13
  options: not recorded by a human; alternatives are agent reconstruction
  quality: no approved ASR or NFR with metrics was found
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
---

# ADR-018 - Separacion de control plane y data plane

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, a partir de la seccion 8.2 del PRD, sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** -

## Contexto

El PRD distingue un control plane con tenants, usuarios, roles, catalogo, modelos, politicas, lineage, publicacion y auditoria, y un data plane con datos, datasets, tablas, consultas, agregaciones, caches y archivos derivados.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 5, 8.2 y 13.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro alternativas.

1. **Separacion logica de control plane y data plane (propuesta).** Permite gobernar cambios semanticos sin exigir recomputacion fisica en todos los casos.
2. **Plano unico para metadatos y datos.** Reduce fronteras iniciales, pero mezcla ciclos de cambio, permisos y escalado.
3. **Separacion fisica obligatoria desde el primer release.** Refuerza aislamiento, pero puede imponer complejidad antes de validar los workloads.

## Decision

**Se propone mantener separados logicamente el control plane y el data plane, sin imponer una separacion fisica universal hasta contar con evidencia de riesgo o workload.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** servicios y almacenes concretos, fronteras fisicas, modelo de claves, despliegue por tenant y topologia de auditoria.

## Metas de calidad

`[PENDIENTE]`: no se encontro un ASR o NFR aprobado con metricas.

## Consecuencias

**Positivas:** una publicacion de metadatos puede evolucionar de forma independiente de una recomputacion fisica; facilita aplicar gobierno y tenancy de forma transversal.

**Negativas y riesgos:** exige contratos claros entre planos y puede generar sincronizacion de versiones, invalidacion de caches y coordinacion operativa.

**Impacto en pruebas:** verificar consistencia entre version semantica, datos servidos, politicas, caches, lineage y auditoria.

**Provenance:** PRD-BI-ANALYTICS-V1.1 seccion 8.2; consecuencias sintetizadas por el agente.
