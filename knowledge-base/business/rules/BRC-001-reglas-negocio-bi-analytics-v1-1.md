---
type: BusinessRulesCatalog
id: BRC-001
title: Catálogo de reglas de negocio - BI Analytics Platform v1.1
description: Reglas funcionales candidatas derivadas del PRD, RCP-001 y propuestas del usuario; requieren validación humana.
status: draft
generated:
  by: agent/gpt-6
  at: 2026-10-16T01:15:43-05:00
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opción A
    version: 1.1
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
    title: Contexto de requisitos - BI Analytics Platform v1.1
related:
  - /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
---

# Catálogo de reglas de negocio - BI Analytics Platform v1.1

## Objetivo y alcance

Extraer reglas funcionales candidatas sobre definiciones semánticas, modelos/KPI, datasets, consumo, autorización y aislamiento multitenant para BI Analytics Platform v1.1. El catálogo sirve como insumo para validación funcional y refinamiento de requisitos.

Incluye reglas explícitas del PRD, inferencias señaladas y propuestas funcionales aportadas por el usuario en la actualización del 2026-10-16. No define arquitectura técnica ni tecnología. Las nuevas propuestas de gobierno, permisos, calidad y residencia permanecen pendientes de aceptación por los owners correspondientes. El PRD y el RCP están en estado borrador; por tanto, este catálogo no constituye aprobación de negocio.

## Resultado

Se documentan 21 reglas candidatas. Las propuestas del usuario precisan roles de ownership, validación/publicación, transiciones y compatibilidad de versiones, manejo de calidad/frescura, excepciones, alcance global, uso de IA y retención/residencia. También proponen criterios para elegir dominios y workloads del primer release. Estas aportaciones se registran con provenance humano, pero siguen pendientes de aprobación formal; faltan umbrales numéricos, nombres de dominios iniciales y política legal de retención/residencia. Estado: **CONDITIONAL**.

## Registro de evidencia y trazabilidad

Fecha de observación: 2026-10-16. Las ubicaciones apuntan a secciones estables de los documentos fuente.

| ID | Hallazgo respaldado | Fuente / localizador | Clasificación | Confianza | Frescura | Owner de confirmación |
|---|---|---|---|---|---|---|
| EVD-2026-0001 | El contrato principal de consumo es la capa semántica gobernada; la ingeniería de datos la complementa cuando la semántica sola no es confiable o eficiente. | [PRD §1](/intents/PRD.md#1-resumen-ejecutivo) | Hecho documental | Alta | Actual | Responsable funcional pendiente |
| EVD-2026-0002 | La observación del esquema de una fuente no se convierte automáticamente en definición de negocio. | [PRD §9.1, Source Connectivity](/intents/PRD.md#9-límites-de-bounded-contexts) | Hecho documental | Alta | Actual | Source Connectivity / Semantic Governance (roles por confirmar) |
| EVD-2026-0003 | Medallion es opcional; el PRD enumera criterios de uso y casos en que no debe crearse. | [PRD §§10.1–10.4](/intents/PRD.md#10-estrategia-medallion-opcional) | Hecho documental | Alta | Actual | Data Engineering / responsable funcional (pendientes) |
| EVD-2026-0004 | Cada dataset Medallion debe declarar owner, esquema, partición, retención, clasificación, calidad mínima, freshness, lineage y política de tenant. | [PRD §10.5](/intents/PRD.md#105-reglas-de-calidad) | Hecho documental | Alta | Actual | Data Engineering / gobierno de datos (pendientes) |
| EVD-2026-0005 | KPI publicados deben incluir identificador, definición, fórmula, unidad, grano, filtros, casos límite, owner, versión/vigencia, lineage, acceso/clasificación, freshness y calidad. | [PRD §11.3](/intents/PRD.md#113-kpi) | Hecho documental | Alta | Actual | Owner de dominio / Semantic Governance (pendientes) |
| EVD-2026-0006 | Los modelos semánticos tienen estados draft, review, published, deprecated y retired. | [PRD FR-004, §14](/intents/PRD.md#14-requisitos-funcionales) | Hecho documental | Alta | Actual | Responsable funcional / Semantic Governance (pendientes) |
| EVD-2026-0007 | El modelo semántico debe proporcionar frescura, calidad y lineage al resolver consultas; los consumidores incluyen dashboards, API, exportaciones e IA autorizada. | [PRD FR-005/006/010, §§4 y 19](/intents/PRD.md#14-requisitos-funcionales) | Hecho documental | Alta | Actual | Producto / Semantic Governance (pendientes) |
| EVD-2026-0008 | Tenant es límite de seguridad; el contexto debe proceder de identidad autorizada, y las políticas aplicarse en consulta o capa equivalente verificable. | [PRD §§5 y 13.1–13.2](/intents/PRD.md#13-aislamiento-multitenant) | Hecho documental | Alta | Actual | Seguridad / responsable de identidad (pendientes) |
| EVD-2026-0009 | Cachés, materializaciones, exports, archivos, logs, jobs, colas, catálogo y lineage requieren alcance tenant; se exigen pruebas negativas y auditoría. | [PRD §13.2](/intents/PRD.md#132-controles-obligatorios) | Hecho documental | Alta | Actual | Seguridad / arquitectura (pendientes) |
| EVD-2026-0010 | IA sólo puede explorar modelos, documentos y datos autorizados; no puede redefinir ni publicar KPI sin pasar por gobierno. | [PRD §§2.3, 5, 13.3, FR-010 y §19](/intents/PRD.md#13-aislamiento-multitenant) | Hecho documental | Alta | Actual | Producto / Seguridad / Semantic Governance (pendientes) |
| EVD-2026-0011 | El PRD declara pendientes los NFR cuantificados, fuentes, workloads, responsables, políticas de residencia/retención y detalles de permisos/publicación. | [PRD §§2.2, 15 y 20; RCP §7](/intents/PRD.md#15-requisitos-no-funcionales-y-datos-faltantes) | Hecho documental (vacío) | Alta | Actual | Negocio / Seguridad / Arquitectura (por asignar) |
| EVD-2026-0012 | El RCP presenta owners/stewards y bounded contexts como roles funcionales, no como personas, equipos ni permisos organizacionales confirmados. | [RCP-001 §§8 y 10](/knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md) | Hecho documental | Alta | Actual | Responsable funcional pendiente |
| EVD-2026-0013 | El usuario propone respuestas para las 12 preguntas abiertas: responsabilidad/ownership, publicación y estados, calidad/frescura, resultados incompletos, excepciones, alcance global, cambios incompatibles, IA, retención/residencia y selección de MVP. | Solicitud del usuario sobre BRC-001, 2026-10-16 (tabla de respuestas propuestas en esta conversación) | Propuesta humana, no aprobada | Alta | Actual | Producto, owners de dominio, Seguridad y Legal, según el tema |

## Reglas de negocio candidatas

Todas las reglas mantienen estado **Propuesta / pendiente de validación**. “Regla derivada” identifica una inferencia operativa necesaria para expresar la intención documental; no agrega una política aprobada.

| ID | Regla candidata | Tipo | Evidencia | Condición / excepción / caso negativo |
|---|---|---|---|---|
| BR-001 | El significado oficial de una métrica consumida por productos debe provenir de una definición semántica gobernada; un dashboard no es fuente de verdad de esa métrica. | Explícita | EVD-2026-0001 | No declarar oficial una métrica local de visualización sin definición gobernada. La fuente no define el flujo para migrar métricas existentes. |
| BR-002 | Observar el esquema de una fuente permite registrar estructura técnica, pero no autoriza convertir esa observación en una definición de negocio. | Explícita | EVD-2026-0002 | Una columna o tabla recién detectada no se trata automáticamente como KPI, entidad o concepto aprobado. |
| BR-003 | Un dataset puede consumirse directamente cuando la fuente es gobernada y el caso no necesita preparación física adicional; no se debe duplicar por defecto. | Derivada de principios explícitos | EVD-2026-0001, EVD-2026-0003 | Si la fuente no es confiable/eficiente o existe criterio de preparación, evaluar ingeniería complementaria. “Gobernada” no tiene checklist definido. |
| BR-004 | Medallion sólo se activa para un dataset cuando existe una necesidad documentada, como replay/historización, CDC, calidad/reconciliación, reutilización, volumen/concurrencia, desacoplamiento o auditoría/retención. | Explícita | EVD-2026-0003 | No activar por simetría, taxonomía o para copiar una fuente pequeña, estable y gobernada sin beneficio. El responsable que acepta la justificación está pendiente. |
| BR-005 | Todo dataset Medallion declara owner, esquema, partición, retención, clasificación, calidad mínima, freshness esperada, lineage y política de tenant. | Explícita | EVD-2026-0004 | Si falta un atributo requerido, la fuente no define si se bloquea la ejecución o publicación; requiere decisión. |
| BR-006 | Un KPI no se considera publicable como definición gobernada mientras no declare los atributos mínimos listados por el PRD, incluido grano, fórmula, owner, vigencia, lineage, acceso, freshness y calidad. | Derivada de requisito explícito | EVD-2026-0005 | La fuente exige declarar atributos, pero no formaliza una validación automática ni el actor que autoriza publicación. |
| BR-007 | El grano de un KPI debe ser explícito y un cambio de grano no puede ocultarse bajo la misma definición sin registrar/versionar el cambio. | Explícita | EVD-2026-0005 | Se deben considerar cambios de fórmula y grano en el control de versiones; compatibilidad y migración de consumidores están por definir. |
| BR-008 | El ciclo propuesto es `draft → review → published → deprecated → retired`; una versión `published` no se modifica directamente y cada cambio crea una versión nueva. `Deprecated` permanece disponible durante una ventana de compatibilidad; `retired` no admite consultas nuevas salvo acceso histórico autorizado. | Estados base explícitos en PRD; transiciones y reglas de consumo propuestas por el usuario | EVD-2026-0006, EVD-2026-0013 | Propuesta pendiente. Definir duración de la ventana, política de consulta histórica, rollback y si se permiten transiciones excepcionales. |
| BR-009 | Una consulta semántica debe exponer metadatos de frescura, calidad y lineage. Los objetivos de calidad y frescura se definen por clase de dataset/KPI (`crítico`, `operativo`, `analítico`, `exploratorio`); los KPI críticos bloquean el consumo si fallan controles esenciales y los demás pueden advertir con consumo condicionado. | Primer enunciado explícito; clasificación y respuesta operativa propuestas por el usuario | EVD-2026-0007, EVD-2026-0013 | Propuesta pendiente. Los umbrales numéricos y qué controles son esenciales requieren aprobación del negocio. |
| BR-010 | Dashboards, API, exportaciones y asistentes IA consumen definiciones semánticas reutilizables mediante rutas autorizadas; visualization no accede directamente a tablas físicas sin una ruta autorizada. | Explícita | EVD-2026-0007 | Se admiten APIs/rutas autorizadas; el catálogo de consumidores y excepciones de operación queda pendiente. |
| BR-011 | Cada objeto y operación de negocio debe tener alcance explícito y la autorización debe resolver el tenant desde identidad autorizada. Taxonomías comunes, calendario corporativo, definiciones técnicas, metadatos de plataforma y políticas comunes pueden ser globales; su visibilidad no concede acceso a datos de tenants. | Aislamiento explícito en PRD; objetos globales propuestos por el usuario | EVD-2026-0008, EVD-2026-0013 | Propuesta pendiente. Definir quién declara el alcance global y cómo se revisa; separar visibilidad de metadatos de autorización a datos. |
| BR-012 | Ninguna lectura, escritura, consulta, exportación, trabajo, materialización, caché, log o contexto de IA puede exponer datos de otro tenant. | Explícita | EVD-2026-0008, EVD-2026-0009 | Incluye joins, agregaciones, archivos temporales, lineage y recuperación. Una autorización no resuelta debe denegar o restringir acceso; comportamiento exacto de error no especificado. |
| BR-013 | El grounding de IA se construye sólo después de resolver identidad, tenant, producto, rol y políticas de columna; sus citas deben referenciar artefactos autorizados. | Explícita | EVD-2026-0010 | No incluir contexto de otros tenants por defecto ni revelar sus nombres/valores. Permisos/roles concretos y políticas de redacción pendientes. |
| BR-014 | La IA puede explorar, explicar, proponer borradores y detectar candidatos a KPI; no puede publicar, modificar ni retirar KPI. Publicar requiere revisión del owner funcional, validación de Semantic Governance y controles de seguridad/calidad. | Límite de publicación explícito en PRD; capacidades y flujo propuestos por el usuario | EVD-2026-0010, EVD-2026-0013 | Propuesta pendiente. Aclarar cómo se etiquetan las sugerencias de IA y cómo se registra la revisión humana. |
| BR-015 | Cambiar fórmula, grano, unidad o contrato crea una nueva versión. La versión anterior permanece `published` o pasa a `deprecated` durante la ventana acordada; antes de retirarla se notifica a consumidores y se verifica su migración. | Versionado explícito en PRD; control de compatibilidad propuesto por el usuario | EVD-2026-0005, EVD-2026-0007, EVD-2026-0013 | Propuesta pendiente. Acordar ventana, criterios de incompatibilidad, comunicación y evidencia suficiente de migración. |
| BR-016 | Las decisiones de acceso y cambios de modelo deben ser auditables; lineage y catálogo sólo se muestran conforme a la autorización. | Explícita | EVD-2026-0009 | Retención, acceso a auditoría y campos mínimos del registro no definidos. |
| BR-017 | Producto coordina la validación del catálogo; el Domain Owner acepta el significado de negocio. Cada dominio tiene un Domain Owner y cada KPI/dataset tiene un Business Owner y un Data Steward. El Business Owner decide significado y uso; el Data Steward mantiene calidad, metadatos y documentación. | Propuesta del usuario | EVD-2026-0013 | Propuesta pendiente. Nombramientos concretos, delegación y relación entre Domain Owner y Business Owner requieren ratificación. |
| BR-018 | Para pasar de `review` a `published` deben estar completos la definición funcional, fórmula, grano, unidad, owner, lineage, clasificación, política de acceso, reglas de calidad/frescura, pruebas de consulta y análisis de impacto. Aprueba el Domain Owner; Semantic Governance puede rechazar por incumplimiento técnico o semántico. | Propuesta del usuario | EVD-2026-0013 | Propuesta pendiente. Definir evidencia y criterios de aceptación por cada control, incluidos controles de Seguridad. |
| BR-019 | Resultados obsoletos o incompletos de carácter crítico se bloquean o marcan explícitamente como no confiables. Los no críticos pueden consumirse con advertencia visible, timestamp y causa. Toda excepción requiere autorización, vencimiento y auditoría. | Propuesta del usuario | EVD-2026-0013 | Propuesta pendiente. Alinear la opción “bloquear o marcar no confiable” con cada clase y evitar que una marca permita consumo por defecto. |
| BR-020 | Una excepción o acceso de emergencia requiere justificación, alcance definido, duración limitada, aprobación de Seguridad y del owner del dato, auditoría y revocación automática al vencer. | Propuesta del usuario | EVD-2026-0013 | Propuesta pendiente. Definir mecanismo de aprobación, tratamiento de indisponibilidad del aprobador y retención del registro. |
| BR-021 | La retención, residencia y borrado se determinan por clasificación, tenant y jurisdicción. Como regla provisional no se transfieren datos fuera de una región autorizada; el borrado cubre datos derivados, cachés y archivos; auditoría se conserva por el período legal aprobado y las excepciones se documentan. | Propuesta del usuario | EVD-2026-0013 | Propuesta pendiente de aprobación de Legal/Seguridad. No hay jurisdicciones, períodos legales ni regiones autorizadas identificados todavía. |

## Dependencias e impactos

- Las responsabilidades Domain Owner, Business Owner, Data Steward, Producto y Semantic Governance se aportaron como propuesta; faltan ratificación de roles, nombramientos y reglas de delegación.
- La autorización de todos los consumidores depende de identidad, contexto tenant, políticas de fila/columna y controles equivalentes en almacenamiento derivado, exports, cachés, jobs e IA.
- Activar Medallion depende de una necesidad documentada por dataset y de que se asignen los metadatos obligatorios; sus umbrales cuantitativos están pendientes.
- Las propuestas distinguen controles críticos de los demás, pero carecen de umbrales numéricos, inventario de controles esenciales y política aprobada por clase.
- Las transiciones, compatibilidad y avisos de cambios afectan dashboards, API y agentes IA; falta acordar período de compatibilidad y evidencia de migración.
- Las propuestas de residencia, borrado y retención requieren la política legal aplicable por clasificación, tenant y jurisdicción.

## Supuestos e inferencias

| ID | Elemento | Clasificación | Tratamiento |
|---|---|---|---|
| A-001 | El RCP declara que un mismo modelo semántico puede consumirse por varios productos/experiencias. | Supuesto provisional documentado en RCP §6 | Validar límites de contrato y tenant antes de convertirlo en regla aprobada. |
| I-001 | Un KPI sin atributos mínimos no debería publicarse como definición gobernada. | Inferencia del agente a partir de “cada KPI publicado debe declarar” | Propuesta de interpretación; validar si faltantes bloquean publicación o admiten excepciones. |
| I-002 | Los estados distintos de `published` no deberían usarse como publicación vigente ordinaria, salvo el consumo transitorio propuesto para `deprecated` y la consulta histórica autorizada para `retired`. | Inferencia inicial, matizada por la propuesta del usuario | La ventana de compatibilidad y el acceso histórico se mantienen pendientes de aprobación. |
| I-003 | Ante identidad/tenant no resuelto, una solicitud no debe permitir acceso a datos. | Inferencia de seguridad coherente con el límite de tenant y contexto de identidad autorizada | Confirmar semántica de denegación y respuesta de error con Seguridad. |

Estas inferencias no se etiquetan como decisiones aprobadas ni sustituyen validación humana.

## Vacíos y preguntas abiertas

| Pregunta | Owner sugerido | Prioridad | Respuesta propuesta registrada | Estado |
|---|---|---|---|---|
| ¿Quién valida el catálogo y acepta cada regla? | Producto coordina; Domain Owner acepta negocio; Semantic Governance valida consistencia | Alta | Producto coordina; el owner funcional del dominio acepta definición; Semantic Governance verifica consistencia, versión, lineage y estándares. | Propuesta registrada; aprobación pendiente |
| ¿Quiénes son los owners/stewards? | Negocio / Producto | Alta | Domain Owner por dominio; Business Owner y Data Steward por KPI/dataset. Owner decide significado/uso; Steward mantiene calidad, metadatos y documentación. | Propuesta registrada; nombramientos pendientes |
| ¿Qué bloquea `review → published` y quién aprueba? | Domain Owner / Semantic Governance | Alta | Completar definición, fórmula, grano, unidad, owner, lineage, clasificación, acceso, calidad/frescura, pruebas de consulta e impacto. Aprueba Domain Owner; Semantic Governance puede rechazar por incumplimiento técnico o semántico. | Propuesta registrada; criterios/evidencias pendientes |
| ¿Qué transiciones son válidas? | Domain Owner / Semantic Governance | Alta | `draft → review → published → deprecated → retired`; no mutar `published`, cada cambio crea versión. Deprecated sigue durante ventana de compatibilidad; retired no admite consultas nuevas salvo histórico autorizado. | Propuesta registrada; ventana y reglas históricas pendientes |
| ¿Qué calidad y freshness se exige? | Business Owner / Data Steward / Producto | Alta | Definir por clase crítico, operativo, analítico o exploratorio. KPI críticos bloquean ante falla de controles esenciales; otros advierten y permiten consumo condicionado. Umbrales numéricos requieren aprobación de negocio. | Propuesta registrada; umbrales pendientes |
| ¿Qué ocurre con resultados obsoletos o incompletos? | Business Owner / Seguridad | Alta | Críticos: bloquear o marcar no confiable. No críticos: permitir con advertencia, timestamp y causa. Excepciones autorizadas, con vencimiento y auditoría. | Propuesta registrada; política por clase pendiente |
| ¿Cómo se autorizan excepciones y accesos de emergencia? | Seguridad + owner del dato | Alta | Justificación, alcance, duración limitada, aprobación de Seguridad y owner, auditoría y revocación automática al vencer. | Propuesta registrada; mecanismo pendiente |
| ¿Qué objetos pueden ser globales? | Producto / Tenant & Access Governance | Alta | Taxonomías comunes, calendario corporativo, definiciones técnicas, metadatos de plataforma y políticas comunes. Visibilidad global no concede acceso a datos tenant; resolver el alcance de datos por separado. | Propuesta registrada; catálogo global pendiente |
| ¿Cómo se gestionan cambios incompatibles? | Semantic Governance / consumidores | Alta | Fórmula, grano, unidad o contrato nuevo crean versión; versión anterior sigue published o deprecated durante ventana acordada. Avisar consumidores y verificar migración antes de retirar. | Propuesta registrada; ventana y compatibilidad pendientes |
| ¿Puede la IA crear KPI? | Producto / owner funcional / Semantic Governance | Media | Puede proponer borradores o detectar candidatos; no puede publicar, modificar ni retirar. Publicación requiere revisión de owner, validación semántica y controles de seguridad/calidad. | Propuesta registrada; flujo de revisión pendiente |
| ¿Qué retención, residencia y borrado aplicar? | Legal / Seguridad / negocio | Alta | Política por clasificación, tenant y jurisdicción; no transferir fuera de región autorizada; borrar derivados, cachés y archivos; retener auditoría por período legal aprobado y documentar excepciones. | Propuesta provisional; aprobación legal pendiente |
| ¿Qué fuentes, dominios y workloads representan el primer release? | Producto + Negocio | Alta | Elegir un dominio operacional con datos actuales y otro histórico/agregado que justifique preparación. Incluir dashboards, ad hoc, refresh programado, exportación e IA gobernada; aprobar selección según volumen, criticidad y valor. | Criterios propuestos; dominios y workloads por seleccionar |

## Riesgos

- Interpretar el borrador como política aprobada puede llevar a imponer controles o flujos que el negocio todavía no ha validado.
- Las propuestas sobre roles, permisos de publicación, excepciones y residencia pueden confundirse con acuerdos vigentes si no se aceptan por los responsables designados.
- Sin owners, estados de publicación y permisos explícitos, los KPI pueden quedar sin autoridad funcional o con aprobaciones ambiguas.
- Sin objetivos de calidad/frescura y NFR, no puede definirse de forma consistente cuándo un resultado debe bloquearse o cuándo se justifica preparación física.
- Si el aislamiento se aplica sólo en interfaz o consultas primarias, las rutas indirectas (cachés, exports, jobs, logs, IA y recuperación) pueden filtrar datos.
- Si IA se interpreta como autorizada sólo por tener acceso técnico a un modelo, puede eludir el contexto tenant/rol o exponer citas no autorizadas.

## Readiness y handoff

- **Estado:** CONDITIONAL
- **Siguiente rol / Skill:** responsable funcional y owners de dominio para validar reglas y resolver vacíos; luego `af-user-story-refiner` para convertir reglas validadas en historias trazables.
- **Decisión humana requerida:** confirmar si se aceptan estas propuestas; nombrar Domain Owners, Business Owners y Data Stewards; aprobar evidencia de publicación, ventanas de compatibilidad, políticas de calidad/frescura, excepciones y residencia/retención. Definir dominios/workloads reales del primer release.
- **No se registra aprobación ni verificación humana.**

## Checklist de calidad

- [x] Fuentes y provenance registrados.
- [x] Hechos documentales separados de supuestos e inferencias.
- [x] Contradicciones y vacíos visibles; no se encontraron contradicciones directas entre las fuentes revisadas.
- [x] Casos negativos y límites considerados, sin inventar respuestas no respaldadas.
- [ ] Validación humana registrada.

