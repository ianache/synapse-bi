---
type: User Story
title: "US-012 — Navegar catálogo y glosario"
description: "Consumidores consultan catálogo navegable y glosario con ownership y estado de publicación."
tags: [user-story, plataforma, catalogo, glossary]
status: draft
generated:
  by: "af-user-story-refiner/2.0"
  at: "2026-10-16T01:22:23-05:00"
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
---

# US-012 — Navegar catálogo y glosario

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-012 |
| Épica / capacidad | Catálogo semántico, FR-012 |
| Horizonte / release | Por definir; contenido del catálogo MVP pendiente |
| Actor | Consumidor autorizado / Semantic Governance (RCP-001 §§8, 12) |
| Responsable de negocio (PO) | Producto por definir; owners propuestos en BRC-001, pendientes de ratificación |
| Prioridad | Must propuesta: descubre activos y términos; decide PO |
| Estimación |  |
| Dependencias | US-002, US-003, US-004; ownership ratificado |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** consumidor autorizado, **quiero** navegar un catálogo de activos y un glosario que muestren ownership y estado de publicación, **para** encontrar definiciones adecuadas para mi análisis.

## 3. Contexto y valor

- **Problema que resuelve:** significado, ownership y estado necesitan ser descubribles (PRD §§4, 11, 14).
- **Valor esperado:** selección de conceptos gobernados con contexto.
- **Métrica o KPI que impacta:** Sin métrica de descubrimiento definida.

## 4. Alcance

- **Incluye:** navegación del catálogo/glosario y presentación de ownership/estado.
- **Excluye:** permisos exactos, búsqueda/filtros, contenido global/tenant y propietarios ratificados pendientes.

## 5. Criterios de aceptación

### AC-1 — Consultar catálogo y glosario

```gherkin
Escenario: Navegar activos y términos
  Dado un usuario autorizado
  Cuando navega el catálogo y el glosario
  Entonces puede consultar activos y definiciones con ownership y estado de publicación disponibles
```

- **Regla / fuente:** PRD §14 FR-012; campos de ownership/estado como alcance explícito del requisito.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Owner o estado no asignado | Presentación/ocultamiento no definido | US-012-Q1 |
| Catálogo contiene metadatos de otro tenant | No revelar elementos no autorizados; regla general BRC-001 BR-012 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-016 | Catálogo y linaje se muestran conforme a autorización | BRC-001 §Reglas |
| BR-017 | Roles de ownership/steward son propuesta humana pendiente | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Catálogo semántico | Colección navegable de activos | [TRM-0003](../../business/glossary/terms/TRM-0003-catalogo-semantico.md) |
| Publicación de modelo semántico | Estado de disponibilidad | [TRM-0022](../../business/glossary/terms/TRM-0022-publicacion-de-modelo-semantico.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** catálogo/lineage tenant-scoped según PRD §13.2; política detallada pendiente.
- **Otros:** Sin requisitos de rendimiento/búsqueda definidos.

## 10. Consideraciones de UX

- **Flujo esperado:** navegar activos → abrir definición/glosario → revisar owner y estado.
- **Estados de la interfaz:** vacío, sin permiso y owner no asignado no están especificados.
- **Contenido clave:** término, definición, ownership, estado de publicación y acceso autorizado.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** registros de activos y asignación de owners/estado.
- **Es prerrequisito de:** descubrimiento y consumo informado; no hay dependencia downstream identificada.
- **Supuestos:** catálogo muestra sólo lo autorizado; no implica acceso a datos.
- **Hipótesis del agente:** filtros por dominio/estado podrían ayudar, sin ser criterio requerido hasta validar.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-012-Q1 | ¿Qué roles ven metadatos por tenant/global, cómo se muestran owner ausente y borradores, y qué campos son navegables? | Producto / Semantic Governance / Tenant Governance | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0008 | Alcance tenant y autorización son límites de acceso | BRC-001 §Evidencia; PRD §§5, 13 | fact | high |
| EVD-2026-0012 | Owners/stewards están definidos como roles, no personas confirmadas | BRC-001 §Evidencia; RCP-001 §§8, 10 | fact | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Semantic Governance (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§4, 11, 14 FR-012; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8, 12.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Depende de catálogo/glosario poblados. |
| Negociable | Sí | Navegación y filtros abiertos. |
| Valiosa | Sí | Ayuda a descubrir activos semánticos confiables. |
| Estimable | Parcial | Visibilidad tenant/global no decidida. |
| Pequeña (Small) | Parcial | Catálogo y glosario podrían dividirse según workflows. |
| Testeable | Parcial | Mostrar campos sí; reglas de visibilidad pendientes. |

## 15. Definition of Ready

- [x] Actor/valor y campos provienen de fuente
- [ ] Visibilidad y permisos definidos
- [ ] Casos negativos resueltos
- [ ] Pregunta bloqueante cerrada
- [x] Dependencias identificadas
- [x] Términos enlazados
- [ ] PO valida

## 16. Definition of Done (funcional)

- [ ] Activos y glosario navegables con ownership/estado disponibles
- [ ] Permisos y límites tenant probados
- [ ] WCAG 2.2 AA revisada
- [ ] Privacidad aplicada
- [ ] PO acepta

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** ownership, visibilidad, catálogo del release y campos no asignados.
- **Bloqueos de entrega:** US-012-Q1, US-002–US-004.
- **Propuesta de división (si no es pequeña):** separar catálogo y glosario si los usuarios/workflows difieren.
- **Siguiente rol o Skill:** Producto / Semantic Governance.
- **Decisión humana requerida:** validar roles, metadatos visibles y alcance tenant/global.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
