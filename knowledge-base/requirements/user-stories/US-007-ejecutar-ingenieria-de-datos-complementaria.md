---
type: User Story
title: "US-007 — Ejecutar ingeniería de datos complementaria"
description: "Data Engineering ejecuta preparación complementaria con controles y trazabilidad."
tags: [user-story, plataforma, data-engineering, jobs]
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

# US-007 — Ejecutar ingeniería de datos complementaria

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-007 |
| Épica / capacidad | Data Engineering, FR-007 |
| Horizonte / release | Por definir; workloads y datasets pendientes |
| Actor | [Data Engineering](../../../intents/PRD.md) (RCP-001 §8) |
| Responsable de negocio (PO) | Producto/owner de dataset por identificar |
| Prioridad | Should propuesta: sólo datasets que necesiten preparación; PO decide |
| Estimación |  |
| Dependencias | US-002; selección de transformación y workload |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Data Engineering, **quiero** ejecutar preparación de datos con calidad, manejo de errores, reintentos y trazabilidad, **para** entregar datasets preparados cuando el consumo directo no sea suficiente.

## 3. Contexto y valor

- **Problema que resuelve:** algunos casos necesitan historización, CDC, calidad o desacoplamiento (PRD §§1, 6, 14).
- **Valor esperado:** ejecuciones y resultados técnicos rastreables.
- **Métrica o KPI que impacta:** Sin métrica operativa definida.

## 4. Alcance

- **Incluye:** ejecuciones, calidad, errores, reintentos y trazabilidad.
- **Excluye:** herramienta/orquestador, política de retry y controles cuantitativos no definidos.

## 5. Criterios de aceptación

### AC-1 — Registrar resultado de ejecución

```gherkin
Escenario: Trazar ejecución de preparación
  Dado un proceso de ingeniería de datos configurado
  Cuando Data Engineering lo ejecuta
  Entonces quedan disponibles la ejecución, su resultado de calidad, errores, reintentos y trazabilidad
```

- **Regla / fuente:** PRD §14 FR-007. El tratamiento específico de cada resultado está pendiente.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Falla de proceso o control de calidad | Registrar error/resultados; acción posterior no definida | US-007-Q1 |
| Retry agotado | Política no especificada | US-007-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-004 | Medallion sólo con necesidad documentada; no copiar datasets pequeños sin beneficio | BRC-001 §Reglas |
| BR-005 | Metadatos requeridos para dataset Medallion | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Ingeniería de datos complementaria | Preparación física condicionada | [TRM-0015](../../business/glossary/terms/TRM-0015-ingenieria-de-datos-complementaria.md) |
| Calidad de datos | Resultado de control | [TRM-0002](../../business/glossary/terms/TRM-0002-calidad-de-datos.md) |
| Linaje | Trazabilidad del procesamiento | [TRM-0016](../../business/glossary/terms/TRM-0016-linaje-de-datos.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA para superficies de usuario.
- **Privacidad y datos personales:** respetar clasificación y alcance tenant; política de retención/residencia pendiente.
- **Otros:** no hay targets de duración, disponibilidad o recuperación aprobados.

## 10. Consideraciones de UX

- **Flujo esperado:** seleccionar dataset/proceso → ejecutar → revisar calidad/errores/reintentos/traza.
- **Estados de la interfaz:** ejecución, éxito/error; semántica adicional pendiente.
- **Contenido clave:** resultado, calidad, errores, reintentos y lineage.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** dataset seleccionado y justificación de preparación.
- **Es prerrequisito de:** US-008 cuando se activa Medallion; US-005 para serving de dataset preparado.
- **Supuestos:** no asumir herramienta u orquestación específica.
- **Hipótesis del agente:** registro común por ejecución soporta soporte operativo; validar campos mínimos.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-007-Q1 | ¿Qué controles de calidad, política de reintentos/agotamiento, owner y límites operativos se requieren? | Data Engineering / owner de dataset | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0003 | Preparación complementa semántica cuando ésta no basta | BRC-001 §Evidencia; PRD §§1, 4 | fact | high |
| EVD-2026-0004 | Metadatos de dataset preparado/Medallion | BRC-001 §Evidencia; PRD §10.5 | fact | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Data Engineering (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§6, 10, 14 FR-007; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Depende de un dataset/proceso. |
| Negociable | Sí | Estrategia y controles no fijados. |
| Valiosa | Sí | Soporta casos que requieren preparación. |
| Estimable | Parcial | Operación/volumen no definido. |
| Pequeña (Small) | No | Calidad, retry, errores y trazabilidad son comportamientos separables. |
| Testeable | Parcial | Salidas enumeradas; acciones tras falla pendientes. |

## 15. Definition of Ready

- [x] Actor y valor respaldados
- [ ] Resultado de error y retry acordado
- [ ] Negativos resueltos
- [ ] Pregunta bloqueante cerrada
- [x] Dependencia identificada
- [x] Términos enlazados
- [ ] PO valida

## 16. Definition of Done (funcional)

- [ ] Ejecuciones y resultados de calidad/error/retry/traza verificables
- [ ] Fallos y límites probados según política aprobada
- [ ] WCAG 2.2 AA revisada
- [ ] Privacidad/residencia aplicadas
- [ ] PO acepta

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** alcance agrupa varios comportamientos y faltan controles, retry y workload.
- **Bloqueos de entrega:** selección de caso/dataset y US-007-Q1.
- **Propuesta de división (si no es pequeña):** separar ejecución/calidad de políticas de reintentos y linaje, según proceso MVP.
- **Siguiente rol o Skill:** Data Engineering / Producto.
- **Decisión humana requerida:** priorizar caso de uso y acordar reacción ante fallas.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
