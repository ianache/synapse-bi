---
type: User Story
title: "US-010 — Explorar datos con IA gobernada"
description: "AI Analytics permite exploración fundamentada sólo en modelos, documentos y datos autorizados."
tags: [user-story, plataforma, ia, governance]
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

# US-010 — Explorar datos con IA gobernada

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-010 |
| Épica / capacidad | AI Analytics, FR-010 |
| Horizonte / release | Por definir; consulta IA del MVP es propuesta no aprobada |
| Actor | [AI Analytics](../../../intents/PRD.md) y consumidor autorizado (RCP-001 §8) |
| Responsable de negocio (PO) | Producto / Seguridad por asignar |
| Prioridad | Could propuesta: inclusión en release no aprobada |
| Estimación |  |
| Dependencias | US-004, US-005, US-009; permisos y grounding |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** consumidor autorizado, **quiero** explorar modelos, documentos y datos permitidos con ayuda de IA, **para** obtener análisis contextualizado y trazable.

## 3. Contexto y valor

- **Problema que resuelve:** respuestas sin grounding o lineage auditable no son verificables (RCP-001 R-006).
- **Valor esperado:** exploración acotada a fuentes autorizadas.
- **Métrica o KPI que impacta:** métrica de calidad de respuesta no definida.

## 4. Alcance

- **Incluye:** exploración sólo de modelos, documentos y datos autorizados.
- **Excluye:** publicar/modificar/retirar KPI; acciones autónomas no autorizadas.

## 5. Criterios de aceptación

### AC-1 — Restringir grounding a fuentes autorizadas

```gherkin
Escenario: Preparar contexto de exploración IA
  Dado que identidad, tenant, producto, rol y políticas aplicables están resueltos
  Cuando AI Analytics prepara el contexto para una consulta
  Entonces incluye sólo modelos, documentos y datos autorizados
```

- **Regla / fuente:** PRD §§13.3, 14 FR-010; BRC-001 BR-013.

### AC-2 — Citar artefactos autorizados

```gherkin
Escenario: Presentar respuesta con referencias
  Dado una respuesta generada a partir del contexto autorizado
  Cuando se presenta al consumidor
  Entonces sus citas apuntan a artefactos autorizados y no revelan datos de otro tenant
```

- **Regla / fuente:** PRD §13.3; BRC-001 BR-013.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Contexto de tenant/rol no resuelto | No se define interacción/error; no debe agregar tenants | PRD §13.3; US-010-Q1 |
| Candidato a KPI sugerido por IA | No publicar/modificar/retirar sin revisión gobernada | PRD §2.3; BRC-001 BR-014 (parte del flujo es propuesta) |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-013 | Grounding posterior a autorización; citas sólo a artefactos permitidos | BRC-001 §Reglas |
| BR-014 | IA no publica/modifica/retira KPI; flujo de propuesta/revisión tiene partes pendientes | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| IA | Asistencia de exploración | [TRM-0013](../../business/glossary/terms/TRM-0013-ia.md) |
| Modelo semántico | Fuente de contexto gobernado | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |
| Tenant | Límite del contexto | [TRM-0023](../../business/glossary/terms/TRM-0023-tenant.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** grounding y cita deben respetar acceso/clasificación; retención/residencia pendientes.
- **Otros:** auditoría/quality metrics no detalladas para IA.

## 10. Consideraciones de UX

- **Flujo esperado:** resolver permisos → formular pregunta → recibir respuesta/citas autorizadas.
- **Estados de la interfaz:** sin contexto autorizado/error y respuesta incompleta por definir.
- **Contenido clave:** citas, fuentes y límites de la respuesta; no revelar fuentes denegadas.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** identidad, autorización, modelo publicado, consultas y políticas tenant.
- **Es prerrequisito de:** no se identifica otro requisito.
- **Supuestos:** la fuente no aprueba autonomía de agentes.
- **Hipótesis del agente:** mostrar citas junto a la respuesta facilita verificación; validar con negocio.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-010-Q1 | ¿Qué nivel de autonomía, fuentes, citas, redacción, auditoría y manejo de identidad no resuelta se permite? | Producto / Seguridad / Semantic Governance | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0010 | IA sólo usa modelos/documentos/datos autorizados y no altera KPI silenciosamente | BRC-001 §Evidencia; PRD §§2.3, 13.3, 14 | fact | high |
| EVD-2026-0013 | Flujo de borradores y controles adicionalmente propuesto, pendiente de aprobación | BRC-001 §Evidencia | decision | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Seguridad (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §§2.3, 13.3, 14 FR-010; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§8–9.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | No | Depende de permisos y semántica. |
| Negociable | Parcial | Autonomía y UX abiertas; seguridad no negociable. |
| Valiosa | Sí | Habilita análisis asistido verificable. |
| Estimable | No | Fuentes y política IA faltan. |
| Pequeña (Small) | Parcial | Restringir a consulta IA gobernada mínima. |
| Testeable | Parcial | Restricción/citas verificables; calidad de respuesta no definida. |

## 15. Definition of Ready

- [x] Actor/valor con fuente
- [x] Restricción de autorización con fuente
- [ ] Política de autonomía/errores aprobada
- [ ] Pregunta bloqueante cerrada
- [x] Dependencias identificadas
- [x] Términos enlazados
- [ ] PO y Seguridad validan

## 16. Definition of Done (funcional)

- [ ] Sólo grounding autorizado y citas permitidas
- [ ] Fugas cross-tenant y contextos ausentes probados
- [ ] WCAG 2.2 AA revisada
- [ ] Política de datos aplicada
- [ ] PO/Security aceptan
- [ ] IA no modifica/publica/retira KPI

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** límites generales existen, pero fuentes, autonomía, error y política de publicación requieren aprobación.
- **Bloqueos de entrega:** US-009 y US-010-Q1.
- **Propuesta de división (si no es pequeña):** separar explorar/explicar de proponer KPI si la propuesta queda dentro del release.
- **Siguiente rol o Skill:** Producto / Seguridad / Semantic Governance.
- **Decisión humana requerida:** aprobar alcance y política de IA.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
