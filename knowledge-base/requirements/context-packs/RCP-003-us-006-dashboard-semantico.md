---
type: RequirementContextPack
id: RCP-003
title: Contexto del primer incremento de dashboard semántico US-006
description: Evidencia, propuesta de alcance y decisiones pendientes para US-006.
status: draft
generated:
  by: af-requirement-context-builder/1.0
  at: 2026-10-28T20:53:01-05:00
sources:
  - id: US-006
    resource: /knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md
  - id: US-005
    resource: /knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md
  - id: US-004-VERIFICATION
    resource: /docs/ux/us-004/verification.md
  - id: API-001
    resource: /knowledge-base/design/api-contracts/API-001-python-semantic-dashboard-api.md
  - id: BACKEND-README
    resource: /codebase/backend/README.md
  - id: PRD
    resource: /intents/PRD.md
---

# RCP-003 — Dashboard semántico

## 1. Metadata y pregunta de trabajo

- Producto: BI Analytics Platform. Responsable funcional: por confirmar.
- Pregunta: ¿cuál es el primer incremento útil de composición y consumo de dashboards sobre consultas semánticas autorizadas?
- Estado: borrador para validación; no autoriza implementación ni fija prioridad de release.

## 2. Objetivo y alcance

Permitir que un consumidor interprete una visualización basada en una consulta semántica autorizada y reutilizable (US-006 §2–5). El alcance de la historia incluye composición y visualización; excluye exportación salvo decisión posterior. Los roles, visualizaciones e interacciones del primer incremento están pendientes.

## 3. Resumen ejecutivo

Existe una primera entrega local de dashboards y consultas con datos sintéticos; US-006 sigue CONDITIONAL. El piloto PostgreSQL Gold de US-005 está en una rama separada y no se ha validado aquí contra PostgreSQL real. La publicación completa de US-004 sigue pendiente. No se debe confundir un fixture o borrador con un modelo publicado.

## 4. Registro de evidencia

| ID | Hallazgo | Fuente | Tipo | Confianza |
|---|---|---|---|---|
| DSH-E01 | Dashboard debe usar consulta semántica autorizada y reutilizable | US-006 §5 | Hecho documental | Alta |
| DSH-E02 | Roles, interacciones y primer release no están definidos | US-006 §12, US-006-Q1 | Vacío | Alta |
| DSH-E03 | Existe primera entrega funcional con SQLite y datos sintéticos | BACKEND-README, introducción y endpoints | Hecho documental | Alta |
| DSH-E04 | Modelos de US-004 cuentan con primera entrega, no publicación completa | US-004-VERIFICATION | Hecho documental | Alta |
| DSH-E05 | US-005 mantiene decisiones productivas abiertas | US-005 §12 y §17 | Hecho documental | Alta |
| DSH-E06 | Partir del dashboard local existente puede acotar el primer incremento | DSH-E01–E05 | Hipótesis | Media |

## 5. Hechos confirmados

- La historia contempla estados de carga, vacío y error sin especificación suficiente (US-006 §10).
- El backend documenta dashboards personales, widgets KPI y controles de acceso y versión (BACKEND-README, Endpoints); esto no demuestra cobertura completa de US-006.
- La conformidad del usuario en esta conversación se refiere al entorno local de prueba, no al alcance de US-006 ni a PostgreSQL Gold.

## 6. Supuestos e hipótesis

- El usuario eligió la opción 2: dashboard interactivo con KPI autorizados y filtros compartidos que actualizan varias visualizaciones. La descripción presentada incluía crear dashboard, añadir y retirar KPI, consultar valores y mostrar estados de carga, vacío y error; fechas y canal se mencionaron como ejemplos de filtros, sin aprobar una lista definitiva.
- Dirección funcional elegida por el usuario: combinar «Pulso del negocio» y «Exploración conectada». Se busca una vista ejecutiva con KPI y visualizaciones coordinadas por filtros, con acceso a contexto de confianza disponible. El usuario confirmó que seleccionar una barra o segmento del gráfico pueda filtrar el resto del dashboard, además de usar la barra de filtros. Eligió la opción 1: etiqueta visible y eliminable del filtro, selección resaltada, eliminación mediante etiqueta o nueva pulsación, acción «Limpiar filtros» e indicación «Este filtro no aplica» en visualizaciones incompatibles. La composición visual sigue por acordar; no se asume aprobada una implementación visual.
- Primer conjunto confirmado: tarjetas KPI y gráfico de barras por canal; filtros de fecha y canal. El propietario crea y edita su dashboard y los consumidores autorizados pueden consultarlo. El detalle de autorización, compartición y filtros múltiples permanece abierto; la composición visual sigue pendiente de referencia Stitch.
- Ventas/Ingresos netos sería un ejemplo de laboratorio, no una restricción del producto ni una definición empresarial aprobada.
- La elección de tipos de gráficos, filtros, permisos y persistencia queda abierta; no se asumen como aprobados.

## 7. Vacíos y preguntas abiertas

| ID | Pregunta | Destinatario | Prioridad / estado |
|---|---|---|---|
| DSH-Q1 | ¿Quién crea, edita y consume dashboards y bajo qué permisos? | Producto / Seguridad | Alta / abierta |
| DSH-Q2 | ¿Qué visualizaciones, filtros e interacciones integran el primer incremento? | Producto / usuarios | Alta / abierta |
| DSH-Q3 | ¿Se prioriza laboratorio con KPI existentes o consumo de modelos publicados? | Producto / gobierno semántico | Alta / abierta |
| DSH-Q4 | ¿Qué estados y metadatos deben mostrarse al consumidor? | Producto / UX | Alta / abierta |
| DSH-Q5 | ¿Qué pantalla Stitch exacta corresponde al recorrido aprobado? | Producto / UX | Alta / abierta |

## 8. Actores, procesos, datos y dependencias

- Actores: creador y consumidor, con roles específicos por confirmar.
- Flujo propuesto: seleccionar KPI autorizado → componer dashboard → consultar y revisar resultado y contexto. Estados y reglas por acordar.
- Datos: dashboard, widgets, referencia a KPI y versión, filtros y metadatos de confianza disponibles.
- US-006 declara dependencias US-004 y US-005; determinar qué subconjunto permite laboratorio frente a publicación real.

## 9. Restricciones y riesgos funcionales

- Mantener aislamiento y permisos existentes; no afirmar calidad, frescura o linaje no evaluados (US-005 §5–6).
- No acceder directamente a tablas físicas desde la visualización (US-006 §4).
- La referencia visual Stitch exacta y su HTML deben consultarse antes de cualquier implementación de interfaz, conforme a AGENTS.md.
- No atribuir al piloto sintético capacidad productiva ni aprobación de gobierno.

## 10. Decisiones y validación humana

| Decisión | Responsable | Evidencia | Estado |
|---|---|---|---|
| Continuar preparación del primer incremento US-006 y comprobar el piloto | Usuario de esta conversación | Mensaje «proceed» | Confirmada para preparación |
| Elegir opción 2: dashboard interactivo con KPI autorizados y filtros compartidos | Usuario de esta conversación | Respuesta «COnforme con Opcion 2», 2026-10-28 | Confirmada como alcance inicial; detalle pendiente |
| Combinar «Pulso del negocio» y «Exploración conectada» | Usuario de esta conversación | Respuesta «Pulso del negocio + Exploración conectada», 2026-10-28 | Dirección confirmada; detalle de interacción y diseño pendiente |
| Seleccionar una barra o segmento del gráfico para filtrar el resto del dashboard | Usuario de esta conversación | Respuesta «si», 2026-10-28 | Confirmada; detalles de comportamiento pendientes |
| Filtro visible y reversible, limpiar filtros e indicar visualizaciones incompatibles | Usuario de esta conversación | Respuesta «conforme con opcion 1», 2026-10-28 | Confirmada para primer incremento; combinación de múltiples selecciones no acordada |
| Tarjetas KPI, barras por canal, filtros de fecha y canal; propietario crea/edita y consumidores autorizados consultan | Usuario de esta conversación | Respuesta «si» a la propuesta, 2026-10-28 | Confirmada; reglas detalladas de autorización y combinación pendientes |
| Dashboard personal con lectura compartida: propietario crea/edita y comparte con usuarios autorizados para consulta; invitados sin edición; acceso limitado al tenant y KPI autorizados para cada consumidor | Usuario de esta conversación | Respuesta «ok» a opción 1 de permisos, 2026-10-28 | Confirmada funcionalmente; asignación técnica y experiencia ante KPI no autorizado pendientes |
| Fecha y canal se combinan; una única selección de canal se sincroniza entre gráfico y barra, y elegir otro canal reemplaza el anterior | Usuario de esta conversación | Respuesta «opcion 1» a combinación de filtros, 2026-10-28 | Confirmada; valores predeterminados y limpieza pendientes |
| «Limpiar filtros» restaura el período inicial configurado del dashboard y todos los canales; el período inicial debe estar respaldado por configuración o datos disponibles | Usuario de esta conversación | Respuesta «1» a opciones de limpieza, 2026-10-28 | Confirmada; falta definir cómo se configura el período inicial |
| Ocultar KPI no autorizados al invitado; si no hay ninguno autorizado, mostrar estado vacío sin revelar cuáles existen | Usuario de esta conversación | Respuesta «1» a opciones de acceso a KPI, 2026-10-28 | Confirmada; texto y configuración técnica pendientes |
| El propietario selecciona un rango inicial explícito al crear o editar el dashboard; se usa al abrirlo y al limpiar filtros | Usuario de esta conversación | Respuesta «1» a opciones de período inicial, 2026-10-28 | Confirmada; validaciones y comportamiento ante rango sin datos pendientes |
| Conservar el período sin datos y mostrar «Sin datos para este período» en visualizaciones afectadas; rechazar fecha inicial posterior a fecha final | Usuario de esta conversación | Respuesta «1» a opciones de período sin datos, 2026-10-28 | Confirmada; límites adicionales y textos de error pendientes |
| Fallo aislado: conservar disponibles las visualizaciones exitosas, mostrar error en la afectada y permitir su reintento | Usuario de esta conversación | Respuesta «1» a opciones de fallo parcial, 2026-10-28 | Confirmada; mensajes y detalles de reintento pendientes |
| Cambiar las fechas conserva el canal seleccionado; si la combinación no devuelve datos se mantiene la selección y se muestra el estado sin datos | Usuario de esta conversación | Respuesta «1» a opciones de cambio de período, 2026-10-28 | Confirmada |
| El propietario comparte con personas concretas autorizadas de su tenant y puede retirarles el acceso | Usuario de esta conversación | Respuesta «1» a opciones de compartición, 2026-10-28 | Confirmada; directorio de identidades y selección por verificar |
| La revocación se comprueba y aplica en la siguiente solicitud o recarga; no se afirma retirada inmediata del contenido ya mostrado | Usuario de esta conversación | Respuesta «1» a opciones de revocación, 2026-10-28 | Confirmada |
| Generar diseño visual en Google Stitch para el incremento | Usuario de esta conversación | Solicitud explícita, 2026-10-28 | Autorizada; diseños sujetos a revisión humana |
| Dashboards legados compartidos con todo el tenant pasan a privados; el propietario vuelve a compartirlos con personas concretas | Usuario de esta conversación | Respuesta a pregunta de migración, 2026-10-28 | Confirmada; preservar contenido y registrar cambio de acceso |
| Usar directorio sintético de laboratorio para seleccionar personas del mismo tenant en el primer incremento | Usuario de esta conversación | Respuesta a pregunta de fuente de identidad, 2026-10-28 | Confirmada para laboratorio; integración con directorio real fuera del incremento |
| Usar en el laboratorio los permisos existentes del catálogo por tenant y scope; posponer autorización individual por KPI | Usuario de esta conversación | Respuesta a pregunta sobre política de KPI, 2026-10-28 | Confirmada solo para laboratorio; no valida la política productiva |
| Aprobar los diseños generados y excluir las variantes móviles de estados de excepción del incremento | Usuario de esta conversación | «ignoran en este incremente las variantes mobile. Apruebo los diseño», 2026-10-28 | Aprobada; discrepancias de archivos y reglas funcionales documentadas en docs/ux/us-006/README.md no quedan resueltas por la aprobación |
| Alcance, roles y experiencia del incremento | Producto / usuario | DSH-Q1–Q5 | Pendiente |
| Validación de este pack | Producto / usuario | RCP-003 | Pendiente |

## 11. Knowledge Candidates con provenance

| Candidato | Provenance | Verificador | Estado |
|---|---|---|---|
| Reutilizar el dashboard local como punto de partida | BACKEND-README; DSH-E06 | Producto / UX | Propuesta pendiente |

## 12. Handoff para el siguiente rol

Producto y UX deben resolver DSH-Q1–Q5; luego refinar la historia y criterios negativos, consultar Stitch y preparar diseño y plan. QA debe contrastar el alcance elegido con los recorridos existentes. La prueba del piloto Gold y su integración siguen separadas de la aceptación de US-006.
