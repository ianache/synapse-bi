---
type: RequirementContextPack
id: RCP-004
title: Acceso real y autorización por KPI para dashboards US-006
description: Contexto funcional y decisiones pendientes para el incremento posterior al laboratorio de US-006.
status: draft
generated:
  by: af-requirement-context-builder/1.0
  at: 2026-10-30T00:51:11-05:00
sources:
  - id: RCP-003
    resource: /knowledge-base/requirements/context-packs/RCP-003-us-006-dashboard-semantico.md
  - id: US-006
    resource: /knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md
  - id: US-005
    resource: /knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md
  - id: US-004
    resource: /knowledge-base/requirements/user-stories/US-004-versionar-y-publicar-modelo-semantico.md
  - id: KEYCLOAK-DATABASE
    resource: https://docs.redhat.com/en/documentation/red_hat_build_of_keycloak/26.6/html/server_configuration_guide/db-
  - id: PLAN-US-006
    resource: /docs/superpowers/plans/2026-10-28-us-006-interactive-dashboard-plan.md
---

# RCP-004 — Acceso real y autorización por KPI para US-006

## 1. Metadata y pregunta de trabajo

- Producto: BI Analytics Platform. Responsable funcional: por confirmar.
- Pregunta: ¿qué condiciones permiten compartir un dashboard con personas reales del tenant y mostrarles solamente los KPI cuyo acceso está autorizado?
- Estado: borrador para validación. No aprueba contratos, política productiva ni implementación.

## 2. Objetivo y alcance

El resultado buscado es que el propietario pueda autorizar lectura a personas concretas de su tenant, y que cada lector vea y consulte únicamente KPI permitidos. Se analizarán fuente de identidades, selección de destinatarios, evaluación de permisos, revocación, aislamiento y experiencia sin acceso. El uso productivo y las integraciones concretas requieren decisiones y validación adicionales. Exportación y nuevas visualizaciones no forman parte del alcance identificado.

## 3. Resumen ejecutivo del contexto

El incremento de laboratorio usa identidades sintéticas y permisos de catálogo por tenant y scope; la autorización individual por KPI y el directorio real quedaron para una entrega posterior (PLAN-US-006). El usuario indicó que la seguridad se integrará con Red Hat Keycloak 26.x, utilizando la misma base PostgreSQL del entorno y un esquema propio `keycloak`. Para el primer incremento local, las cuentas se administrarán directamente en Keycloak y solo el propietario del dashboard podrá conceder y retirar acceso a sus KPI. El despliegue productivo y el gobierno corporativo siguen por definir.

## 4. Registro de evidencia

| ID | Hallazgo | Fuente | Tipo | Confianza |
|---|---|---|---|---|
| ACC-E01 | Propietario comparte lectura con personas concretas del tenant; invitados no editan. | RCP-003 §10 | Decisión humana | Alta |
| ACC-E02 | Ocultar KPI no autorizados; si ninguno está autorizado, mostrar estado vacío sin revelar cuáles existen. | RCP-003 §10 | Decisión humana | Alta |
| ACC-E03 | Revocación aplicable en la siguiente solicitud o recarga. | RCP-003 §10 | Decisión humana | Alta |
| ACC-E04 | Directorio sintético y permisos tenant/scope son límites del laboratorio; permisos individuales quedan para después. | PLAN-US-006, puertas de decisión | Hecho documental | Alta |
| ACC-E05 | El consumo semántico depende de modelos y consultas autorizados. | US-006 §§7 y 11; US-005 | Hecho documental | Alta |
| ACC-E06 | La fuente de usuarios y la política individual requieren definición explícita. | RCP-003 §10; PLAN-US-006 | Vacío | Alta |
| ACC-E07 | Integrar seguridad con Red Hat Keycloak 26.x y la misma base PostgreSQL en esquema propio `keycloak`. | Instrucción del usuario, 2026-10-29 | Decisión humana | Alta |
| ACC-E08 | Red Hat build of Keycloak admite PostgreSQL y permite especificar el esquema mediante `db-schema`. | KEYCLOAK-DATABASE | Hecho documental | Alta |

## 5. Hechos confirmados

- El propietario puede conceder o retirar lectura a personas concretas; no se ha aprobado edición por invitados (ACC-E01, ACC-E03).
- Los KPI no autorizados no deben revelarse al invitado; la falta total de KPI tiene estado vacío seguro (ACC-E02).
- La concesión de dashboard y la autorización de KPI son condiciones distintas que deben respetarse juntas (ACC-E01–E02; inferencia funcional).
- Las decisiones de laboratorio no acreditan controles productivos (ACC-E04).

## 6. Supuestos e hipótesis

- El usuario eligió Keycloak 26.x como plataforma de seguridad; no se ha confirmado si los usuarios se gestionarán directamente allí o provendrán de un directorio federado (ACC-E07).
- Hipótesis: el permiso individual podría depender de atributos adicionales a persona y KPI; no hay regla aprobada.
- No se presupone configuración de realm, clientes, federación, permisos, jerarquía de roles ni plazo de sincronización de identidades.

## 7. Vacíos y preguntas abiertas

| ID | Pregunta | Destinatario | Prioridad | Estado |
|---|---|---|---|---|
| ACC-Q1 | ¿Keycloak gestionará personas directamente o se federará con un directorio? ¿Cómo se asignan tenants y estado de cuenta? | Identidad / Seguridad | Alta | Decisión para primer incremento: cuentas gestionadas directamente en Keycloak; gobierno corporativo y asignación de tenant quedan abiertos |
| ACC-Q2 | ¿Quién decide y dónde se mantiene el permiso por KPI: persona, grupo, rol u otra regla? ¿Cómo se resuelven conflictos y ausencia de política? | Producto / Seguridad / Gobierno | Alta | Decisión: autorización mantenida por BI; solo el propietario concede y retira permisos de KPI de su dashboard |
| ACC-Q3 | ¿La autorización comprende definición, resultados, versiones y metadatos, y cómo se controla cada ruta? | Seguridad / Gobierno / Arquitectura | Alta | Abierta |
| ACC-Q4 | ¿Qué pasa al desactivar una persona, cambiarla de tenant o retirar permisos, y qué latencia se acepta para esos cambios? | Identidad / Seguridad / Producto | Alta | Abierta |
| ACC-Q5 | ¿Qué workload, modelos publicados y fuente de consulta se usarán, y qué requisitos productivos de US-004/US-005 aplican? | Producto / Datos | Alta | Abierta |
| ACC-Q6 | ¿Cuál es el primer ambiente y quién acepta el incremento? | Producto / Operaciones | Alta | Abierta |
| ACC-Q7 | ¿Qué información mínima de auditoría, retención y diagnóstico está autorizada? | Seguridad / Operaciones | Media | Abierta |

## 8. Actores, procesos, datos y dependencias

- Actores: propietario, lector invitado, responsables de identidad, seguridad y gobierno semántico; asignaciones concretas por confirmar.
- Proceso: identificar persona del tenant → conceder lectura → comprobar acceso al dashboard y a cada KPI → consultar → retirar acceso o cambiar permisos. No se fija implementación.
- Datos: identificador de tenant, identidad, dashboard, concesión, KPI/versión y decisión de acceso; minimizar exposición de metadatos no autorizados.
- Dependencias funcionales: catálogo/modelo y consulta semántica de US-004/US-005; integración Keycloak 26.x en PostgreSQL con esquema `keycloak`; origen de usuarios y política de permisos aún por definir. El piloto Gold está separado y no se presume validado para producción. Confirmar la instancia/base PostgreSQL exacta y su compatibilidad antes de cualquier configuración.

## 9. Restricciones y riesgos funcionales

- No extrapolar personas, datos, scopes ni certificaciones sintéticas a producción.
- Evitar filtración de existencia, número, nombres, definiciones o resultados de KPI no autorizados; detallar superficies con Seguridad.
- Comprobar permisos también en solicitudes directas, no solo ocultando controles de interfaz. Los estados y errores deben evitar revelar recursos ajenos.
- No afirmar revocación instantánea de información ya mostrada; la decisión existente cubre la siguiente solicitud o recarga.
- Compatibilidad con datos y concesiones del laboratorio requiere análisis antes de cualquier migración; no se presupone su traslado.

## 10. Decisiones y validación humana

| Decisión | Responsable | Evidencia | Estado |
|---|---|---|---|
| Lectura individual, aislamiento tenant, ocultamiento de KPI no autorizados y revocación en siguiente solicitud | Usuario | RCP-003 §10 | Confirmada funcionalmente |
| Directorio sintético y scopes por tenant solo para laboratorio | Usuario | PLAN-US-006 | Confirmada para laboratorio |
| Exigir `catalog:read` junto con `queries:execute` para consultar y con `dashboards:write` para añadir un KPI | Usuario | Propuesta aceptada en esta conversación, 2026-10-29 | Confirmada para la política actual; autorización individual por KPI sigue pendiente |
| Integrar seguridad con Red Hat Keycloak 26.x, misma base PostgreSQL y esquema propio `keycloak` | Usuario | Instrucción de esta conversación, 2026-10-29 | Confirmada como restricción; laboratorio configurado, integración BI pendiente |
| Utilizar imagen comunitaria `keycloak/keycloak:26.8` de Docker Hub para el laboratorio | Usuario | Instrucción posterior de esta conversación, 2026-10-29 | Confirmada para laboratorio; no acredita soporte de Red Hat |
| Cerrar laboratorio e iniciar siguiente incremento | Usuario | Solicitud de esta conversación, 2026-10-29 | Inicio autorizado; política individual pendiente |
| Cuentas directas Keycloak; grants BI concedidos y retirados por propietario | Usuario | Conversación, 2026-10-30 | Confirmada para el incremento local |
| Grant asociado al dashboard; no se implementa autoridad central | Usuario | Diseño aprobado, 2026-10-30 | Confirmada para el incremento local |
| Política productiva, fuente corporativa y aceptación productiva | Producto / Seguridad / Identidad | ACC-Q1–Q7 | Pendiente |

## 11. Knowledge Candidates con provenance

| Candidato | Provenance | Verificador | Estado |
|---|---|---|---|
| Evaluar de manera separada acceso al dashboard y a cada KPI en todas las rutas de consulta y metadatos | ACC-E01–E02; inferencia | Seguridad / Arquitectura | Pendiente |

## 12. Handoff para el siguiente rol

Producto, Identidad y Seguridad deben resolver ACC-Q1–Q7 y validar alcance. Después, refinar requisitos y criterios de prueba, evaluar impacto en la arquitectura existente y preparar contratos y diseño. La aceptación funcional reportada para el laboratorio no equivale a aprobación de permisos productivos ni a cierre visual o integración técnica.
