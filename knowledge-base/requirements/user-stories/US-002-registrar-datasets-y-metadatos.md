---
type: User Story
title: "US-002 — Registrar datasets y metadatos"
description: "Data Engineering registra datasets directos o preparados con owner, clasificación, frescura y linaje."
tags: [user-story, plataforma, datasets, data-engineering]
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

# US-002 — Registrar datasets y metadatos

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-002 |
| Épica / capacidad | Catálogo de datasets, PRD §14 FR-002 |
| Horizonte / release | Por definir; datasets del release no seleccionados |
| Actor | [Data Engineering](../../../intents/PRD.md) (RCP-001 §8) |
| Responsable de negocio (PO) | Por definir; Business Owner/Data Steward son propuesta BRC-001 no aprobada |
| Prioridad | Must propuesta: metadatos son requeridos para gobernanza; PO decide |
| Estimación |  |
| Dependencias | US-001; fuentes del primer release |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Data Engineering, **quiero** registrar datasets directos y preparados con sus metadatos de gobierno, **para** que sus consumidores conozcan ownership, clasificación, frescura y linaje.

## 3. Contexto y valor

- **Problema que resuelve:** No se puede evaluar el uso de un dataset sin conocer atributos de gobierno (PRD §14 FR-002).
- **Valor esperado:** Registro trazable de datasets directos y preparados.
- **Métrica o KPI que impacta:** Sin métrica asociada.

## 4. Alcance

- **Incluye:** registrar dataset directo/preparado y los cuatro metadatos enumerados.
- **Excluye:** seleccionar datasets del MVP; los criterios completos de publicación/ejecución no están definidos.

## 5. Criterios de aceptación

### AC-1 — Registrar dataset con metadatos

```gherkin
Escenario: Registrar los metadatos requeridos
  Dado un dataset directo o preparado
  Cuando Data Engineering lo registra
  Entonces quedan asociados owner, clasificación, frescura y linaje
```

- **Regla / fuente:** PRD §14 FR-002; para dataset Medallion, BRC-001 BR-005 declara metadatos adicionales como regla explícita.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Falta uno de los metadatos de FR-002 | Política de rechazo/publicación no definida | US-002-Q1 |
| Dataset preparado carece de metadatos específicos Medallion | BRC-001 BR-005 exige declararlos; efecto operativo pendiente | US-002-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-005 | Dataset Medallion declara owner, esquema, partición, retención, clasificación, calidad mínima, frescura, linaje y política de tenant | BRC-001 §Reglas; alcance limitado a Medallion |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Dataset | Activo registrado | [TRM-0005](../../business/glossary/terms/TRM-0005-dataset.md) |
| Dataset preparado | Dataset sujeto a preparación complementaria | [TRM-0006](../../business/glossary/terms/TRM-0006-dataset-preparado.md) |
| Linaje de datos | Relación de procedencia | [TRM-0016](../../business/glossary/terms/TRM-0016-linaje-de-datos.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** clasificación aplica, pero política por clase/tenant/jurisdicción está pendiente.
- **Otros:** Sin requisito medible de freshness o disponibilidad aprobado.

## 10. Consideraciones de UX

- **Flujo esperado:** elegir tipo de dataset → registrar metadatos → consultar ficha.
- **Estados de la interfaz:** ficha completa/incompleta; efecto de incompletitud pendiente.
- **Contenido clave:** tipo, owner, clasificación, freshness y lineage.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** US-001 y definición de owners, clasificación y política de freshness.
- **Es prerrequisito de:** US-003, US-005, US-007 y US-008.
- **Supuestos:** ningún rol de ownership organizacional se considera aprobado.
- **Hipótesis del agente:** ficha única facilita evaluar consumo; validar con negocio.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-002-Q1 | ¿Qué campos son obligatorios para todos los datasets, quién confirma owners y qué pasa si faltan metadatos? | Producto / Data Governance | Alta | Sí | Abierta |
| GQ-02 | ¿Cómo se mide frescura y qué objetivos aplican? | Owner de dominio / Data Engineering | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0004 | Dataset Medallion declara metadatos de gobierno requeridos | BRC-001 §Evidencia; PRD §10.5 | fact | high |
| EVD-2026-0011 | Fuentes, owners y NFR aún no confirmados | BRC-001 §Evidencia; RCP-001 §§2, 7 | gap | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Data Engineering / Producto (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §14 FR-002, §10.5; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8, 12.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Requiere fuentes y US-001. |
| Negociable | Parcial | Campos adicionales y completitud pendientes. |
| Valiosa | Sí | Permite evaluar procedencia y confiabilidad. |
| Estimable | Parcial | Catálogo y reglas de obligatoriedad incompletos. |
| Pequeña (Small) | Parcial | Directos y preparados pueden diferir; medir al detallar. |
| Testeable | Sí | Verificar asociación de los cuatro atributos. |

## 15. Definition of Ready

- [x] Actor y valor sostenidos por fuente
- [x] Criterio verificable y citado
- [ ] Casos negativos resueltos
- [ ] Preguntas bloqueantes cerradas
- [x] Dependencias identificadas
- [x] Términos vinculados al glosario
- [ ] PO validó

## 16. Definition of Done (funcional)

- [ ] Criterios y casos negativos pasan
- [ ] WCAG 2.2 AA revisada
- [ ] Política de privacidad/clasificación aprobada aplicada
- [ ] PO acepta
- [ ] Dataset muestra owner, clasificación, freshness y lineage

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** RCP en borrador; ownership, umbrales de freshness y respuesta ante metadatos ausentes pendientes.
- **Bloqueos de entrega:** US-001, selección de fuentes y respuesta a US-002-Q1/GQ-02.
- **Propuesta de división (si no es pequeña):** Evaluar historias separadas para registro directo y preparado tras validar diferencias funcionales.
- **Siguiente rol o Skill:** Producto/Data Governance; después af-user-story-refiner para refinar si se divide.
- **Decisión humana requerida:** validar campos, owners y política de completitud.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
