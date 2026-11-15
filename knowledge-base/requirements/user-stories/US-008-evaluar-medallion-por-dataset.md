---
type: User Story
title: "US-008 — Evaluar Medallion por dataset"
description: "Data Engineering justifica activar Medallion para un dataset con criterios documentados."
tags: [user-story, plataforma, medallion, data-engineering]
status: draft
generated:
  by: "af-user-story-refiner/2.0"
  at: "2026-11-04T00:00:00-05:00"
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
| Responsable de negocio (PO) | Data Engineering acepta la evaluación, por decisión del usuario del 2026-11-04; persona responsable por asignar |
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

- **Incluye:** aplicar criterios cualitativos documentados por dataset; registrar mediciones cuantitativas cuando estén disponibles y definir umbrales gradualmente con evidencia operativa.
- **Excluye:** umbrales cuantitativos universales fijados sin evidencia; aprobación externa a Data Engineering.

## 5. Criterios de aceptación

### AC-1 — Documentar necesidad de Medallion

```gherkin
Escenario: Evaluar preparación por dataset
  Dado un dataset candidato
  Cuando Data Engineering evalúa replay/historización, CDC, calidad/reconciliación, reutilización, volumen/concurrencia, desacoplamiento o auditoría/retención
  Entonces documenta los criterios aplicables, la evidencia disponible y la decisión de Data Engineering antes de activar o descartar Medallion
```

- **Regla / fuente:** PRD §§10.3–10.5; BRC-001 BR-004.

### AC-2 — Evolucionar criterios cuantitativos con evidencia

```gherkin
Escenario: Definir umbrales a partir de datos operativos
  Dado que existen mediciones operativas representativas para un criterio de activación
  Cuando Data Engineering revisa la evaluación del dataset
  Entonces documenta los umbrales cuantitativos sustentados por esas mediciones, o registra que aún no hay evidencia suficiente
```

- **Regla / fuente:** decisión del usuario del 2026-11-04; los valores no se presuponen ni se inventan.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Dataset pequeño, estable y gobernado sin beneficio de preparación | No activar por simetría o copia | BRC-001 BR-004 |
| No hay datos operativos representativos para definir un umbral | Aplicar evaluación cualitativa y registrar la brecha; no bloquear por ausencia de un valor numérico inventado | Decisión del usuario del 2026-11-04 |

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
- **Decisión humana (2026-11-04):** Data Engineering acepta la evaluación. Aplicar enfoque híbrido: criterios cualitativos desde el inicio y umbrales cuantitativos progresivos cuando exista evidencia operativa suficiente.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-008-Q1 | ¿Qué mediciones y umbrales cuantitativos demuestran volumen, concurrencia o beneficio cuando haya evidencia operativa? | Data Engineering | Media | No para el primer alcance cualitativo; sí para automatizar o normalizar umbrales | Parcial: aceptación asignada a Data Engineering; enfoque híbrido acordado; valores pendientes de evidencia |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0003 | Medallion es opcional y responde a criterios de valor | BRC-001 §Evidencia; PRD §§1, 6, 10 | fact | high |
| EVD-2026-0013 | Aprobador y criterios cuantitativos estaban pendientes antes de la decisión de alcance | BRC-001 §Evidencia | decision | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Data Engineering / Producto (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§10.3–10.5, 14 FR-008; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Requiere registro de dataset. |
| Negociable | Sí | Los umbrales evolucionan con la evidencia operativa. |
| Valiosa | Sí | Evita sobrepreparación. |
| Estimable | Parcial | Requiere elegir datasets representativos para el primer uso. |
| Pequeña (Small) | Sí | Evaluación acotada por dataset si se fija plantilla. |
| Testeable | Sí | Se verifica el registro de criterios, evidencia y aceptación; los umbrales se verifican cuando se definan con datos. |

## 15. Definition of Ready

- [x] Actor/valor y criterios tienen fuentes
- [x] Responsable de aceptación y enfoque híbrido definidos
- [x] Caso límite de no activar trazado
- [x] Pregunta bloqueante cerrada para el primer alcance cualitativo
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
- **Motivo:** aceptación asignada a Data Engineering y enfoque híbrido acordado; la selección de datasets representativos y la disponibilidad de datos operativos para umbrales posteriores siguen pendientes.
- **Bloqueos de entrega:** elegir dataset(s) representativo(s); los umbrales numéricos no bloquean la evaluación cualitativa inicial.
- **Propuesta de división (si no es pequeña):** No aplica salvo que análisis y activación tengan actores diferentes.
- **Siguiente rol o Skill:** Producto / Data Engineering.
- **Decisión humana requerida:** seleccionar dataset(s) representativo(s); Data Engineering definirá umbrales cuando disponga de evidencia operativa suficiente.
- **Validación:** Decisiones de aceptación y enfoque híbrido confirmadas por el usuario el 2026-11-04; validación del conjunto de la historia pendiente.
