---
type: BusinessRulesCatalog
id: BRC-002
title: Gobierno y publicación del modelo semántico US-004
description: Decisiones humanas US-004-Q1–Q5 y condiciones de operación productiva.
status: draft
generated:
  by: af-business-rule-extractor
  at: 2026-10-17T14:08:14-05:00
sources:
  - id: BRC-001
    resource: /knowledge-base/business/rules/BRC-001-reglas-negocio-bi-analytics-v1-1.md
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
---

# BRC-002 — Gobierno y publicación del modelo semántico

## Objetivo y alcance

Registrar la respuesta aprobada a US-004-Q1 como entrada para requisitos, UX y
planificación. No implementa publicación, cálculo, IAM ni políticas legales.
El artefacto sigue draft: la aprobación funcional no equivale a verificación de
implementación ni aprobación de despliegue.

## Resultado

El usuario respondió «aprobado» a la propuesta de siete apartados inmediatamente
anterior en esta conversación, el 2026-10-17. Se acepta el conjunto siguiente,
incluida la ventana inicial de 30 días naturales. No se extiende a todas las
propuestas históricas de BRC-001 ni cierra US-005-Q1.

Actualización: el usuario aprobó también el conjunto Q2–Q5 en la siguiente
respuesta «aprobado» de esta conversación. GOV004-08–11 concretan y prevalecen
sobre las menciones anteriores a detalles pendientes. Quedan sin inventar los
nombramientos reales y la política legal/productiva de retención.

## Evidencia y trazabilidad

| ID | Hallazgo | Fuente / localizador | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-0014 | Usuario aprueba las siete respuestas propuestas para US-004-Q1: transiciones, responsables, controles, consulta por estado, cambios, compatibilidad y reversión/auditoría. | Conversación de trabajo US-004-Q1: respuesta «aprobado» inmediatamente posterior a la propuesta; transcripción funcional preservada en GOV004-01–07 de este documento. | decision | high |
| EVD-2026-0015 | Usuario aprueba respuestas Q2–Q5: asignaciones/delegaciones, autoridades y evidencias excepcionales, auditoría de laboratorio y gates concretos; mantiene nombramientos y retención productiva como condiciones operativas. | Conversación: «aprobado» inmediatamente posterior a la propuesta Q2–Q5, preservada en GOV004-08–11. | decision | high |
| EVD-2026-0016 | Usuario confirma opción A: modelo de un único dominio, dominio con varios modelos, selección de KPI del dominio y sus dependencias, sin creación automática de modelos. | Conversación: «Opcion A confirmada», posterior a propuesta de límite modelo/dominio. Regla preservada en GOV004-12. | decision | high |
| EVD-2026-0017 | Usuario aprueba captura explícita de definiciones y dependencias en borradores, actualización mediante acción y comparación previa, comparación de versiones sin cálculo ni publicación. | Conversación: «aprobado» inmediatamente posterior al diseño funcional de primera entrega; GOV004-13. | decision | high |

Evidencia compartida: `source_type: human`, `observed_at: 2026-10-17T13:43:32-05:00`
(hora de registro, no timestamp del mensaje), `freshness: current`,
`owner: Usuario solicitante; ejecución organizativa por Producto / Semantic Governance`.
No se infieren nombres de personas ni designaciones organizativas.

EVD-2026-0015: `source_type: human`,
`observed_at: 2026-10-17T13:49:11-05:00` (hora de registro),
`freshness: current`, `owner: Usuario solicitante; ejecución por Producto / Semantic Governance`.

EVD-2026-0016: `source_type: human`, `observed_at: 2026-10-17T14:02:49-05:00`
(hora de registro), `freshness: current`, `owner: Usuario solicitante`.

EVD-2026-0017: `source_type: human`, `observed_at: 2026-10-17T14:08:14-05:00`
(hora de registro), `freshness: current`, `owner: Usuario solicitante`.

Como apoyo de la propuesta original, no como fuente de autoridad empresarial:
[SemVer](https://semver.org/) y
[dbt model versions](https://docs.getdbt.com/docs/mesh/govern/model-versions).
El plazo de 30 días es una decisión del producto, no un estándar externo.

## Reglas, dependencias e impactos

### GOV004-01 — Ciclo y revisión

Transiciones ordinarias: `draft → review`, `review → draft`,
`review → published`, `published → deprecated`, `deprecated → retired`.
Para solicitar revisión se requiere definición completa y validaciones
preliminares aprobadas. Rechazo, solicitud de cambios o retiro voluntario de
revisión regresan a draft con motivo obligatorio. En review no se edita contenido;
debe regresarse a draft. Cualquier modificación invalida aprobaciones previas.
Publicación exige aprobaciones sobre el mismo contenido revisado.

### GOV004-02 — Responsabilidades y segregación

Autor/Data Steward prepara y solicita revisión. Domain Owner aprueba significado,
fórmula, grano, unidad y uso de negocio. Semantic Governance valida consistencia,
contratos y evidencias y autoriza publicación. Seguridad interviene al cambiar
clasificación, acceso o exposición de datos sensibles. Publicación exige aprobación
funcional y de gobierno, sin autoaprobación del autor. Roles asignados explícitamente
por tenant y dominio; administrador técnico no obtiene aprobación funcional automática.
No se asignan aquí personas ni implementación de identidad; el mecanismo de
delegación se concreta en GOV004-08.

### GOV004-03 — Controles de publicación

Bloquear publicación si falta definición funcional, owner, fórmula, grano o unidad
de un KPI aplicable; referencias válidas a dimensiones, medidas, datasets y columnas;
linaje, clasificación o política de acceso; políticas declaradas de calidad/frescura;
comparación con versión anterior y clasificación del impacto (primera versión debe
declararse como tal); evidencia de revisión y aprobaciones vigentes.
Cuando una prueba de cálculo sea exigida antes de US-005, debe aportar evidencia
externa revisada. No presentar esa evidencia como ejecución automática del sistema.
Publicar una definición no certifica la calidad actual de datos ni ejecutabilidad.

### GOV004-04 — Consulta por estado y autorización

| Estado | Política aprobada |
|---|---|
| draft | Autor y colaboradores autorizados; sin consumo ordinario. |
| review | Revisores autorizados; sin consumo ordinario. |
| published | Consumo autorizado dentro de tenant y políticas del modelo/dataset. |
| deprecated | Consumidores existentes con advertencia; impedir nuevas asociaciones ordinarias. |
| retired | Sin nuevas ejecuciones; definición y auditoría históricas para consulta autorizada. |

Publicar nunca amplía permisos sobre datos subyacentes. La consulta histórica de
retired es lectura de definición/auditoría, no una excepción de ejecución de datos.
US-005 implementará el consumo de datos; US-004 define su contrato de disponibilidad.

### GOV004-05 — Inmutabilidad y versión funcional

Contenido publicado inmutable: congelar definiciones y referencias; cambios del
catálogo no alteran silenciosamente modelos publicados. Cada cambio requiere nueva
versión. MAJOR para fórmula, grano, unidad, significado, eliminación o ruptura de
contrato; MINOR para elementos opcionales compatibles; PATCH sólo para documentación
sin alterar significado, resultados ni contrato. Clasificación requiere revisión,
no se presupone automatización. La revisión técnica de concurrencia no es la versión
funcional MAJOR.MINOR.PATCH. Cambios de estado y auditoría no reescriben contenido.

### GOV004-06 — Deprecación y compatibilidad

Ventana inicial: 30 días naturales desde deprecación, ampliable por acuerdo con
responsables de consumidores. Deprecar requiere justificación, fecha prevista de
retiro y plan de migración. Aviso debe identificar versión, alternativa y fecha.
Retirar exige ventana cumplida y migración de consumidores conocidos confirmada,
o excepción explícita autorizada. Consumidores desconocidos/no migrados requieren
tratamiento explícito: ausencia de telemetría no prueba ausencia de uso.
No se ha aprobado acortar ordinariamente la ventana; incidentes se tratan en GOV004-07.

### GOV004-07 — Reversión, suspensión y auditoría

No sobrescribir ni borrar versiones problemáticas. Volver a una versión anterior
todavía habilitada exige autorización y registro; no migrar consumidores silenciosamente.
Ante incidente de seguridad, permitir suspensión inmediata del consumo, separada
del ciclo ordinario de deprecación. Registrar actor, tenant, fecha, versión,
transición, motivo, diferencias, evidencias y aprobaciones. Retención debe definirse
antes de despliegue productivo. Autoridad exacta, alcance y recuperación de suspensión
y excepciones de retiro se concretaron posteriormente en GOV004-09; no crear un
sexto estado de ciclo de vida por inferencia.

### GOV004-08 — Asignaciones y delegaciones (Q2)

Responsables por tenant y dominio, sin nombres ni roles fijos en código. Producto
junto con el responsable del dominio designa titulares y suplentes. Cada asignación
identifica usuario, rol, alcance, otorgante y vigencia. Delegación explícita,
temporal, auditada y sin subdelegación. El autor no puede aprobar su contenido aunque
tenga otros roles. Para el primer release, aprobación funcional y de gobierno por
dos personas distintas, ambas diferentes del autor. Sin responsable/suplente vigente
se bloquea publicación. Laboratorio permite identidades de prueba diferenciadas;
no representan nombramientos reales, exigidos antes de operar con datos reales.

### GOV004-09 — Operaciones excepcionales (Q3)

| Operación | Autoridad | Evidencia mínima |
|---|---|---|
| Volver a versión anterior habilitada | Domain Owner + Semantic Governance | Motivo, destino, compatibilidad y consumidores afectados. |
| Retiro excepcional sin condiciones ordinarias | Domain Owner + Semantic Governance; Seguridad ante riesgo de acceso/datos | Riesgo aceptado, impacto, avisos y tratamiento de consumidores. |
| Suspender por incidente | Seguridad inmediatamente | Identificador del incidente, motivo y alcance. |
| Reanudar | Seguridad + Semantic Governance; Domain Owner si afecta significado/resultados | Resolución del incidente y verificaciones satisfactorias. |

Suspensión no vence automáticamente: exige levantamiento explícito. No modifica
contenido ni crea un sexto estado. Ninguna excepción permite acceso entre tenants
ni elimina auditoría. Reversión no reactiva retired ni migra consumidores
silenciosamente; recuperar una retirada exige nueva versión y revisión. Autorizar
reversión no implica capacidad de ejecutarla en consumidores externos.

### GOV004-10 — Auditoría y retención (Q4)

Permisos de auditoría separados de edición: quien modifica modelos no altera su
historial. Lectura limitada por tenant y función para gobierno/Seguridad, acceso
acotado para responsables del dominio. Exportar requiere permiso explícito y
registro de la operación. Registrar identidad y referencias a evidencias, nunca
contraseñas, tokens, credenciales ni filas de negocio. Retención configurable por
política aprobada que abarque respaldos y evidencias. Conservación por investigación
impide borrado mientras esté vigente. Bloquear despliegue productivo sin política
de retención aprobada. No hay plazo legal universal aprobado.

Laboratorio local: conservar historial durante toda la prueba, sin purga automática,
con identidades y datos sintéticos. No extrapolar esta conservación a producción.

### GOV004-11 — Evidencia por control (Q5)

Cada control muestra resultado, responsable, fecha y versión exacta revisada;
cambiar contenido invalida aprobaciones. Las validaciones preliminares de revisión
comprueban completitud e integridad de referencias; la publicación además exige
el conjunto de controles y aprobaciones de GOV004-03 y esta tabla.

| Control | Evidencia |
|---|---|
| Completitud | Atributos obligatorios presentes y faltantes identificados. |
| Integridad | Componentes, datasets y columnas autorizados sin referencias rotas. |
| Significado | Revisión Domain Owner de definición, fórmula, grano y unidad. |
| Linaje | Origen y proceso declarado cuando corresponda. |
| Acceso | Clasificación/política explícitas; revisión Seguridad cuando aplique. |
| Calidad y frescura | Políticas declaradas, responsables y revisión; no certificación automática. |
| Compatibilidad | Comparación anterior, impacto y justificación MAJOR/MINOR/PATCH. |
| Aprobaciones | Identidades autorizadas, segregación y mismo contenido. |

KPI nuevos o cambios de fórmula, grano, unidad o lógica exigen prueba externa
revisada hasta disponer de US-005. Evidencia: entradas, esperado/obtenido, contexto
de datos, filtros, procedimiento reproducible, casos límite aplicables (nulos,
duplicados, denominador cero, límites temporales), autor, revisor y versión.
No incorporar filas de negocio al registro de auditoría: referenciar la evidencia
autorizada. Cambios sólo documentales sin efecto semántico no exigen repetir cálculo,
pero sí justificar clasificación. Validación estructural no prueba cálculo correcto.

### GOV004-12 — Límite de modelo y dominio (opción A)

Para el primer incremento, cada modelo pertenece a exactamente un dominio;
un dominio puede tener cero, uno o varios modelos. Cada modelo selecciona KPI de
ese dominio e incluye sus dependencias. No se crean modelos automáticamente al
crear dominios ni se agrupan varios dominios en un mismo modelo. Se conserva el
aislamiento por tenant y la autorización de referencias. Decisión aceptada mediante
EVD-2026-0016; no modifica fórmulas ni ejecuta consultas.

Esta decisión fija agrupación; la captura/actualización de borradores fue aprobada
después en GOV004-13. No aprueba por sí sola pantallas ni contratos API.

### GOV004-13 — Captura explícita del borrador

Primera entrega: crear un modelo y seleccionar KPI de su dominio; capturar sus
definiciones y dependencias en un borrador. Cambios posteriores del catálogo se
muestran sin incorporarlos automáticamente. Actualizar el borrador requiere acción
explícita y comparación previa. Comparar versiones no ejecuta fórmulas ni publica.
EVD-2026-0017 aprueba este diseño funcional, no la especificación escrita, el plan
detallado, contratos API, pantallas ni implementación que aún deben revisarse.

## Vacíos y preguntas abiertas

| Pregunta | Owner | Prioridad | Estado |
|---|---|---|---|
| US-004-Q2: asignaciones y delegaciones | Producto / Domain Owner / Semantic Governance | Alta | Definición funcional cerrada, GOV004-08. Nombramientos reales pendientes de operación. |
| US-004-Q3: autoridades y evidencias excepcionales | Semantic Governance / Seguridad / owner | Alta | Cerrada funcionalmente, GOV004-09. |
| US-004-Q4: retención y acceso de auditoría | Legal / Seguridad | Alta | Laboratorio resuelto, GOV004-10. Política productiva pendiente; bloquea producción. |
| US-004-Q5: evidencias y pruebas de cálculo | Domain Owner / Semantic Governance | Alta | Cerrada funcionalmente, GOV004-11; no demuestra ejecución de US-005. |

## Readiness y handoff

- Estado: **READY para diseño/refinamiento del laboratorio**; **CONDITIONAL para
  operación real/producción** por nombramientos y política de retención.
- Siguiente rol: UX y planificación de incrementos; validar división y alcance.
  No es autorización de implementación ni de despliegue.
- Precedencia: este registro concreta BR-008/015/018 y aspectos de BR-006/016/017
  exclusivamente para US-004. No aprueba otras políticas de BRC-001.
- Diferencia histórica explícita: BR-008 mencionaba consultas históricas de retired
  ambiguamente; GOV004-04 limita a definición/auditoría y prohíbe nuevas ejecuciones.

## Checklist de calidad

- [x] Fuentes y provenance registrados.
- [x] Decisión humana separada de propuestas y hechos de implementación.
- [x] Diferencias con el borrador histórico y vacíos visibles.
- [x] Casos negativos y límites considerados.
- [x] Aprobación de Q1 y Q2–Q5 registrada, sin extrapolación a producción.
