---
type: User Story
title: "US-004 — Versionar y publicar modelo semántico"
description: "Semantic Governance gestiona versiones y estados declarados del modelo semántico."
tags: [user-story, plataforma, semantica, lifecycle]
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

# US-004 — Versionar y publicar modelo semántico

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-004 |
| Épica / capacidad | Gobierno semántico, FR-004 |
| Horizonte / release | Por definir |
| Actor | [Semantic Governance](../../../intents/PRD.md) (RCP-001 §8) |
| Responsable de negocio (PO) | Owner funcional por definir; aprobadores propuestos en BRC-001 no ratificados |
| Prioridad | Must propuesta: gobierna disponibilidad del contrato; decide PO |
| Estimación |  |
| Dependencias | US-003; aprobación de estados y workflow |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Semantic Governance, **quiero** versionar y gestionar el ciclo de vida de modelos semánticos, **para** distinguir definiciones en preparación de las disponibles para consumo.

## 3. Contexto y valor

- **Problema que resuelve:** consumidores necesitan identificar estado y versión del modelo (PRD FR-004).
- **Valor esperado:** estado de publicación visible y cambios rastreables.
- **Métrica o KPI que impacta:** Sin métrica asociada.

## 4. Alcance

- **Incluye:** estados `draft`, `review`, `published`, `deprecated`, `retired` y versionado.
- **Excluye:** reglas de transición, gates, ventanas y rollback aún por validar; no asumir BR-008 aprobado.

## 5. Criterios de aceptación

### AC-1 — Identificar estados del modelo

```gherkin
Escenario: Consultar el estado del modelo
  Dado un modelo semántico registrado
  Cuando el actor consulta su ciclo de vida
  Entonces el modelo puede identificarse con los estados draft, review, published, deprecated o retired
```

- **Regla / fuente:** PRD §14 FR-004. La transición entre estados requiere validación (BRC-001 BR-008).

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Cambiar modelo `published` | No se define transición ni inmutabilidad aprobada | US-004-Q1 |
| Intentar consulta a estado distinto de published | No se define acceso en PRD | US-004-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-008 | Transiciones e inmutabilidad son propuesta humana; estados base explícitos | BRC-001 §Reglas |
| BR-016 | Cambios de modelo deben ser auditables | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Modelo semántico | Activo gobernado con estado/versión | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |
| Publicación de modelo semántico | Disponibilidad del modelo según ciclo de vida | [TRM-0022](../../business/glossary/terms/TRM-0022-publicacion-de-modelo-semantico.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** aplicabilidad pendiente de clasificación del modelo.
- **Otros:** auditoría de cambios requerida en PRD §13.2/§14 y BRC-001 BR-016; retención no definida.

## 10. Consideraciones de UX

- **Flujo esperado:** consultar estado/versión → iniciar revisión/transición cuando reglas se definan.
- **Estados de la interfaz:** cinco etiquetas base del PRD; controles/transiciones pendientes.
- **Contenido clave:** estado, versión y cambios; conjunto exacto pendiente.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** US-003 y decisión de workflow.
- **Es prerrequisito de:** US-005, US-006 y US-010.
- **Supuestos:** ninguno; propuesta de BRC no se asume aprobada.
- **Hipótesis del agente:** mostrar estado y versión junto al modelo evita consumo accidental; validar.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-004-Q1 | ¿Cuáles son transiciones, aprobadores, gates, permisos de consulta, política de cambio publicado y ventana de compatibilidad? | Producto / Semantic Governance | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0006 | PRD enumera cinco estados de ciclo de vida | BRC-001 §Evidencia; PRD FR-004 | fact | high |
| EVD-2026-0013 | Detalle de transiciones y gates fue propuesto por usuario, no aprobado | BRC-001 §Evidencia | decision | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Semantic Governance (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) FR-004; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§7, 10.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | No | Requiere definiciones semánticas. |
| Negociable | Sí | Workflow íntegro pendiente. |
| Valiosa | Sí | Hace visible disponibilidad y estado. |
| Estimable | No | Permisos, transiciones y auditoría por precisar. |
| Pequeña (Small) | Parcial | Versionado, lifecycle y publicación pueden ser historias distintas. |
| Testeable | Parcial | Sólo estados base son verificables. |

## 15. Definition of Ready

- [x] Actor/valor y estados con fuente
- [ ] Transiciones y criterios verificables
- [ ] Casos negativos resueltos
- [ ] Pregunta bloqueante cerrada
- [x] Dependencia identificada
- [x] Términos enlazados
- [ ] PO validó

## 16. Definition of Done (funcional)

- [ ] Criterios y transiciones aprobados probados
- [ ] Casos negativos cubiertos
- [ ] WCAG 2.2 AA revisada
- [ ] Clasificación y privacidad aprobadas
- [ ] PO acepta
- [ ] Cambios auditables según política aprobada

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** únicamente los estados están establecidos en PRD; transiciones y reglas BRC están pendientes.
- **Bloqueos de entrega:** US-003 y respuesta a US-004-Q1.
- **Propuesta de división (si no es pequeña):** separar versionado, revisión/publicación y deprecación/retiro si workflow lo confirma.
- **Siguiente rol o Skill:** Producto / Semantic Governance.
- **Decisión humana requerida:** validar workflow y aprobadores.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
