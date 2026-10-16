---
type: User Story
title: "US-008 — Evaluar Medallion por dataset"
description: "Data Engineering justifica activar Medallion para un dataset con criterios documentados."
tags: [user-story, plataforma, medallion, data-engineering]
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

# US-008 — Evaluar Medallion por dataset

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-008 |
| Épica / capacidad | Preparación de datos, FR-008 |
| Horizonte / release | Por definir; datasets MVP sin elegir |
| Actor | [Data Engineering](../../../intents/PRD.md) (RCP-001 §8) |
| Responsable de negocio (PO) | Owner/decisor por definir; no inferir aprobación de roles propuestos |
| Prioridad | Should propuesta: evita preparación sin valor; decide PO |
| Estimación |  |
| Dependencias | US-002; US-007 si se activa preparación |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Data Engineering, **quiero** evaluar y documentar la necesidad de Medallion para cada dataset, **para** preparar físicamente sólo los datos que lo requieren.

## 3. Contexto y valor

- **Problema que resuelve:** Medallion universal puede añadir coste, duplicación y latencia (PRD §10).
- **Valor esperado:** patrón opcional sujeto a necesidad demostrada por dataset.
- **Métrica o KPI que impacta:** coste/latencia son criterios cualitativos; valores objetivo no definidos.

## 4. Alcance

- **Incluye:** aplicar criterios documentados para decidir activación por dataset.
- **Excluye:** umbrales numéricos y aprobación del decisor, pendientes.

## 5. Criterios de aceptación

### AC-1 — Documentar necesidad de Medallion

```gherkin
Escenario: Evaluar preparación por dataset
  Dado un dataset candidato
  Cuando Data Engineering evalúa replay/historización, CDC, calidad/reconciliación, reutilización, volumen/concurrencia, desacoplamiento o auditoría/retención
  Entonces documenta la necesidad aplicable antes de activar Medallion
```

- **Regla / fuente:** PRD §§10.3–10.5; BRC-001 BR-004.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Dataset pequeño, estable y gobernado sin beneficio de preparación | No activar por simetría o copia | BRC-001 BR-004 |
| No hay umbral cuantitativo para volumen/concurrencia | Decisión no automatizable con regla disponible | US-008-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-004 | Activación sólo por necesidad documentada | BRC-001 §Reglas |
| BR-005 | Dataset Medallion declara atributos de gobierno | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Medallion | Patrón opcional de preparación | [TRM-0017](../../business/glossary/terms/TRM-0017-medallion.md) |
| Dataset preparado | Resultado de preparación | [TRM-0006](../../business/glossary/terms/TRM-0006-dataset-preparado.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** clasificación/retención/residencia de cada dataset aún requieren política aprobada.
- **Otros:** no hay umbrales de coste, latencia o volumen aprobados.

## 10. Consideraciones de UX

- **Flujo esperado:** elegir dataset → revisar criterios → documentar resultado/justificación.
- **Estados de la interfaz:** evaluación pendiente/registrada; aprobación no definida.
- **Contenido clave:** criterios aplicables y datos que sustentan la necesidad.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** metadatos del dataset y criterios PRD.
- **Es prerrequisito de:** US-007 cuando procede preparación.
- **Supuestos:** no se asume activación de Medallion para todos.
- **Hipótesis del agente:** registro de razones permite revisar duplicación y valor; validar con Data Engineering.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-008-Q1 | ¿Quién acepta la justificación y qué umbrales/mediciones demuestran volumen, concurrencia o beneficio? | Producto / Data Engineering / Arquitectura | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0003 | Medallion es opcional y responde a criterios de valor | BRC-001 §Evidencia; PRD §§1, 6, 10 | fact | high |
| EVD-2026-0013 | Aprobador del dataset no ha sido ratificado | BRC-001 §Evidencia | decision | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Data Engineering / Producto (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§10.3–10.5, 14 FR-008; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Requiere registro de dataset. |
| Negociable | Sí | Evidencia y umbrales por acordar. |
| Valiosa | Sí | Evita sobrepreparación. |
| Estimable | Parcial | Volúmenes/casos no elegidos. |
| Pequeña (Small) | Sí | Evaluación acotada por dataset si se fija plantilla. |
| Testeable | Parcial | Criterios cualitativos; regla de aceptación pendiente. |

## 15. Definition of Ready

- [x] Actor/valor y criterios tienen fuentes
- [ ] Umbrales y decisión final definidos
- [x] Caso límite de no activar trazado
- [ ] Pregunta bloqueante cerrada
- [x] Dependencias identificadas
- [x] Términos enlazados
- [ ] PO validó

## 16. Definition of Done (funcional)

- [ ] Evaluación queda trazada por dataset
- [ ] Casos de activación/no activación probados
- [ ] WCAG 2.2 AA revisada
- [ ] Política de datos aplicada
- [ ] PO/decisor acepta
- [ ] Dataset activado cuenta con metadatos de BR-005

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** proceso de evaluación existe en PRD, pero umbrales y aprobador no están acordados.
- **Bloqueos de entrega:** US-008-Q1 y datasets representativos.
- **Propuesta de división (si no es pequeña):** No aplica salvo que análisis y activación tengan actores diferentes.
- **Siguiente rol o Skill:** Producto / Data Engineering.
- **Decisión humana requerida:** aprobar criterios cuantitativos y autoridad decisora.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
