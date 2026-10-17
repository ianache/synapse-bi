---
type: User Story
title: "US-004 — Versionar y publicar modelo semántico"
description: "Semantic Governance gestiona versiones y estados declarados del modelo semántico."
tags: [user-story, plataforma, semantica, lifecycle]
status: draft
generated:
  by: "af-user-story-refiner/2.0"
  at: "2026-10-17T14:02:49-05:00"
sources:
  - id: BRC-002
    resource: /knowledge-base/business/rules/BRC-002-gobierno-publicacion-modelo-semantico.md
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
| Responsable de negocio (PO) | Producto / Semantic Governance; personas y delegaciones por definir (Q2) |
| Prioridad | Must propuesta: gobierna disponibilidad del contrato; decide PO |
| Estimación |  |
| Dependencias | US-003; workflow y evidencias aprobados en BRC-002; nombramientos reales pendientes de operación |
| Preparación | READY para diseño/refinamiento de laboratorio; CONDITIONAL para operación real/producción |

## 2. Historia

**Como** Semantic Governance, **quiero** versionar y gestionar el ciclo de vida de modelos semánticos, **para** distinguir definiciones en preparación de las disponibles para consumo.

## 3. Contexto y valor

- **Problema que resuelve:** consumidores necesitan identificar estado y versión del modelo (PRD FR-004).
- **Valor esperado:** estado de publicación visible y cambios rastreables.
- **Métrica o KPI que impacta:** Sin métrica asociada.

## 4. Alcance

- **Incluye:** estados `draft`, `review`, `published`, `deprecated`, `retired`; revisión, publicación, inmutabilidad, versiones funcionales, deprecación de 30 días y auditoría según GOV004-01–07.
- **Límite aprobado del primer incremento:** cada modelo pertenece a un único dominio; un dominio puede tener varios modelos. Selección de KPI del dominio y sus dependencias; sin creación automática de modelos (GOV004-12, opción A).
- **Captura aprobada:** borrador con definiciones/dependencias capturadas; cambios de catálogo visibles sin sincronización automática; actualización mediante acción explícita y comparación previa (GOV004-13).
- **Excluye:** ejecución de consultas (US-005), certificación de datos, IAM productivo y políticas legales de retención. Reversión, suspensión y excepciones se rigen por GOV004-09, sin asumir control sobre consumidores externos.

## 5. Criterios de aceptación

### AC-1 — Identificar estados del modelo

```gherkin
Escenario: Consultar el estado del modelo
  Dado un modelo semántico registrado
  Cuando el actor consulta su ciclo de vida
  Entonces el modelo puede identificarse con los estados draft, review, published, deprecated o retired
```

- **Regla / fuente:** PRD §14 FR-004 y BRC-002 GOV004-01.

### AC-2 — Solicitar revisión

```gherkin
Escenario: Enviar un borrador completo a revisión
  Dado un borrador con definición completa y validaciones preliminares aprobadas
  Cuando el autor autorizado solicita revisión
  Entonces pasa a review y conserva el contenido objeto de revisión
```

- **Regla / fuente:** GOV004-01/03. Evidencias concretas en GOV004-11.

### AC-3 — Corregir una revisión

```gherkin
Escenario: Solicitar cambios durante revisión
  Dado un modelo en review
  Cuando un actor autorizado registra el motivo de rechazo, cambio o retiro de solicitud
  Entonces regresa a draft
  Y cualquier modificación posterior invalida las aprobaciones previas
```

- **Regla / fuente:** GOV004-01.

### AC-4 — Publicar contenido aprobado

```gherkin
Escenario: Publicar la versión revisada
  Dado un modelo en review que satisface los controles de publicación
  Y aprobación funcional del Domain Owner y autorización de Semantic Governance
  Y ambas aprobaciones corresponden a personas distintas y diferentes del autor
  Y Seguridad intervino si cambió clasificación, acceso o exposición sensible
  Cuando se solicita publicar el mismo contenido aprobado
  Entonces pasa a published con contenido y referencias congelados
  Y la publicación no amplía permisos sobre datos subyacentes
```

- **Regla / fuente:** GOV004-01/02/03/04/05. Evidencias detalladas en GOV004-11.

### AC-5 — Rechazar publicación incompleta

```gherkin
Escenario: Falta un requisito de publicación
  Dado un modelo al que falta un atributo, referencia, política o aprobación exigidos
  Cuando se intenta publicar
  Entonces no pasa a published y se identifican los requisitos faltantes
```

- **Regla / fuente:** GOV004-03; no inferir cálculo automático ni certificación.

### AC-6 — Preservar una versión publicada

```gherkin
Escenario: Cambiar una definición ya publicada
  Dado un modelo publicado con definiciones y referencias congeladas
  Cuando cambia una definición en el catálogo o se solicita modificar el modelo
  Entonces el contenido publicado permanece intacto
  Y cualquier contenido modificado requiere una versión nueva
```

- **Regla / fuente:** GOV004-05.

### AC-7 — Clasificar la nueva versión

```gherkin
Esquema del escenario: Versionar según impacto revisado
  Dada una versión anterior y un cambio clasificado por revisión
  Cuando se determina la nueva versión funcional
  Entonces se incrementa <parte> por <impacto>
  Y no se confunde con la revisión técnica de concurrencia

  Ejemplos:
    | parte | impacto |
    | MAJOR | cambio de fórmula, grano, unidad, significado, eliminación o contrato incompatible |
    | MINOR | adición opcional compatible |
    | PATCH | corrección documental sin cambiar significado, resultados ni contrato |
```

- **Regla / fuente:** GOV004-05.

### AC-8 — Deprecar con aviso

```gherkin
Escenario: Iniciar compatibilidad de una versión sustituida o discontinuada
  Dada una versión published y una justificación y plan de migración
  Cuando se autoriza su deprecación
  Entonces pasa a deprecated con aviso de versión afectada, alternativa y fecha prevista
  Y la ventana inicial es de 30 días naturales, ampliable por acuerdo
  Y los consumidores existentes conservan disponibilidad autorizada con advertencia
  Y se impiden nuevas asociaciones ordinarias
```

- **Regla / fuente:** GOV004-04/06. No obliga a migrar consumidores automáticamente.

### AC-9 — Retirar tras migración

```gherkin
Escenario: Retiro ordinario de una versión
  Dada una versión deprecated cuya ventana ha terminado
  Y confirmación de migración de consumidores conocidos y tratamiento de desconocidos
  Cuando un actor autorizado solicita retiro
  Entonces pasa a retired y no admite nuevas ejecuciones
  Y preserva definición y auditoría para consulta histórica autorizada
```

- **Regla / fuente:** GOV004-04/06. Excepción de retiro regulada por GOV004-09.

### AC-10 — Restringir acceso por estado y tenant

```gherkin
Escenario: Consultar el contrato de disponibilidad
  Dado un actor con identidad y tenant autorizados
  Cuando consulta una versión del modelo
  Entonces draft se restringe al autor y colaboradores autorizados
  Y review se restringe a revisores autorizados
  Y published permite consumo sujeto a permisos del modelo y del dataset
  Y deprecated conserva sólo consumidores existentes con advertencia
  Y retired permite únicamente lectura histórica autorizada de definición y auditoría
```

- **Regla / fuente:** GOV004-04. Aplicación de ejecución de datos corresponde a US-005.

### AC-11 — Auditar el cambio

```gherkin
Escenario: Registrar una transición autorizada
  Dada una versión del modelo y un actor autorizado
  Cuando se realiza una transición
  Entonces queda un registro de actor, tenant, fecha, versión, transición y motivo
  Y se registran diferencias, evidencias y aprobaciones
```

- **Regla / fuente:** GOV004-07; acceso y laboratorio definidos en GOV004-10; política de retención productiva pendiente.

### AC-12 — Exigir asignaciones vigentes

```gherkin
Escenario: Falta un responsable o suplente vigente
  Dado un modelo con una aprobación requerida sin responsable o suplente vigente
  Cuando se solicita publicación
  Entonces se bloquea publicación
```

- **Regla / fuente:** GOV004-08; delegaciones temporales, explícitas, auditadas y sin subdelegación.

### AC-13 — Revertir sin reactivar versiones retiradas

```gherkin
Escenario: Autorizar regreso a una versión anterior habilitada
  Dada una versión destino anterior todavía habilitada
  Y evidencia de motivo, compatibilidad y consumidores afectados
  Cuando Domain Owner y Semantic Governance autorizan la reversión
  Entonces queda registrada la autorización sin modificar contenido
  Y no se migran consumidores silenciosamente ni se reactiva una versión retired
```

- **Regla / fuente:** GOV004-09. Recuperar retired exige nueva versión y revisión.

### AC-14 — Autorizar retiro excepcional

```gherkin
Escenario: Retirar sin cumplir las condiciones ordinarias
  Dada evidencia de riesgo aceptado, impacto, avisos y tratamiento de consumidores
  Cuando Domain Owner y Semantic Governance autorizan la excepción
  Y Seguridad aprueba si hay riesgo de acceso o datos
  Entonces el retiro excepcional queda autorizado y auditado
  Y no amplía acceso entre tenants ni elimina historial
```

- **Regla / fuente:** GOV004-09.

### AC-15 — Suspender ante incidente

```gherkin
Escenario: Suspender disponibilidad por seguridad
  Dado un incidente con identificador, motivo y alcance
  Cuando Seguridad dispone la suspensión
  Entonces la disponibilidad de consumo queda suspendida inmediatamente
  Y no cambia el contenido ni el estado del ciclo de vida
  Y la suspensión no vence automáticamente
```

- **Regla / fuente:** GOV004-09. US-004 controla disponibilidad; no demuestra motor de consultas US-005.

### AC-16 — Reanudar explícitamente

```gherkin
Escenario: Levantar una suspensión
  Dada evidencia de resolución del incidente y verificaciones satisfactorias
  Cuando Seguridad y Semantic Governance autorizan reanudar
  Y Domain Owner aprueba si afecta significado o resultados
  Entonces se levanta explícitamente la suspensión y se registra la decisión
```

- **Regla / fuente:** GOV004-09; no modifica el ciclo ni reescribe definiciones.

### AC-17 — Proteger auditoría

```gherkin
Escenario: Acceder al historial
  Dado un actor autorizado por tenant y función
  Cuando consulta o exporta auditoría
  Entonces sólo accede al alcance autorizado
  Y exportar requiere permiso explícito y registro de operación
  Y permisos de edición del modelo no permiten alterar historial
  Y no se registran secretos ni filas de negocio
```

- **Regla / fuente:** GOV004-10. Laboratorio conserva historial durante toda la prueba sin purga automática; producción exige política aprobada sobre respaldos y evidencias, y conservación por investigación impide borrado.

### AC-18 — Exigir evidencia de cálculo cuando aplica

```gherkin
Escenario: Publicar un KPI nuevo o con cambio de cálculo antes de US-005
  Dado un KPI nuevo o con cambio de fórmula, grano, unidad o lógica
  Cuando se evalúan los controles de publicación
  Entonces se exige evidencia externa revisada de entradas, esperado y obtenido
  Y la evidencia incluye contexto, filtros, procedimiento reproducible, casos límite aplicables, autor, revisor y versión
  Y cada control identifica resultado, responsable, fecha y versión exacta
  Y esa evidencia no se presenta como ejecución automática de la plataforma
```

- **Regla / fuente:** GOV004-11. Cambios sólo documentales sin efecto semántico justifican clasificación y no exigen repetir cálculos.

### AC-19 — Agrupar modelos por dominio

```gherkin
Escenario: Preparar un modelo dentro de un dominio
  Dado un dominio autorizado del tenant
  Cuando se prepara un modelo con KPI seleccionados
  Entonces el modelo pertenece sólo a ese dominio e incluye las dependencias de esos KPI
  Y el dominio puede tener otros modelos sin crearlos automáticamente
```

- **Regla / fuente:** GOV004-12 / EVD-2026-0016. Selección entre dominios no está permitida en este incremento.

### AC-20 — Actualizar explícitamente la captura

```gherkin
Escenario: Cambia el catálogo después de guardar un borrador
  Dado un borrador con definiciones KPI y dependencias capturadas
  Cuando cambia una definición del catálogo
  Entonces la captura del borrador permanece intacta
  Y actualizarla requiere comparación previa y acción explícita
  Y comparar versiones no ejecuta fórmulas ni publica
```

- **Regla / fuente:** GOV004-13 / EVD-2026-0017.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| Editar review directamente | No editar; regresar a draft con motivo. | GOV004-01 |
| Editar published | Contenido inmutable; nueva versión. | GOV004-05 |
| Autor intenta autoaprobar / administrador sin rol funcional | No cumple autorización para publicar. | GOV004-02 |
| Falta dato obligatorio, referencia válida o aprobación vigente | Bloquear publicación. | GOV004-03 |
| Sin modelos | Sin comportamiento funcional adicional; UX debe contemplar vacío. | §10 |
| Consulta de datos en draft/review/retired o fuera de tenant | No permitir consumo ordinario; retired sólo definición/auditoría histórica autorizada. | GOV004-04 |
| Retiro antes de 30 días o con migración sin confirmar | No procede por flujo ordinario; excepción regulada por GOV004-09. | GOV004-06 |
| Sin telemetría de consumidores | No equivale a ausencia de uso; requiere tratamiento explícito. | GOV004-06 |
| KPI nuevo o cambio de cálculo sin prueba externa revisada antes de US-005 | No considerar gate cumplido; no inventar ejecución automática. | GOV004-03/11 |
| Reversión, retiro excepcional o reanudación sin aprobaciones requeridas | No autorizar la operación. | GOV004-09 |
| Autor aprueba con otro rol / misma persona en ambas aprobaciones | No cumple segregación del primer release. | GOV004-08 |
| Delegación vencida o subdelegada | No habilita aprobación. | GOV004-08 |
| Retorno a retired o reanudación automática de suspensión | No permitido. | GOV004-09 |
| Intento de alterar auditoría con permisos de edición | No permitido. | GOV004-10 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| GOV004-01/02 | Ciclo, revisión y segregación de responsabilidades | BRC-002 |
| GOV004-03/04 | Gates y acceso por estado/tenant | BRC-002 |
| GOV004-05/06 | Inmutabilidad, versiones y compatibilidad de 30 días | BRC-002 |
| GOV004-07/09 | Reversión, suspensión, reanudación y excepciones | BRC-002 |
| GOV004-08 | Asignaciones, delegaciones y segregación del primer release | BRC-002 |
| GOV004-10/11 | Auditoría, retención de laboratorio y evidencias por control | BRC-002 |
| GOV004-12 | Agrupación modelo/dominio, opción A confirmada | BRC-002 |
| GOV004-13 | Captura de dependencias y actualización explícita de borradores | BRC-002 |
| BR-008/015/018 | Propuestas históricas concretadas por BRC-002 sólo para US-004 | BRC-001 y BRC-002 |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Modelo semántico | Activo gobernado con estado/versión | [TRM-0020](../../business/glossary/terms/TRM-0020-modelo-semantico.md) |
| Publicación de modelo semántico | Disponibilidad del modelo según ciclo de vida | [TRM-0022](../../business/glossary/terms/TRM-0022-publicacion-de-modelo-semantico.md) |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA.
- **Privacidad y datos personales:** auditoría identifica actores; acceso tenant-scoped, sin secretos ni filas de negocio; laboratorio sin purga durante la prueba, política productiva pendiente (Q4). Publicar no amplía acceso a datos.
- **Otros:** auditoría de cambios requerida en PRD §13.2/§14 y BRC-001 BR-016; conservación por investigación y retención productiva por aprobar; alcance de laboratorio definido en GOV004-10.

## 10. Consideraciones de UX

- **Flujo esperado:** preparar versión → revisar diferencias y evidencias → solicitar revisión → corregir o publicar → deprecar/migrar → retirar.
- **Estados de la interfaz:** vacío, sin permisos, error, éxito, cinco estados del modelo, revisión bloqueada y controles incompletos.
- **Contenido clave:** versión funcional separada de revisión técnica, diferencias, responsables/aprobaciones, gates, avisos y fecha de retiro; no presentar certificación inexistente.
- **Diseño pendiente:** usar Google Stitch y cumplir AGENTS.md antes de implementar pantallas.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** US-003; BRC-002 aprueba workflow general. Q2–Q5 tienen respuestas funcionales aprobadas; nombramientos reales y retención productiva siguen como condiciones operativas.
- **Es prerrequisito de:** US-005, US-006 y US-010.
- **Supuestos:** ninguno adicional; aprobación se limita a GOV004-01–11, no a todo BRC-001.
- **Hipótesis del agente:** mostrar estado y versión junto al modelo evita consumo accidental; validar.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-004-Q1 | Transiciones, aprobadores, gates, consulta, cambios y compatibilidad | Producto / Semantic Governance | Alta | No | Cerrada: conjunto aprobado 2026-10-17, EVD-2026-0014 |
| US-004-Q2 | Asignaciones y delegaciones por tenant/dominio | Producto / owners | Alta | Nombramientos antes de operación real | Cerrada funcionalmente: GOV004-08; personas no designadas |
| US-004-Q3 | Autoridad/evidencias de reversión, excepción de retiro, suspensión y reanudación | Semantic Governance / Seguridad / owner | Alta | No | Cerrada: GOV004-09 |
| US-004-Q4 | Retención y acceso de auditoría por clasificación/tenant | Legal / Seguridad | Alta | Política pendiente antes de producción | Resuelta para laboratorio: GOV004-10; plazo productivo no aprobado |
| US-004-Q5 | Evidencia concreta por gate y pruebas externas de cálculo | Domain Owner / Semantic Governance | Alta | No | Cerrada: GOV004-11 |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0006 | PRD enumera cinco estados de ciclo de vida | BRC-001 §Evidencia; PRD FR-004 | fact | high |
| EVD-2026-0013 | Propuesta histórica de transiciones y gates, entonces no aprobada | BRC-001 §Evidencia | decision | high |
| EVD-2026-0014 | Usuario aprobó respuesta de siete apartados a Q1 | BRC-002 §Evidencia y GOV004-01–07 | decision | high |
| EVD-2026-0015 | Usuario aprobó Q2–Q5 con límites de operación real/producción | BRC-002 §Evidencia y GOV004-08–11 | decision | high |
| EVD-2026-0016 | Usuario confirmó opción A para agrupación modelo/dominio | BRC-002 §Evidencia y GOV004-12 | decision | high |
| EVD-2026-0017 | Usuario aprobó captura explícita y comparación antes de actualizar | BRC-002 §Evidencia y GOV004-13 | decision | high |

Evidencia compartida: `source_type: document`, `observed_at: 2026-10-16T01:22:23-05:00`, `freshness: current`, `owner: Producto / Semantic Governance (por confirmar)`.

Las evidencias humanas EVD-2026-0014/0015 tienen provenance y horas de registro propias en BRC-002; no heredan la fecha documental anterior.

- **Upstream:** [PRD](../../../intents/PRD.md) FR-004; [RCP-001](../context-packs/RCP-001-bi-analytics-platform-v1-1.md) §§7, 10.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC.
- **Especificación de primera entrega para revisión:** [Modelos y borradores versionados](/docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md). No implica plan aprobado ni implementación.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | No | Requiere definiciones semánticas. |
| Negociable | Sí | Reglas aprobadas; división y detalles de diseño por revisar. |
| Valiosa | Sí | Hace visible disponibilidad y estado. |
| Estimable | Parcial | Reglas y evidencias aprobadas; equipo debe dividir y estimar incrementos. |
| Pequeña (Small) | No | Historia madre: proponer división antes de implementación. |
| Testeable | Sí, laboratorio | AC trazables a GOV004-01–11; no sustituyen pruebas ni política productiva. |

## 15. Definition of Ready

- [x] Actor/valor y estados con fuente
- [x] Transiciones base y criterios trazables
- [x] Casos negativos funcionales con regla asignada
- [x] US-004-Q1 cerrada
- [x] Q3/Q5 resueltas y Q2/Q4 delimitadas para laboratorio
- [x] Dependencia identificada
- [x] Términos enlazados
- [x] Usuario aprobó respuestas Q1–Q5; no equivale a aceptación de entrega
- [ ] Antes de operación real: nombramientos efectivos por tenant/dominio
- [ ] Antes de producción: política de retención aprobada

## 16. Definition of Done (funcional)

- [ ] Criterios y transiciones aprobados probados
- [ ] Casos negativos cubiertos
- [ ] WCAG 2.2 AA revisada
- [ ] Clasificación y privacidad aprobadas
- [ ] PO acepta
- [ ] Cambios auditables según política aprobada

## 17. Preparación y validación

- **Estado:** READY para diseño/refinamiento de laboratorio; CONDITIONAL para operación real/producción
- **Motivo:** Q1–Q5 tienen base funcional aprobada, con AC verificables. No quedan preguntas bloqueantes del laboratorio; no se aprueba entrega productiva ni se considera pequeña la historia madre.
- **Bloqueos de entrega:** integrar con US-003, diseñar/dividir/estimar y verificar implementación. Nombramientos Q2 antes de operación real; política de retención Q4 antes de producción.
- **Propuesta de división (pendiente de validar):** versionado; revisión/publicación; deprecación/retiro. Reversión/suspensión pueden constituir un incremento separado conforme a GOV004-09. No se crean IDs ni historias nuevas por inferencia.
- **Siguiente rol o Skill:** UX y planificación, con Producto / Semantic Governance para validar división.
- **Decisión humana requerida:** validar división/alcance de primera entrega; designar personas reales y aprobar retención antes de sus gates operativos.
- **Validación:** respuestas Q1 y Q2–Q5 aprobadas por el usuario el 2026-10-17. Refinamiento actualizado, división pendiente; sin implementación ni aceptación visual/productiva y sin dar por implementado US-005.
