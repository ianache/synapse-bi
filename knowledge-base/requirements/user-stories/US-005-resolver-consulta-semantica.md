---
type: User Story
title: "US-005 — Resolver consulta semántica"
description: "Analytical Serving resuelve consultas semánticas y presenta metadatos de confianza."
tags: [user-story, plataforma, serving, semantic]
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

# US-005 — Resolver consulta semántica

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-005 |
| Épica / capacidad | Serving semántico, FR-005 |
| Horizonte / release | Por definir; workloads no seleccionados |
| Actor | [Analytical Serving](../../../intents/PRD.md) y consumidores autorizados (RCP-001 §8) |
| Responsable de negocio (PO) | Producto por definir |
| Prioridad | Must propuesta; es la capacidad de consumo central; decide PO |
| Estimación |  |
| Dependencias | US-002, US-003, US-004; autorización multitenant |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** consumidor autorizado, **quiero** consultar un modelo semántico y recibir sus metadatos de frescura, calidad y linaje, **para** interpretar el resultado con contexto.

## 3. Contexto y valor

- **Problema que resuelve:** resultados sin origen/calidad/freshness pueden ser inconsistentes o no confiables (RCP-001 §§3, 9).
- **Valor esperado:** consulta semántica trazable con metadatos visibles.
- **Métrica o KPI que impacta:** los KPI gobernados son consultables; indicador de éxito no definido.

## 4. Alcance

- **Incluye:** resolver consulta desde modelo semántico; devolver frescura, calidad y lineage.
- **Excluye:** motor, SLA, límites ad hoc y política de bloquear resultados; están pendientes.

## 5. Criterios de aceptación

### AC-1 — Devolver metadatos de consulta

```gherkin
Escenario: Consultar definición semántica
  Dado un modelo semántico publicado y una consulta permitida
  Cuando el consumidor solicita la consulta
  Entonces el resultado incluye metadatos de frescura, calidad y linaje
```

- **Regla / fuente:** PRD §14 FR-005; BRC-001 BR-009 requiere metadatos pero sus umbrales/respuestas por clase siguen propuestos.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Calidad/frescura insuficiente | No establecer bloqueo o advertencia hasta aprobar política | US-005-Q1 |
| Falta linaje | Comportamiento no definido | US-005-Q1 |
| Tenant/permiso no resuelto | No permitir acceso cross-tenant; error concreto pendiente | BRC-001 BR-012; US-005-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-009 | Devolver metadatos de frescura, calidad y lineage; clasificación/umbrales propuestos pendientes | BRC-001 §Reglas |
| BR-012 | Impedir exposición de datos de otro tenant | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Modelo semántico | Contrato de consulta | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |
| Frescura de datos | Metadato de actualidad | [TRM-0009](../../business/glossary/terms/TRM-0009-frescura-de-datos.md) |
| Calidad de datos | Contexto de confiabilidad | [TRM-0002](../../business/glossary/terms/TRM-0002-calidad-de-datos.md) |
| Linaje | Procedencia del resultado | [TRM-0016](../../business/glossary/terms/TRM-0016-linaje-de-datos.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** políticas de acceso/clasificación pendientes; no añadir datos personales a resultados sin política.
- **Otros:** rendimiento y concurrencia no cuantificados; no prometer latencia.

## 10. Consideraciones de UX

- **Flujo esperado:** elegir modelo/KPI → consultar → inspeccionar resultado y metadatos.
- **Estados de la interfaz:** resultado; sin dato/error/obsoleto requieren política.
- **Contenido clave:** frescura, calidad, lineage y versión del modelo.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** modelo publicado, dataset y autorización resuelta.
- **Es prerrequisito de:** US-006 y US-010.
- **Supuestos:** ninguno sobre motor o formato de consulta.
- **Hipótesis del agente:** metadatos junto al resultado ayudan a decidir uso; validar con consumidores.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-005-Q1 | ¿Qué controles/umbrales bloquean, advierten o permiten consumo, y cuál es la semántica de error para metadatos ausentes y permisos no resueltos? | Producto / Seguridad / Data Governance | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0007 | Consulta expone frescura, calidad y lineage | BRC-001 §Evidencia; PRD FR-005 | fact | high |
| EVD-2026-0011 | Workloads y objetivos no están aprobados | BRC-001 §Evidencia; PRD §15 | gap | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Analytical Serving / Producto (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§5, 14 FR-005; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | No | Requiere modelos, datasets y políticas. |
| Negociable | Parcial | Contrato de consulta y tolerancias pendientes. |
| Valiosa | Sí | Entrega análisis consistente y explicable. |
| Estimable | Parcial | Workloads/NFR no acordados. |
| Pequeña (Small) | Parcial | Acotar por primer workload/modelo. |
| Testeable | Parcial | Metadatos sí; manejo de calidad pendiente. |

## 15. Definition of Ready

- [x] Actor/valor respaldados
- [x] Fuente de criterio citada
- [ ] Respuestas ante datos incompletos definidas
- [ ] Preguntas bloqueantes cerradas
- [x] Dependencias identificadas
- [x] Términos vinculados
- [ ] PO validó

## 16. Definition of Done (funcional)

- [ ] Resultado incluye metadatos acordados
- [ ] Negativos y permisos probados
- [ ] WCAG 2.2 AA revisada
- [ ] Política de privacidad/access aplicada
- [ ] PO acepta
- [ ] Workload y umbrales de servicio aprobados y probados

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** comportamiento con calidad/freshness insuficiente, NFR y permisos aún sin aprobación.
- **Bloqueos de entrega:** US-002–US-004, decisión de autorización y US-005-Q1.
- **Propuesta de división (si no es pequeña):** separar consulta base y política de confiabilidad al acordar workloads.
- **Siguiente rol o Skill:** Producto / Seguridad / Data Governance.
- **Decisión humana requerida:** acordar freshness, calidad, error, autorización y workload inicial.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
