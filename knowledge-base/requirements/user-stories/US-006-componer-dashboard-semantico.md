---
type: User Story
title: "US-006 — Componer dashboard semántico"
description: "Visualization & Experience crea dashboards y visualizaciones consumiendo consultas semánticas reutilizables."
tags: [user-story, plataforma, visualization, dashboard]
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

# US-006 — Componer dashboard semántico

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-006 |
| Épica / capacidad | Visualization & Experience, FR-006 |
| Horizonte / release | Por definir; dashboards del release pendientes |
| Actor | [Visualization & Experience](../../../intents/PRD.md) (RCP-001 §8) |
| Responsable de negocio (PO) | Producto por definir |
| Prioridad | Should propuesta: canal prioritario, pero alcance MVP no ratificado |
| Estimación |  |
| Dependencias | US-004 y US-005; componentes de diseño no especificados en este RCP |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Visualization & Experience, **quiero** componer dashboards y visualizaciones con consultas semánticas reutilizables, **para** presentar análisis consistente a los consumidores.

## 3. Contexto y valor

- **Problema que resuelve:** definiciones de métrica locales pueden divergir (PRD §§1, 4).
- **Valor esperado:** reutilización de consultas semánticas entre visualizaciones.
- **Métrica o KPI que impacta:** KPI semánticos mostrados; métrica de producto no definida.

## 4. Alcance

- **Incluye:** dashboard/visualización basado en consulta semántica reutilizable.
- **Excluye:** exportación (se propone historia separada o incorporar tras decisión de release); acceso directo a tablas físicas no autorizado según BRC-001 BR-010.

## 5. Criterios de aceptación

### AC-1 — Usar consulta semántica reutilizable

```gherkin
Escenario: Crear visualización desde contrato semántico
  Dado un modelo semántico y una consulta autorizada
  Cuando Visualization & Experience compone un dashboard
  Entonces la visualización utiliza la consulta semántica reutilizable
```

- **Regla / fuente:** PRD §14 FR-006; BRC-001 BR-010.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| No existe consulta semántica autorizada | No se especifica experiencia de error | US-006-Q1 |
| Intento de acceder directamente a tabla física | Usar ruta autorizada; comportamiento de denegación concreto pendiente | BRC-001 BR-010 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-010 | Dashboards consumen definiciones semánticas mediante rutas autorizadas | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Dashboard | Experiencia de consulta visual | [TRM-0004](../../business/glossary/terms/TRM-0004-dashboard.md) |
| Modelo semántico | Contrato de datos de visualizaciones | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** respetar clasificación y permisos heredados de la consulta; políticas detalladas pendientes.
- **Otros:** Sin objetivos de rendimiento o compatibilidad identificados.

## 10. Consideraciones de UX

- **Flujo esperado:** seleccionar modelo/consulta → componer visualización → mostrar a usuarios autorizados.
- **Estados de la interfaz:** carga, vacío y error no especificados.
- **Contenido clave:** visualización del KPI y contexto de frescura/calidad/lineage disponible en US-005.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** modelo publicado y consulta semántica (US-004/005).
- **Es prerrequisito de:** no determinado; consumidores posteriores.
- **Supuestos:** ninguno sobre tecnología o plantilla de dashboard.
- **Hipótesis del agente:** incluir metadatos junto al dashboard facilita contextualizar; validar con usuarios.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-006-Q1 | ¿Qué roles crean/consumen dashboards, qué interacciones y cuáles entran en el primer release? | Producto / Visualization & Experience | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0007 | Dashboards consumen semántica reutilizable por ruta autorizada | BRC-001 §Evidencia; PRD FR-006 | fact | high |
| EVD-2026-0011 | Workloads del MVP no seleccionados | BRC-001 §Evidencia; PRD §20 | gap | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Visualization & Experience (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§4, 14 FR-006; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8, 9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | No | Depende de modelo/consulta publicada. |
| Negociable | Sí | Visuales e interacciones no fijados. |
| Valiosa | Sí | Hace consumible el análisis gobernado. |
| Estimable | Parcial | Alcance de dashboard desconocido. |
| Pequeña (Small) | Parcial | Acotar a una visualización y un consumidor. |
| Testeable | Parcial | Criterio semántico verificable; UX pendiente. |

## 15. Definition of Ready

- [x] Actor y valor en RCP
- [x] Criterio con fuente
- [ ] Estados y alcance del dashboard definidos
- [ ] Preguntas bloqueantes cerradas
- [x] Dependencias identificadas
- [x] Términos enlazados
- [ ] PO validó

## 16. Definition of Done (funcional)

- [ ] Dashboard consume consulta semántica autorizada
- [ ] Estados negativos acordados probados
- [ ] WCAG 2.2 AA revisada
- [ ] Privacidad respetada
- [ ] PO acepta
- [ ] No se implementa una definición KPI paralela local

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** falta seleccionar dashboard/workload de MVP y precisar experiencia/actores.
- **Bloqueos de entrega:** US-004/005 y US-006-Q1.
- **Propuesta de división (si no es pequeña):** dividir composición y consumo sólo si actores/capacidades resultan distintos en el release.
- **Siguiente rol o Skill:** Producto / Visualization & Experience.
- **Decisión humana requerida:** seleccionar workloads y validar alcance.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
