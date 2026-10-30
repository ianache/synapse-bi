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
  - id: RCP-003
    resource: /knowledge-base/requirements/context-packs/RCP-003-us-006-dashboard-semantico.md
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

- **Incluye:** dashboard/visualización basado en consulta semántica reutilizable; primer incremento con tarjetas KPI, gráfico de barras por canal, filtros compartidos de fecha y canal y selección reversible de un elemento gráfico, según decisiones de RCP-003 §10. El propietario crea y edita su dashboard; consumidores autorizados lo consultan.
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

### AC-2 — Aplicar selección de un gráfico

```gherkin
Escenario: Filtrar desde una barra o segmento
  Dado un dashboard con visualizaciones y consultas autorizadas
  Cuando el consumidor selecciona una barra o segmento que representa un filtro
  Entonces las demás visualizaciones compatibles se actualizan con ese filtro
  Y la selección permanece resaltada
  Y el filtro aparece como etiqueta visible
```

- **Fuente:** RCP-003 §10, decisiones del usuario sobre selección gráfica y filtro visible.

### AC-3 — Retirar el filtro gráfico

```gherkin
Escenario: Retirar la selección
  Dado un filtro originado en un gráfico
  Cuando el consumidor elimina su etiqueta o pulsa nuevamente el elemento seleccionado
  Entonces el filtro se retira
  Y las visualizaciones compatibles se actualizan sin ese filtro
```

- **Fuente:** RCP-003 §10, opción 1 aceptada por el usuario.

### AC-4 — Identificar incompatibilidad

```gherkin
Escenario: El filtro no aplica a una visualización
  Dado un filtro activo que una visualización no admite
  Cuando se actualiza el dashboard
  Entonces esa visualización permanece visible
  Y muestra que el filtro no aplica
```

- **Fuente:** RCP-003 §10, opción 1 aceptada por el usuario.

### AC-5 — Limpiar filtros

```gherkin
Escenario: Limpiar filtros activos
  Dado un dashboard con filtros activos
  Cuando el consumidor solicita limpiar filtros
  Entonces se restaura el período inicial configurado y todos los canales
  Y las visualizaciones compatibles se actualizan con esos valores
```

- **Fuente:** RCP-003 §10, opción 1 de limpieza aceptada por el usuario. La configuración del período inicial sigue pendiente.

### AC-6 — Consultar el pulso y explorar por canal

```gherkin
Escenario: Consultar las visualizaciones del primer incremento
  Dado un dashboard con KPI y consultas autorizadas compatibles
  Cuando un consumidor autorizado consulta el dashboard
  Entonces puede observar los valores en tarjetas KPI y un gráfico de barras por canal
  Y puede aplicar filtros compartidos de fecha y canal
```

- **Fuente:** RCP-003 §10, conjunto de visualizaciones y filtros aceptado por el usuario.

### AC-7 — Crear y editar un dashboard propio

```gherkin
Escenario: Gestionar un dashboard propio
  Dado un usuario autorizado para crear y editar dashboards
  Cuando crea o edita su dashboard
  Entonces puede gestionar su dashboard propio
  Y los consumidores autorizados pueden consultarlo
```

- **Fuente:** RCP-003 §10, roles aceptados por el usuario. La asignación de permisos y compartición permanece pendiente.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| No existe consulta semántica autorizada | No se especifica experiencia de error | US-006-Q1 |
| Una visualización no admite el filtro activo | Permanece visible e indica que el filtro no aplica | RCP-003 §10 |
| Invitado sin permiso para uno o todos los KPI | Ocultar KPI no autorizados; si no hay KPI autorizado, mostrar estado vacío sin revelar cuáles existen | RCP-003 §10 |
| Período válido sin datos | Mantener el período y mostrar «Sin datos para este período» en visualizaciones afectadas | RCP-003 §10 |
| Fecha inicial posterior a fecha final | Rechazar el rango | RCP-003 §10 |
| Falla una consulta mientras otras responden | Mantener disponibles las visualizaciones exitosas; mostrar error y reintento en la afectada | RCP-003 §10 |
| Se cambian las fechas con un canal seleccionado | Conservar el canal; si la nueva combinación no tiene datos, mostrar el estado sin datos | RCP-003 §10 |
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
- **Estados de la interfaz:** carga, vacío y error incluidos en el alcance acordado; contenido y comportamiento específicos pendientes. Selección resaltada y filtro visible y reversible; visualización incompatible identificada.
- **Contenido clave:** visualización del KPI y contexto de frescura/calidad/lineage disponible en US-005.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** modelo publicado y consulta semántica (US-004/005).
- **Es prerrequisito de:** no determinado; consumidores posteriores.
- **Supuestos:** ninguno sobre tecnología o plantilla de dashboard.
- **Hipótesis del agente:** incluir metadatos junto al dashboard facilita contextualizar; validar con usuarios.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-006-Q1 | ¿Qué directorio permite seleccionar usuarios del tenant y cómo se implementa la autorización y el estado vacío seguro? | Producto / Seguridad | Alta | Sí | Parcial: propietario comparte con personas concretas y puede revocar; invitados sin edición ven solo KPI autorizados y estado vacío si ninguno (RCP-003 §10); detalles abiertos |
| US-006-Q2 | ¿Qué reglas detalladas aplican a las visualizaciones y dimensiones compatibles? | Producto / UX | Alta | Sí | Parcial: tarjetas KPI y barras por canal, fecha y una selección de canal sincronizada entre barra y gráfico; cambiar canal reemplaza el anterior (RCP-003 §10) |
| US-006-Q3 | ¿Cuál es la pantalla Stitch exacta aprobada para el recorrido? | Producto / UX | Alta | Sí | Abierta |
| US-006-Q4 | ¿Qué límites adicionales y mensajes aplican a la selección de fechas? | Producto / UX | Alta | Sí | Parcial: rango inicial explícito configurado por propietario; sin datos conserva rango e informa; fecha inicial posterior a final se rechaza (RCP-003 §10) |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0007 | Dashboards consumen semántica reutilizable por ruta autorizada | BRC-001 §Evidencia; PRD FR-006 | fact | high |
| EVD-2026-0011 | Workloads del MVP no seleccionados | BRC-001 §Evidencia; PRD §20 | gap | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Visualization & Experience (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§4, 14 FR-006; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8, 9; [RCP-003](../context-packs/RCP-003-us-006-dashboard-semantico.md) §10, decisiones humanas de esta conversación.
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
- **Motivo:** dirección interactiva, visualizaciones iniciales, roles funcionales y filtros reversibles acordados; faltan workload, asignación de permisos, reglas detalladas de filtros, referencia Stitch y validación del PO.
- **Bloqueos de entrega:** US-004/005 y US-006-Q1.
- **Propuesta de división (si no es pequeña):** dividir composición y consumo sólo si actores/capacidades resultan distintos en el release.
- **Siguiente rol o Skill:** Producto / Visualization & Experience.
- **Decisión humana requerida:** seleccionar workloads y validar alcance.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
