---
type: User Story
title: "US-001 — Registrar fuente y observar esquema"
description: "Source Connectivity registra una fuente y consulta su estructura técnica sin atribuirle significado de negocio."
tags: [user-story, plataforma, catalogo, source-connectivity]
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

# US-001 — Registrar fuente y observar esquema

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-001 |
| Épica / capacidad | Catálogo de fuentes, PRD §14 FR-001 |
| Horizonte / release | Por definir; fuentes del primer release no seleccionadas |
| Actor | [Source Connectivity](../../../intents/PRD.md) (rol funcional descrito en RCP-001 §8) |
| Responsable de negocio (PO) | Por definir; Producto coordina según propuesta BRC-001, pendiente de aprobación |
| Prioridad | Must propuesta: habilita el registro de datos del producto; decide PO |
| Estimación |  |
| Dependencias | Identidad/conectividad y definición de fuentes por seleccionar |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** Source Connectivity, **quiero** registrar una fuente y observar su esquema, **para** conocer su estructura técnica sin confundirla con significado de negocio.

## 3. Contexto y valor

- **Problema que resuelve:** La estructura detectada no equivale a una definición semántica aprobada (PRD §9.1, FR-001).
- **Valor esperado:** Fuentes inventariadas y estructura técnica disponible para evaluación posterior.
- **Métrica o KPI que impacta:** Sin métrica asociada.

## 4. Alcance

- **Incluye:** registrar fuente y observar esquema.
- **Excluye:** conectores, credenciales y protocolos concretos, no identificados; aprobar entidades/KPI (US-003).

## 5. Criterios de aceptación

### AC-1 — Observar estructura sin inferir significado

```gherkin
Escenario: Registrar observación técnica de una fuente
  Dado una fuente registrada
  Cuando Source Connectivity observa su esquema
  Entonces la estructura se registra como observación técnica y no como definición de negocio
```

- **Regla / fuente:** PRD §9.1 y FR-001; BRC-001 BR-002.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| La observación contiene campos que parecen KPI | No promoverlos automáticamente a conceptos de negocio | BRC-001 BR-002 |
| Fuente inaccesible o esquema vacío/cambiante | Tratamiento no definido | US-001-Q1 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-002 | Observar estructura no autoriza convertirla en definición de negocio | BRC-001 §Reglas |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Fuente gobernada | Fuente cuya aptitud de consumo directo requiere criterios pendientes | [TRM-0010](../../business/glossary/terms/TRM-0010-fuente-gobernada.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA (estándar del repositorio).
- **Privacidad y datos personales:** No se define acceso ni transferencia de datos personales en el requisito; aplicar política aprobada cuando se determine.
- **Otros:** No hay requisito de disponibilidad, conectividad ni latencia identificado.

## 10. Consideraciones de UX

- **Flujo esperado:** registrar fuente → solicitar observación → consultar esquema observado.
- **Estados de la interfaz:** éxito; error, vacío y falta de permiso quedan por definir.
- **Contenido clave:** diferenciar visualmente observación técnica y definición semántica.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** fuente y credenciales/conectividad disponibles; mecanismos no especificados.
- **Es prerrequisito de:** US-002.
- **Supuestos:** ninguno adicional.
- **Hipótesis del agente:** separar visualmente esquema observado de semántica reduce confusiones; validar con usuarios.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-001-Q1 | ¿Qué fuentes, conectores, credenciales y respuestas ante fuente inaccesible o esquema vacío se incluyen en el primer release? | Producto / Source Connectivity | Alta | Sí | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0002 | La observación técnica no se convierte automáticamente en definición de negocio | BRC-001 §Evidencia; PRD §9.1 | fact | high |
| EVD-2026-0011 | Fuentes concretas y contratos aún no están confirmados | BRC-001 §Evidencia; PRD §§15, 20 | gap | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Source Connectivity (por confirmar)`.

- **Upstream:** [PRD](../../../intents/PRD.md) §9.1, §14 FR-001; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §8.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Requiere fuente/conectividad disponible. |
| Negociable | Sí | Conectores y detalle de observación pendientes. |
| Valiosa | Sí | Hace visible la estructura de entrada sin inventar semántica. |
| Estimable | Parcial | Fuentes y conectores no seleccionados. |
| Pequeña (Small) | Parcial | Acotar al primer conector/dominio al seleccionar release. |
| Testeable | Sí | AC comprueba que observar no publique significado. |

## 15. Definition of Ready

- [ ] El actor y el valor están sostenidos por una fuente
- [x] Los criterios citan fuente
- [ ] Casos negativos resueltos o con comportamiento/pregunta asignada
- [ ] No hay preguntas bloqueantes
- [x] Dependencias identificadas
- [x] Término vinculado al glosario
- [ ] PO validó la historia

## 16. Definition of Done (funcional)

- [ ] AC pasa pruebas de aceptación
- [ ] Casos negativos cubiertos
- [ ] Accesibilidad WCAG 2.2 AA revisada
- [ ] Privacidad cumple política aprobada aplicable
- [ ] PO acepta la historia
- [ ] Se evidencia que esquema observado no crea conceptos de negocio automáticamente

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** RCP y PRD son borradores; fuente/conectividad y comportamiento de error no están definidos.
- **Bloqueos de entrega:** Selección de fuentes del primer release.
- **Propuesta de división (si no es pequeña):** No aplica; revisar al conocer conectores.
- **Siguiente rol o Skill:** af-requirement-context-builder / Producto para cerrar alcance.
- **Decisión humana requerida:** validar RCP, fuentes y conectores incluidos.
- **Validación:** Pendiente · Responsable: Producto · Fecha: —
