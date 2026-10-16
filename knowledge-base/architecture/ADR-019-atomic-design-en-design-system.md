---
type: ADR
id: ADR-019
title: El Design System usa Atomic Design y una libreria reutilizable de componentes
description: Se propone establecer Atomic Design como criterio estructural del Design System y mantener una libreria reutilizable de componentes construida con Claude Design.
tags: [architecture, adr, design-system, atomic-design, ui-components]
status: draft
adr_status: Propuesto
related: [ADR-017, PRD-BI-ANALYTICS-V1.1]
generated: { by: agent/gpt-5, at: 2026-10-15T00:00:00-05:00 }
provenance:
  decision: user request in current session; pending formal architectural approval
  context: PRD-BI-ANALYTICS-V1.1 sections 2.1, 4, 8 and 17; reusable UX and component patterns are identified, but Atomic Design is not specified there
  options: agent reconstruction; no human comparison of alternatives was recorded
  quality: no approved ASR or NFR with component-library metrics was found
  scope: Claude Design is recorded as the requested design workflow/tool; its exact capabilities and integration remain open
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /knowledge-base/architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ADR-019 - Atomic Design en el Design System

- **Estado:** Propuesto
- **Fecha:** 2026-10-15
- **Decisor:** [PENDIENTE: arquitecto responsable]
- **Redaccion:** agente/gpt-5, a partir de la solicitud del usuario y del contexto del PRD. No hay decision arquitectonica formal ni `verified`.
- **ASR relacionados:** ninguno identificado
- **Depende de / Reemplaza a:** [ADR-017](/knowledge-base/architecture/ADR-017-capas-logicas-de-la-plataforma.md)

## Contexto

La plataforma evoluciona desde una PoC de dashboards hacia una plataforma multiproducto. El PRD identifica la necesidad de reutilizar patrones de UX y componentes, componer dashboards y visualizaciones reutilizables y evitar que cada producto resuelva la experiencia visual de forma aislada.

La solicitud de esta sesión añade una decisión concreta: establecer Atomic Design dentro del Design System y mantener una librería reutilizable de componentes mediante Claude Design.

**Provenance:** PRD-BI-ANALYTICS-V1.1, secciones 2.1, 4, 8 y 17; solicitud del usuario en la sesión actual. Atomic Design y Claude Design no aparecen definidos en el PRD y se registran aquí como decisión propuesta, no como hecho previo.

## Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró un análisis comparativo.

1. **Atomic Design como estructura del Design System con librería reutilizable (propuesta).** Favorece composición, consistencia, reutilización y evolución controlada de componentes.
2. **Componentes diseñados por producto o pantalla.** Puede acelerar una entrega aislada, pero aumenta duplicación, divergencia visual y coste de mantenimiento.
3. **Librería compartida sin una taxonomía explícita.** Reduce la disciplina inicial, pero dificulta descubrir, componer y gobernar el catálogo.

## Decisión

**Se propone establecer Atomic Design como criterio estructural del Design System y mantener una librería reutilizable de componentes, diseñada y documentada con Claude Design, para ser consumida por los productos de la plataforma.**

**Justificación:** [PENDIENTE]. La solicitud expresa la decisión objetivo, pero no registra todavía la justificación formal del decisor arquitectónico.

**Argumentos del agente (no son del decisor):**

- Una taxonomía común puede reducir la duplicación entre dashboards, formularios, filtros, tablas, visualizaciones y patrones de navegación.
- Una librería versionada permite corregir accesibilidad, comportamiento y consistencia en un punto compartido.
- La separación entre tokens, átomos, moléculas, organismos, templates y páginas puede facilitar la composición sin convertir cada pantalla en una implementación aislada.

**No se decidió todavía:**

- si se adoptan literalmente los niveles atoms, molecules, organisms, templates y pages o una variante adaptada;
- framework, lenguaje, empaquetado, repositorio y estrategia de distribución de la librería;
- alcance exacto de Claude Design, integración con código, exportación de tokens y flujo de revisión;
- ownership del Design System y proceso de contribución/aprobación;
- política de versionado, compatibilidad, deprecación y releases;
- criterios mínimos de accesibilidad, responsive behavior, theming, internacionalización y pruebas visuales;
- componentes y patrones incluidos en el primer release.

## Metas de calidad

`[PENDIENTE]`: no se encontraron ASR o NFR aprobados con métricas de adopción, accesibilidad, cobertura, rendimiento o compatibilidad de la librería.

## Consecuencias

**Positivas:**

- mayor consistencia visual y de interacción entre productos;
- reutilización de componentes y reducción de duplicación;
- cambios transversales más controlables mediante versionado de la librería;
- mejor trazabilidad entre diseño, componentes y experiencias consumidoras.

**Negativas y riesgos:**

- el Design System se convierte en una capacidad con ownership y gobierno propios;
- una taxonomía rígida puede bloquear necesidades específicas si no se permiten extensiones controladas;
- la librería puede convertirse en cuello de botella si el proceso de contribución es lento;
- sin criterios de compatibilidad y accesibilidad, la reutilización puede propagar defectos.

**Impacto en pruebas:**

- pruebas unitarias y de contrato de componentes;
- pruebas de accesibilidad y navegación por teclado;
- pruebas visuales y de regresión por componente y composición;
- pruebas de compatibilidad entre versiones de la librería y consumidores;
- validación de tokens, themes, responsive behavior e internacionalización;
- verificación de que dashboards y productos consumen componentes publicados, no copias locales no gobernadas.

**Provenance:** decisión solicitada por el usuario; consecuencias y estrategia de pruebas sintetizadas por el agente a partir del PRD y de la naturaleza de la decisión.
