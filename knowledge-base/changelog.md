---
title: Knowledge Base Changelog
status: draft
generated:
  by: agent/gpt-5
  at: 2026-10-16T01:15:43-05:00
---

# Changelog

## 2026-10-18

- El usuario (`human:ianache`) solicitó expresamente «aprobar ADR-019». Se registró `adr_status: Aceptado` y la decisión humana con fecha, manteniendo `status: draft`, sin añadir `verified`, justificar por el decisor ni cerrar detalles técnicos pendientes. Se sincronizaron índice de ADRs, índice de Knowledge Base, ASR-006 y su catálogo; la disposición del candidato ASR y los demás ADRs no se aprobaron. Se conserva el texto referido a Claude Design, sin sustituir el mandato vigente de fidelidad a Google Stitch. Sin cambios de implementación ni commit.

## 2026-10-17

- UX-US004-D01: usuario aprobó cinco correcciones acotadas respecto al export Stitch (sin Exportar, captura estable, sin umbral inventado, confirmación desmarcada y Ticket promedio consistente), conservando composición. No implica aceptación visual de implementación ni actualización verificada del export.
- Preparado plan de primera entrega US-004 con siete tareas TDD e interfaces explícitas, API-004 y DM-004 REQUIRES_REVIEW. Propuestos namespace/scopes nuevos, SQLite v5, preview/digest y concurrencia, representación Borrador N sin SemVer publicado y pruebas aisladas; decisiones técnicas pendientes de revisión del conjunto y selección de ejecución. Sin código, migración aplicada, permisos otorgados, nuevo worktree ni commit/push.

- A petición del usuario, generadas cuatro pantallas desktop US-004 en el proyecto Stitch existente: listado, creación/KPI/dependencias, detalle/historial y comparación/confirmación. Referencias y revisión en docs/ux/us-004/README.md. Creación corregida con ID al guardar y selector de dominio habilitado; correcciones DOM de listado/detalle reportadas por Stitch aún no reflejadas en HTML exportado. Diferencias documentadas, sin declararlas resueltas ni aceptar pantallas en nombre del usuario. Sin implementación, plan aprobado ni variantes móviles individuales.

- US-004: usuario aprobó captura explícita de definiciones/dependencias y actualización con comparación previa, sin sincronización automática; EVD-2026-0017/GOV004-13 y AC-20 registrados. Se escribió especificación de primera entrega en docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md para revisión. Propone dominio fijo, borrador vacío permitido y comprobación explícita del catálogo; esas decisiones de detalle no se dan por aprobadas. Sin plan detallado, pantallas nuevas, código ni commits.

- US-004 opción A confirmada: modelo de un único dominio, varios modelos por dominio, KPI del dominio y sus dependencias, sin creación automática. Registrados EVD-2026-0016/GOV004-12; IMD-002 incorpora MODELO_SEMANTICO (TRM-0020) y R-09 FACT sin modificar R-01–08. US-004 incorpora AC-19. Diseño del primer incremento, captura de dependencias y contratos aún no aprobados; sin implementación.

- US-004-Q2–Q5: usuario aprobó respuestas sobre asignaciones/delegaciones y segregación de tres identidades (autor y dos aprobadores distintos), reversión/retiro excepcional/suspensión/reanudación, auditoría y evidencia por gate. EVD-2026-0015 y GOV004-08–11 incorporados a BRC-002; se conservó la decisión previa Q1.
- US-004 refinada a 18 criterios Gherkin: READY para diseño/refinamiento de laboratorio, CONDITIONAL para operación real/producción. Q3/Q5 cerradas funcionalmente; Q2 requiere nombramientos reales antes de operar y Q4 política de retención antes de producción. Laboratorio conserva historial sin purga durante la prueba y utiliza identidades/datos sintéticos. Sin código, pantallas nuevas, implementación de US-005 ni autorización de despliegue; división de entregas pendiente.

- US-004-Q1: el usuario aprobó la propuesta de siete apartados de gobierno y publicación. Se creó BRC-002 con EVD-2026-0014, transiciones, segregación, gates, consulta por estado/tenant, contenido inmutable, versión funcional y compatibilidad inicial de 30 días; incluye principios de reversión, suspensión y auditoría. Se actualizó BRC-001 con precedencia acotada, sin aprobar las demás propuestas históricas.
- Se refinó US-004 con once criterios Gherkin y casos negativos; Q1 cerrada. Historia madre CONDITIONAL: Q2 asignaciones/delegaciones, Q3 operaciones excepcionales, Q4 retención/acceso de auditoría y Q5 evidencias concretas de gates. División en incrementos aún propuesta; sin código, pantallas, permisos reales ni implementación autorizada por esta actualización documental.

- Se sincronizó el índice GLS-001 con Dominio (TRM-0024) ya incorporado por D05, sin modificar definiciones existentes ni aprobar términos: 24 términos/0 errores; IMD-002 cuatro conceptos/ocho relaciones/0 errores/0 avisos. GQ-05 y los cuatro gaps previos permanecen abiertos.

- US-003: ejecución local autorizada por D07 y worktree aislado elegido por el usuario. Implementados catálogo de dominios/componentes/KPI declarativos, migración SQLite v4, referencias seguras, protección permanente/copia explícita, snapshots de dataset, permisos, idempotencia/versiones, formularios y navegación separada de fixtures publicados. Sin cálculo, publicación ni escritura en Gold.
- Evidencia previa a revisión final: backend 146 passed/1 skipped, frontend 66 passed, tipos/build, E2E US-003 2, fuentes 2, datasets 3, API analista 3 y smoke 7. Revisión independiente y repetición backend con PG opt-in en curso; no afirmar cierre hasta completar sus resultados. Guía manual y decisiones en docs/ux/us-003; trabajo permanece en rama feat/us-003-semantic-catalog, no fusionado.
- Cierre técnico posterior: revisión independiente READ-ONLY encontró 0 Critical, 2 Important y 1 Minor. Se corrigieron vínculo oculto al editar y refresh tras PUT confirmado mediante RED→GREEN. Resultado final backend 148 passed con PG real, frontend 70 passed con ejecución serial/15 s, tipos/build y 17 pruebas de navegador. Minor diferido: sinónimos en detalle protegido. Aceptación manual e integración pendientes; nada fusionado/publicado.

## 2026-10-15

- Se creó `RCP-001`, Requirement Context Pack para BI Analytics Platform v1.1, a partir de `intents/PRD.md`.
- Se separaron hechos, supuestos, hipótesis, vacíos y decisiones humanas pendientes.
- Se añadió índice inicial de Knowledge Base.
- Se creó ADR-019 para formalizar Atomic Design como estándar del Design System y una librería reutilizable de componentes con Claude Design.
- Se creó el catálogo ASR-001 a ASR-006 con candidatos potenciales y disposición humana pendiente.
- Se formalizaron ADR-001 a ADR-010 como archivos independientes a partir de la tabla de decisiones de Sprint 0 proporcionada por el usuario y el PRD.
- Los diez ADRs quedaron en estado `Propuesto`, con decisor y justificación humana pendientes; no se marcaron como aprobados ni verificados.

## 2026-10-16

- SEM-US003-D06: conformidad del usuario con diseño/plan y método nativo con revisión independiente final. Se prepararon API-003, DM-003 y recorrido UX para revisión de T1, con límites/DTO/scopes, replay/versiones, binding histórico, migración v4 y restore. Stitch generó el catálogo desktop `52fd5fb8a6254ff4bf1165579309bc9e` en el proyecto existente, sin editar pantallas anteriores. Contratos y pantallas nuevas no se marcan aprobados; faltan revisión y detalle visual de formularios/diálogo. Sin código, migraciones ni permisos efectivos modificados.

- A solicitud del usuario se preparó el plan de trabajo US-003 en `docs/superpowers/plans/2026-10-16-us-003-semantic-catalog-plan.md`, con ocho etapas T0–T7, archivos reales de integración, interfaces propuestas, ciclos RED/GREEN y pruebas de migración/restore, concurrencia, aislamiento, reintentos y UX. Se creó ledger independiente. Plan condicionado a revisión del diseño y contratos API-003/DM-003 aún por elaborar/aprobar; método de ejecución pendiente. No se modificó producto ni se ejecutaron nuevas pruebas funcionales.

- SEM-US003-D05: el usuario aceptó R-01 a R-08 con sus cardinalidades para el incremento local y autorizó incorporar Dominio. Se cerraron IM2-Q1/2, las relaciones pasan de inferencia a FACT local y se añadió TRM-0024 en draft, con definición/responsable pendientes de revisión (GQ-05). Se sincronizaron IMD-002, RCP-002, diseño e índice sin aprobar el diseño completo ni iniciar implementación. Validaciones: glosario 24 términos/0 errores; modelo cuatro conceptos/ocho relaciones/0 errores/0 avisos. Render visual Mermaid continúa pendiente.

- SEM-US003-D04: el usuario aprobó los mínimos de dominio/dimensión/medida, referencias existentes/autorizadas, pendientes de componentes visibles y protección/copia de dimensiones/medidas utilizadas. Se actualizaron decisiones y RCP-002 sin cerrar permisos ni completar la historia madre.
- Se preparó el diseño escrito de US-003 para revisión y el modelo conceptual IMD-002 (cuatro nodos, KPI como representación derivada). El diseño diferencia D01–D04 de propuestas adicionales sobre alcance, completitud, fórmula textual, vínculos históricos y permisos locales. IMD-002 mantiene cardinalidades inferidas y una pregunta de glosario; no se diseñó esquema físico ni se implementó producto.

- SEM-US003-D03: el usuario aprobó el catálogo reutilizable de dominios/dimensiones/medidas/KPI como base del diseño. Se actualizó RCP-002 y se abrió SEM-Q07 para la edición segura de componentes compartidos; protección/copia explícita es una propuesta, no una regla aprobada. Sin cambios de producto ni plan de implementación iniciado.

- SEM-US003-D02: el usuario confirmó borradores de KPI con nombre/dominio, fórmula/unidad/grano/responsable opcionales con faltantes visibles y referencias declaradas existentes/autorizadas. Guardar no valida ni publica. Se actualizó RCP-002 sin extrapolar la política a otros elementos; la organización de componentes y el diseño siguen en discusión. Sin cambios de código.

- SEM-US003-D01: el usuario confirmó un editor configurable de dominios y KPI propios, sin cambios de código para agregar definiciones. Ventas/Ingresos netos quedan como ejemplos, no valores fijos. Se actualizó RCP-002 y se resolvió SEM-Q01; borradores, roles, fórmulas, diseño y plan siguen pendientes. No se modificó producto ni se generaron pantallas externas.

- El usuario expresó conformidad con la validación local de US-002 y pidió continuar con US-003 (UX-US002-D04). Se registra la aceptación local sin extenderla a producción ni a políticas empresariales. Los ocho pasos de implementación de US-002 están cerrados en su ledger, con evidencia final de 84 pruebas backend con PostgreSQL, 50 frontend y la revisión independiente corregida.
- Se creó RCP-002 para iniciar descubrimiento de US-003: separa hechos, hipótesis, vacíos y decisiones; Ventas/Ingresos netos y la política de borradores semánticos son propuestas pendientes. No se implementó código ni se aprobaron fórmula empresarial, owners, permisos, diseño o plan de US-003.

- El usuario aprobó API-002 y DM-002 para el incremento local (UX-US002-D02). Se preparó el plan US-002 con ocho tareas, ciclos de prueba, dependencias y verificación integral. Pendiente revisión del plan y selección del método de ejecución; no se implementó producto ni se cambió el gate productivo.

- Se documentaron IMD-001 (registro conceptual de datasets), API-002 (contrato de creación, lectura y edición) y DM-002 (persistencia local propuesta con migración aditiva v3). Incorporan UX-US002-D01, la decisión humana de permitir borradores incompletos. Los diseños siguen draft/REQUIRES_REVIEW y el modelo conceptual CONDITIONAL; no se implementaron endpoints, migraciones ni nuevas políticas aprobadas.

- Se implementó el incremento local de US-001 con las cuatro pantallas de Stitch, registro PostgreSQL validado, cifrado de credenciales y observaciones técnicas históricas. SRC-001 documenta el contrato aditivo, revisión de seguridad, límites y pendientes productivos; permanece draft/REQUIRES_REVIEW sin aprobación de historias ni ADR.

- Se creó el caso de estudio PostgreSQL 18.6 en Docker Compose: esquema Gold retail con siete dimensiones, cuatro hechos, datos sintéticos deterministas, vistas sin fan-out, roles lectores y RLS por tenant. Se documentó en DM-001, sin aprobar ADR ni dar por implementado el conector US-001.

- Se implementó una primera API Python para catálogo, consultas semánticas y dashboards persistentes, con autenticación OIDC configurable y modo local explícito. Se añadió `API-001` como contrato borrador `REQUIRES_REVIEW`, sin aprobar ADR ni dar por completas las historias de producción.
- Se conectó opcionalmente el frontend mediante `VITE_DATA_SOURCE=api`; los cálculos iniciales usan registros sintéticos identificados como tales. Fuente empresarial, IdP real y políticas pendientes quedan registrados en API-001.

- Se refinaron FR-001 a FR-012 de PRD-BI-ANALYTICS-V1.1/RCP-001 en 12 User Stories independientes (US-001 a US-012), una por requisito funcional, con AC Gherkin, trazabilidad, INVEST, DoR y preparación.
- Las historias permanecen en `draft`/`CONDITIONAL`: RCP-001 y BRC-001 requieren validación humana; propuestas de BRC-001 no se trataron como reglas aprobadas. Se registraron preguntas de fuentes, owners, publicación, calidad/freshness, tenancy, workloads e IA.
- Se incorporó el índice de las historias en `knowledge-base/index.md`; no existía catálogo de historias previo que actualizar.
- Se creó `BRC-001`, catálogo borrador de reglas de negocio candidatas para BI Analytics Platform v1.1, con trazabilidad a `intents/PRD.md` y `RCP-001`.
- Se separaron reglas explícitas, inferencias y supuestos, y se registraron vacíos sobre owners, publicación, permisos, excepciones, calidad y freshness; requiere validación humana.
- Se amplió `BRC-001` con las 12 respuestas propuestas por el usuario, nueva evidencia humana `EVD-2026-0013` y reglas candidatas sobre ownership, publicación, lifecycle, calidad/frescura, excepciones, datos globales, IA y retención/residencia; todo permanece pendiente de aprobación.
- Se creó `GLS-001` con 23 fichas de términos de negocio derivadas de PRD v1.1, RCP-001 y BRC-001; KPI e IA incluyen referencias oficiales ISO.
- El glosario queda `CONDITIONAL` por definiciones pendientes sobre entidad de negocio, fuente gobernada, frescura y alcance de tenant; `glossary.py check` reportó 23 términos y 0 errores.
