---
type: User Story
title: "US-009 — Aplicar aislamiento por tenant"
description: "Tenant & Access Governance impide que las operaciones expongan datos de otro tenant."
tags: [user-story, plataforma, seguridad, multitenant]
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

# US-009 — Aplicar aislamiento por tenant

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-009 |
| Épica / capacidad | Tenant & Access Governance, FR-009 |
| Horizonte / release | Por definir; modelo/tier de tenant no aprobado |
| Actor | [Tenant & Access Governance](../../../intents/PRD.md) (RCP-001 §8) |
| Responsable de negocio (PO) | Seguridad / Producto por asignar |
| Prioridad | Must propuesta: requisito de seguridad; decide PO con Seguridad |
| Estimación |  |
| Dependencias | Identidad autorizada, US-005, US-006, US-007, US-010; procesos de export/cache |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Tenant & Access Governance, **quiero** aplicar aislamiento en las operaciones y datos derivados de cada tenant, **para** evitar exposición entre tenants.

## 3. Contexto y valor

- **Problema que resuelve:** fuga cross-tenant por joins, cachés, exportaciones, IA, jobs o logs (PRD §13, RCP-001 R-002).
- **Valor esperado:** ninguna operación autorizada expone datos de otro tenant.
- **Métrica o KPI que impacta:** pruebas negativas y auditoría; objetivo cuantificado pendiente.

## 4. Alcance

- **Incluye:** lectura, escritura, exportación, caché, IA, jobs y observabilidad.
- **Excluye:** tier de aislamiento, semántica exacta de denegación y política legal de retención, pendientes.

## 5. Criterios de aceptación

### AC-1 — Denegar exposición cross-tenant

```gherkin
Escenario: Solicitud intenta acceder a datos de otro tenant
  Dado un usuario con identidad y tenant autorizados
  Cuando solicita una operación que alcanzaría datos de otro tenant
  Entonces esos datos no se exponen en lectura, escritura, exportación, caché, IA, jobs ni observabilidad
```

- **Regla / fuente:** PRD §§13.1–13.3, FR-009; BRC-001 BR-012.

### AC-2 — Verificar caminos indirectos

```gherkin
Escenario: Probar artefactos derivados con límites tenant
  Dado un artefacto derivado de una operación tenant-scoped
  Cuando se ejecutan pruebas negativas de aislamiento
  Entonces caché, export, job y observabilidad no revelan datos de otro tenant
```

- **Regla / fuente:** PRD §13.2; BRC-001 BR-009/012/016.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Identidad/tenant no resuelto | No conceder acceso; semántica de error pendiente | BRC-001 I-003; US-009-Q1 |
| Consulta mezcla tenants | No exponer datos cross-tenant | BRC-001 BR-012 |
| Resultado en caché/export/log | Mantener alcance tenant | PRD §13.2 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-012 | Operación alguna expone datos de otro tenant | BRC-001 §Reglas |
| BR-016 | Acceso y cambios deben ser auditables | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Tenant | Límite de datos y gobierno | [TRM-0023](../../business/glossary/terms/TRM-0023-tenant.md) |
| Aislamiento multitenant | Protección de caminos de acceso | [TRM-0001](../../business/glossary/terms/TRM-0001-aislamiento-multitenant.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA en controles de interfaz afectados.
- **Privacidad y datos personales:** minimizar exposición; residencia/retención por jurisdicción pendiente.
- **Otros:** PRD requiere pruebas negativas y auditoría; cobertura cuantificada y retención de auditoría pendientes.

## 10. Consideraciones de UX

- **Flujo esperado:** resolver identidad/contexto → autorizar operación → mostrar sólo contenido permitido.
- **Estados de la interfaz:** acceso permitido/denegado; mensajes concretos no definidos.
- **Contenido clave:** alcance tenant y respuesta segura sin revelar otros tenants.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** identidad y tenant autorizados, política por operación, cachés/exports/jobs.
- **Es prerrequisito de:** cualquier consumo multitenant.
- **Supuestos:** no asumir un tier de aislamiento ni entidad tenant organizacional confirmada.
- **Hipótesis del agente:** pruebas negativas por ruta son necesarias para evidenciar el control; validar cobertura.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| GQ-04 | ¿Qué entidad representa Tenant y cómo se relaciona con producto/dominio? | Producto / Tenant & Access Governance | Alta | Sí | Abierta |
| US-009-Q1 | ¿Qué modelo/tier, identidad, políticas, respuesta de denegación y retención de auditoría se aprueban? | Seguridad / Arquitectura / Producto | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0008 | Tenant es límite de seguridad y contexto se resuelve desde identidad autorizada | BRC-001 §Evidencia; PRD §§5, 13 | fact | high |
| EVD-2026-0009 | Artefactos derivados también requieren alcance tenant | BRC-001 §Evidencia; PRD §13.2 | fact | high |
| EVD-2026-0011 | Tier, retención y residencia sin decisión aprobada | BRC-001 §Evidencia; PRD §15 | gap | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Seguridad / Tenant & Access Governance (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§5, 13, 14 FR-009; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | No | Cruza todos los componentes/rutas. |
| Negociable | Parcial | Objetivo no; implementación/políticas sí. |
| Valiosa | Sí | Previene exposición de datos. |
| Estimable | No | Identidad, tier y controles no definidos. |
| Pequeña (Small) | No | Varias rutas y procesos; desglosar por capacidad de prueba/operación. |
| Testeable | Sí | Invariante observable, aunque cobertura por ruta pendiente. |

## 15. Definition of Ready

- [x] Actor/valor sustentados
- [x] Invariante con fuente
- [ ] Modelo/identidad y error acordados
- [ ] Preguntas bloqueantes cerradas
- [ ] Dependencias técnicas/funcionales identificadas
- [x] Términos enlazados
- [ ] Seguridad y PO validan

## 16. Definition of Done (funcional)

- [ ] Casos negativos cubiertos por ruta
- [ ] WCAG 2.2 AA revisada
- [ ] Política aprobada aplicada a datos personales
- [ ] Seguridad/PO aceptan evidencia
- [ ] Auditoría verificada según retención acordada
- [ ] No hay exposición cross-tenant en lectura/escritura/export/cache/IA/jobs/observabilidad

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** invariante clara, implementación funcional bloqueada por identidad, tenant, tiers, políticas y pruebas requeridas.
- **Bloqueos de entrega:** GQ-04, US-009-Q1 y decisión de seguridad/arquitectura.
- **Propuesta de división (si no es pequeña):** desglosar operaciones directas, artefactos derivados y contexto IA, manteniendo criterio global anti-fuga.
- **Siguiente rol o Skill:** arquitectura/seguridad y Producto.
- **Decisión humana requerida:** aprobar definición de tenant, identidad, política y cobertura de pruebas.
- **Validación:** Pendiente · Responsable: Seguridad · Fecha: —
