---
type: User Story
title: "US-011 — Trazar cambios semánticos y físicos"
description: "Semantic Governance registra cambios y distingue evolución de definición semántica y cambio físico."
tags: [user-story, plataforma, versionado, lineage]
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

# US-011 — Trazar cambios semánticos y físicos

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-011 |
| Épica / capacidad | Gobierno de cambios y lineage, FR-011 |
| Horizonte / release | Por definir |
| Actor | [Semantic Governance](../../../intents/PRD.md) y Data Engineering (RCP-001 §8) |
| Responsable de negocio (PO) | Producto / owners por identificar |
| Prioridad | Must propuesta: mantiene trazabilidad de cambio; decide PO |
| Estimación |  |
| Dependencias | US-002, US-003, US-004; consumidores a analizar |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Semantic Governance, **quiero** registrar cambios y distinguir cambios semánticos de físicos, **para** evaluar su efecto sobre definiciones y consumidores.

## 3. Contexto y valor

- **Problema que resuelve:** cambiar una definición o almacenamiento puede afectar consumidores de manera distinta (RCP-001 §§8, 9).
- **Valor esperado:** historial de cambios y distinción semántico/físico.
- **Métrica o KPI que impacta:** Sin métrica asociada.

## 4. Alcance

- **Incluye:** registrar cambio y clasificarlo como semántico/físico.
- **Excluye:** compatibilidad, notificación, versionado obligatorio y migración, cuyas reglas del BRC son propuestas pendientes.

## 5. Criterios de aceptación

### AC-1 — Registrar y distinguir cambio

```gherkin
Escenario: Registrar cambio de activo
  Dado un modelo o dataset existente
  Cuando un responsable registra una modificación
  Entonces el cambio queda registrado y se distingue si es semántico o físico
```

- **Regla / fuente:** PRD §14 FR-011; cambios de modelo auditables en BRC-001 BR-016.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Cambio altera fórmula, grano, unidad o contrato | Nueva versión está propuesta, no aprobada | BRC-001 BR-015; US-011-Q1 |
| Tipo de cambio ambiguo | Criterio de clasificación no definido | US-011-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-016 | Cambios de modelo deben ser auditables | BRC-001 §Reglas |
| BR-015 | Versionado/compatibilidad para cambios incompatibles es propuesta pendiente | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Linaje de datos | Contexto de procedencia del cambio | [TRM-0016](../../business/glossary/terms/TRM-0016-linaje-de-datos.md) |
| Modelo semántico | Activo sujeto a evolución | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** no revelar historial fuera de la autorización del tenant (PRD §13.2).
- **Otros:** auditoría exigida; formato/campos y retención no definidos.

## 10. Consideraciones de UX

- **Flujo esperado:** iniciar cambio → describir alcance → clasificar semántico/físico → consultar historial.
- **Estados de la interfaz:** registro e historial; aprobación/notificación pendientes.
- **Contenido clave:** activo, tipo de cambio y descripción; campos mínimos por acordar.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** activos registrados y responsables identificados.
- **Es prerrequisito de:** evolución segura del modelo; consumidores se mapean cuando el proceso se defina.
- **Supuestos:** ninguno sobre formato de versionado.
- **Hipótesis del agente:** clasificar cambios facilita análisis de impacto; confirmar con governance.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-011-Q1 | ¿Qué campos, taxonomía, cambios incompatibles, versiones, aviso a consumidores y evidencia de migración se requieren? | Semantic Governance / owners de dominio | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0009 | Cambio de modelo y acceso requieren trazabilidad/auditoría | BRC-001 §Evidencia; PRD §13.2 | fact | high |
| EVD-2026-0013 | Ventanas, versiones y notificación fueron propuestas aún no ratificadas | BRC-001 §Evidencia | decision | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Semantic Governance / Producto (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§11, 14 FR-011; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Requiere activos existentes. |
| Negociable | Sí | Taxonomía/campos negociables. |
| Valiosa | Sí | Facilita impacto y trazabilidad. |
| Estimable | Parcial | Workflow no definido. |
| Pequeña (Small) | Sí | Registro y clasificación pueden probarse aislados; compatibilidad fuera de alcance. |
| Testeable | Parcial | AC observable, clasificación pendiente. |

## 15. Definition of Ready

- [x] Actor y valor con fuente
- [ ] Taxonomía y campos definidos
- [ ] Negativos resueltos
- [ ] Pregunta bloqueante cerrada
- [x] Dependencias identificadas
- [x] Términos enlazados
- [ ] PO valida

## 16. Definition of Done (funcional)

- [ ] Cambios registrados y clasificados
- [ ] Historial tenant-scoped/auditable probado
- [ ] WCAG 2.2 AA revisada
- [ ] Privacidad aplicada
- [ ] PO acepta
- [ ] Cambios incompatibles siguen política aprobada cuando exista

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** requisito general claro; definición de cambio, fields y compatibilidad no están resueltos.
- **Bloqueos de entrega:** US-011-Q1; activos y owners iniciales.
- **Propuesta de división (si no es pequeña):** versionado/compatibilidad y análisis de impacto pueden ser historias separadas.
- **Siguiente rol o Skill:** Semantic Governance / Producto.
- **Decisión humana requerida:** aprobar taxonomía, versionado y política de compatibilidad.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
