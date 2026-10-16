---
type: ADR
id: ADR-017
title: La plataforma se organiza en capas logicas desde fuentes hasta experiencias
description: Se propone organizar la plataforma en capas logicas de entrada, preparacion, gobierno, semantica, serving y experiencias.
tags: [architecture, adr, bi, logical-architecture]
status: draft
adr_status: Propuesto
related: [ADR-011, ADR-012, ADR-013, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: PRD-BI-ANALYTICS-V1.1 section 8.1
  context: PRD-BI-ANALYTICS-V1.1 sections 3, 5 and 8
  options: not recorded by a human; alternatives are agent reconstruction
  quality: no approved ASR or NFR with metrics was found
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
---

# ADR-017 - Capas logicas de la plataforma

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, a partir de la seccion 8.1 del PRD, sin decision humana. No hay `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** -

## Contexto

El PRD describe una plataforma que debe conectar fuentes, preparar datos cuando sea necesario, gobernar catalogo y significado, resolver serving analitico y atender dashboards, APIs, exportaciones y agentes IA.

**Provenance:** PRD-BI-ANALYTICS-V1.1 secciones 3, 5 y 8.1.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstruccion del agente; el decisor no registro alternativas.

1. **Capas logicas desde fuentes hasta experiencias (propuesta).** Hace explicitos los contratos y responsabilidades de cada tramo.
2. **Arquitectura centrada solo en dashboards.** Simplifica la PoC, pero no cubre APIs, exportaciones, gobierno ni IA como consumidores del modelo.
3. **Arquitectura organizada solo por motores fisicos.** Puede reflejar despliegue, pero mezcla responsabilidades y acopla el contrato de negocio a la tecnologia.

## Decision

**Se propone organizar BI Analytics Platform en capas logicas de fuentes y contratos, ingesta y preparacion, catalogo y gobierno, modelo semantico, serving analitico y experiencias.**

**Justificacion:** [PENDIENTE]. El decisor no la registro.

**No se decidio todavia:** limites de despliegue, numero de servicios, tecnologias concretas y ownership operativo de cada capa.

## Metas de calidad

`[PENDIENTE]`: no se encontro un ASR o NFR aprobado con metricas.

## Consecuencias

**Positivas:** permite separar contratos, ownership y evolucion de la semantica respecto de la implementacion fisica.

**Negativas y riesgos:** puede crear fronteras artificiales si se convierte directamente cada capa en un servicio independiente.

**Impacto en pruebas:** verificar contratos entre capas, lineage extremo a extremo y que los consumidores usen el serving autorizado.

**Provenance:** PRD-BI-ANALYTICS-V1.1 seccion 8.1; consecuencias sintetizadas por el agente.
