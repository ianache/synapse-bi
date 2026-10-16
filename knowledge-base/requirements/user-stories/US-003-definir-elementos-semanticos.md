---
type: User Story
title: "US-003 — Definir elementos semánticos"
description: "Semantic Governance define entidades, dimensiones, medidas, KPI y relaciones reutilizables."
tags: [user-story, plataforma, semantica, governance]
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

# US-003 — Definir elementos semánticos

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-003 |
| Épica / capacidad | Contrato semántico, FR-003 |
| Horizonte / release | Por definir; KPI y entidades iniciales pendientes |
| Actor | [Semantic Governance](../../../intents/PRD.md) y [Owner/steward de negocio](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) |
| Responsable de negocio (PO) | Owner funcional por identificar; Domain Owner propuesto en BRC-001, no aprobado |
| Prioridad | Must propuesta: núcleo del producto; decide PO |
| Estimación |  |
| Dependencias | US-002; GQ-03 para criterios de entidad |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Semantic Governance con el owner/steward de negocio, **quiero** definir y relacionar los elementos semánticos, **para** que los consumidores compartan conceptos y KPI con significado explícito.

## 3. Contexto y valor

- **Problema que resuelve:** KPI duplicados o incompatibles entre productos (RCP-001 §9, R-001).
- **Valor esperado:** elementos semánticos documentados para uso común.
- **Métrica o KPI que impacta:** KPI definidos aquí son contenido del catálogo, no métrica de éxito disponible.

## 4. Alcance

- **Incluye:** entidades, dimensiones, medidas, KPI, jerarquías, sinónimos y relaciones.
- **Excluye:** aprobar/publicar el modelo (US-004); cálculo/consulta (US-005); ontology formal beyond estas relaciones.

## 5. Criterios de aceptación

### AC-1 — Registrar elementos del modelo

```gherkin
Escenario: Definir el vocabulario semántico
  Dado un dominio y sus datasets identificados
  Cuando Semantic Governance define sus conceptos de negocio
  Entonces puede registrar entidades, dimensiones, medidas, KPI, jerarquías, sinónimos y relaciones
```

- **Regla / fuente:** PRD §14 FR-003; PRD §11.3 para atributos de KPI.

### AC-2 — Capturar atributos requeridos de KPI

```gherkin
Escenario: Documentar un KPI
  Dado que se registra un KPI
  Cuando se completa su definición
  Entonces se documentan identificador, definición, fórmula, unidad, grano, filtros, casos límite, owner, versión/vigencia, lineage, acceso/clasificación, freshness y calidad
```

- **Regla / fuente:** PRD §11.3; BRC-001 BR-006 (regla derivada; efecto de ausencia aún pendiente).

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Definición de KPI incompleta | No se determina si se bloquea; no afirmar publicable | BRC-001 BR-006, US-003-Q1 |
| Concepto candidato a entidad sin criterio acordado | Criterio pendiente | GQ-03 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-006 | KPI gobernado debe declarar atributos mínimos del PRD; bloqueo de publicación pendiente | BRC-001 §Reglas |
| BR-007 | Grano explícito; el cambio no debe ocultarse bajo la misma definición | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Entidad de negocio | Concepto del dominio | [TRM-0008](../../business/glossary/terms/TRM-0008-entidad-de-negocio.md) |
| Dimensión | Eje de análisis | [TRM-0007](../../business/glossary/terms/TRM-0007-dimension.md) |
| KPI | Indicador con fórmula y grano | [TRM-0014](../../business/glossary/terms/TRM-0014-indicador-clave-de-desempeno-kpi.md) |
| Modelo semántico | Contrato conceptual de consumo | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** acceso y clasificación son atributos requeridos para KPI; política concreta pendiente.
- **Otros:** versionado y lineage funcional requeridos en PRD §11.3; no hay objetivos cuantificados.

## 10. Consideraciones de UX

- **Flujo esperado:** seleccionar dominio/dataset → definir elementos → documentar relaciones y atributos.
- **Estados de la interfaz:** borrador y validación posterior; estados exactos en US-004.
- **Contenido clave:** definiciones, fórmula, unidad, grano, filtros, owner, lineage, acceso y calidad/freshness.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** datasets y dominio seleccionados; ownership funcional ratificado.
- **Es prerrequisito de:** US-004 y US-005.
- **Supuestos:** RCP-001 S-001 sobre Semantic Governance permanece provisional.
- **Hipótesis del agente:** atributos completos mejoran consistencia; validar campos obligatorios y UX con owners.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| GQ-03 | ¿Qué criterios delimitan una entidad de negocio? | Semantic Governance / owner de dominio | Media | Sí | Abierta |
| US-003-Q1 | ¿Quién confirma la definición y qué campos incompletos impiden publicar KPI? | Producto / owner de dominio | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0005 | KPI publicado declara atributos de definición, ownership, versión y procedencia | BRC-001 §Evidencia; PRD §11.3 | fact | high |
| EVD-2026-0012 | Los roles de ownership no son personas/equipos confirmados | BRC-001 §Evidencia; RCP-001 §§8, 10 | fact | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Semantic Governance / negocio (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§11.3, 14 FR-003; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8, 9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Requiere dominio y datasets base. |
| Negociable | Sí | Taxonomía y atributos sujetos a validación. |
| Valiosa | Sí | Define vocabulario consistente. |
| Estimable | Parcial | Alcance inicial y cardinalidad desconocidos. |
| Pequeña (Small) | No | Incluye siete tipos; dividir por comportamiento/dominio tras priorizar MVP. |
| Testeable | Parcial | Alta variedad de objetos; faltan reglas de validación. |

## 15. Definition of Ready

- [x] Actor/valor sustentados por RCP
- [ ] Criterios de validación completos
- [ ] Negativos y política de completitud definidos
- [ ] Preguntas bloqueantes cerradas
- [ ] Dominio, owner y dependencias definidos
- [x] Términos vinculados al glosario
- [ ] PO validó

## 16. Definition of Done (funcional)

- [ ] Criterios acordados y probados
- [ ] Negativos cubiertos
- [ ] WCAG 2.2 AA revisada
- [ ] Clasificación/acceso aprobados
- [ ] PO acepta
- [ ] Cada KPI contiene atributos mínimos verificados

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** historia demasiado amplia; falta priorizar conceptos y acordar ownership/validaciones.
- **Bloqueos de entrega:** selección de dominio, GQ-03 y US-003-Q1.
- **Propuesta de división (si no es pequeña):** separar entidades/relaciones, dimensiones/medidas y KPI; decidir con Producto tras seleccionar los conceptos MVP.
- **Siguiente rol o Skill:** Producto / Semantic Governance; luego af-user-story-refiner.
- **Decisión humana requerida:** ratificar actores, dominio inicial, atributos obligatorios y priorización.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
