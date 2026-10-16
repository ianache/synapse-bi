---
title: PRD — BI Analytics Platform v1.1, opción A
status: draft
version: 1.1
date: 2026-10-15
timezone: America/Lima
decisionStatus: ADR-011 propuesto; requiere validación del arquitecto responsable
sourceBasis:
  - Conversación «Analizar repositorio GitHub», recuperada el 2026-10-15
  - Alcance registrado: plataforma empresarial multiproducto y multitenant
  - Opción solicitada: BI semántica con ingeniería de datos complementaria
traceabilityNote: El cuerpo completo de PRD v1.0 no estaba disponible en el espejo local ni en la vista recuperada; la trazabilidad de cambios se expresa contra los temas y decisiones visibles de la conversación, no contra números de línea.
---

# PRD — BI Analytics Platform v1.1

## Opción A: plataforma BI semántica con ingeniería de datos complementaria

## 1. Resumen ejecutivo

BI Analytics Platform es una plataforma empresarial, multiproducto y multitenant para convertir datos operacionales y analíticos en modelos semánticos reutilizables, métricas gobernadas, dashboards, charts, KPI, ontologías, cubos y capacidades de exploración asistida por IA.

La opción A establece una prioridad explícita:

> El contrato principal de consumo es la capa semántica gobernada. La ingeniería de datos existe para preparar, validar, historizar y servir datos que la capa semántica no puede obtener de forma confiable o eficiente por sí sola.

Esto evita dos errores de diseño:

1. convertir una herramienta de dashboards en un data platform ilimitado antes de validar los casos de uso;
2. tratar la capa semántica como una simple vista sobre fuentes heterogéneas sin controles de calidad, historización, ownership o aislamiento por tenant.

La arquitectura propuesta no obliga a que todos los datos pasen por un pipeline Medallion. Medallion es una estrategia opcional, activada cuando aporta valor por volumen, latencia, historización, calidad, reutilización o desacoplamiento de fuentes. Para casos simples, la plataforma puede consumir una fuente gobernada directamente y publicar un modelo semántico sin duplicar innecesariamente los datos.

## 2. Estado del documento y alcance de revisión

### 2.1 Qué se revisó

La revisión se basa en los elementos disponibles de la conversación de origen:

- evolución de una PoC de DashboardStudio hacia una plataforma BI Analytics;
- alcance empresarial, multiproducto y multitenant;
- catálogo semántico, ontologías, modelos semánticos, cubos, KPI, dashboards y agentes IA;
- solicitud de evaluar críticamente una base analítica con patrón Medallion;
- selección de opción A: BI semántica con ingeniería de datos complementaria.

### 2.2 Qué no se pudo verificar

- texto íntegro del PRD v1.0;
- requisitos no funcionales aprobados, volúmenes, concurrencia, retención y ventanas de actualización;
- fuentes de datos concretas, contratos existentes y motores actualmente desplegados;
- decisiones previas numeradas y el contenido de ADR-001 a ADR-010;
- restricciones regulatorias o de residencia de datos por tenant.

Estos vacíos no se rellenan con suposiciones silenciosas. Se convierten en riesgos, preguntas abiertas o decisiones pendientes.

### 2.3 Fuera de alcance de v1.1

- convertir la plataforma en un reemplazo general de un lakehouse corporativo;
- ofrecer una copia física de todos los datos de todos los dominios;
- imponer una herramienta, nube o motor propietario sin evidencia de workloads;
- entrenar modelos fundacionales propios;
- permitir que un agente IA defina o publique métricas gobernadas sin aprobación;
- resolver por adelantado la residencia de datos cuando no exista una política empresarial validada.

## 3. Problema y oportunidad

La PoC de dashboards demuestra el valor de visualizar información, pero no resuelve por sí sola:

- semántica compartida entre productos y tenants;
- definición única y versionada de KPI;
- trazabilidad desde una métrica hasta su fuente;
- diferencias entre datos operacionales, datos históricos y datos analíticos;
- calidad, frescura y reconciliación;
- seguridad de fila, columna y dominio;
- reutilización de modelos entre dashboards, APIs, exportaciones y agentes IA;
- evolución controlada de ontologías y cubos.

La oportunidad es conservar la velocidad de la PoC y añadir una columna vertebral semántica gobernada, sin hacer que cada nuevo caso de uso requiera crear un pipeline físico completo.

## 4. Objetivos de producto

### 4.1 Objetivos de v1.1

1. Publicar un catálogo de fuentes, entidades, medidas, dimensiones, KPI y modelos semánticos.
2. Permitir que un modelo semántico sea consumido por dashboards, charts, KPI cards, consultas y agentes IA.
3. Separar claramente la definición de negocio de la implementación física de datos.
4. Soportar fuentes directas y datasets preparados mediante ingeniería de datos complementaria.
5. Aplicar aislamiento multitenant de forma consistente en metadatos, consultas, almacenamiento, cachés, exportaciones y observabilidad.
6. Hacer visible el lineage: fuente → dataset → entidad/medida → KPI → visualización o respuesta IA.
7. Incorporar calidad, frescura y estado de publicación al contrato del modelo semántico.
8. Mantener la plataforma extensible a ontologías, cubos y agentes sin convertirlos en dependencias obligatorias para un dashboard básico.

### 4.2 Resultados esperados

- menor duplicación de métricas y transformaciones;
- mayor coherencia entre productos y dashboards;
- menor riesgo de exposición cruzada entre tenants;
- capacidad de explicar de dónde proviene una métrica;
- incorporación progresiva de ingeniería de datos sólo donde los casos de uso lo justifiquen.

## 5. Principios de diseño

1. **Semántica antes que visualización.** Un dashboard no debe ser la fuente de verdad de una métrica.
2. **Gobernanza explícita.** Ownership, definición, unidad, granularidad, frescura, calidad y seguridad forman parte del contrato.
3. **Procesar sólo lo necesario.** No se crea una capa física por moda o simetría arquitectónica.
4. **Separar control plane y data plane.** Metadatos, catálogo, políticas y publicación no se mezclan con el procesamiento masivo de datos.
5. **Open by contract.** Los modelos y contratos deben poder sobrevivir a un cambio de motor.
6. **Tenant como límite de seguridad.** `tenant_id` no es sólo un filtro de interfaz.
7. **IA subordinada a la semántica gobernada.** La IA puede explicar y explorar; no puede redefinir silenciosamente una métrica publicada.
8. **Evidencia y reversibilidad.** Las decisiones de motor y materialización deben validarse con workloads representativos.

## 6. Evaluación crítica de supuestos

| ID | Supuesto implícito | Evaluación crítica | Estado | Acción |
|---|---|---|---|---|
| A-01 | Una capa semántica será suficiente para todos los casos | No siempre: joins complejos, historización, CDC, reconciliación y alto volumen requieren preparación física | Parcialmente válido | Mantener ingeniería complementaria como capacidad explícita |
| A-02 | Medallion debe ser la base de toda la plataforma | Sobre-generaliza un patrón de preparación; puede añadir coste, duplicación y latencia a fuentes pequeñas o confiables | Rechazado como regla universal | Usarlo de forma opcional y por caso de uso |
| A-03 | Los dashboards son el principal producto | Reduce el alcance; el mismo modelo debe servir APIs, exportaciones, alertas y agentes IA | Insuficiente | Hacer del modelo semántico el contrato de consumo |
| A-04 | Multitenancy se resuelve con un filtro `tenant_id` | Es insuficiente: hay metadatos, cachés, archivos, logs, claves, jobs y datos derivados | Riesgoso | Diseñar aislamiento por capas y pruebas negativas |
| A-05 | Un único motor sirve para ingesta, transformación, serving y metadatos | Puede generar acoplamiento y costes desproporcionados | No probado | Separar capacidades lógicamente; minimizar motores físicos hasta tener evidencia |
| A-06 | Ontologías y cubos deben estar completos en v1 | Eleva el riesgo de plataforma antes de validar el núcleo semántico | No recomendable | Entregar un núcleo de entidades, dimensiones, medidas y relaciones; ampliar por iteraciones |
| A-07 | La IA puede consultar cualquier dato disponible | Puede romper seguridad, definición de negocio y trazabilidad | Rechazado | La IA sólo consulta modelos y políticas autorizados |
| A-08 | La PoC es una base arquitectónica suficiente | La PoC prueba experiencia, no necesariamente seguridad, gobierno, escalabilidad o contratos | No probado | Reutilizar patrones de UX y componentes; revalidar límites de producción |
| A-09 | Un modelo dimensional resuelve toda la semántica | Dimensionalidad ayuda al serving, pero no modela por sí sola conceptos, sinónimos, reglas y ownership | Parcialmente válido | Combinar catálogo semántico, modelo dimensional y lineage |

## 7. Riesgos principales

| ID | Riesgo | Probabilidad | Impacto | Mitigación / decisión |
|---|---|---:|---:|---|
| R-01 | La capa semántica se convierte en lógica duplicada por dashboard | Alta | Alto | Prohibir definiciones locales de KPI publicados; validar consultas contra el modelo |
| R-02 | Medallion se implementa completo sin necesidad | Media | Alto | Activación por criterios; registrar coste y beneficio por dataset |
| R-03 | Fuga de datos entre tenants por joins, caché o exportación | Media | Crítico | Políticas centralizadas, aislamiento físico/lógico según tier y pruebas de autorización |
| R-04 | El motor elegido no soporta concurrencia o consultas ad hoc | Media | Alto | Benchmark con workloads reales y plan de salida por contrato SQL/modelo |
| R-05 | Definiciones de KPI incompatibles entre dominios | Alta | Alto | Ownership, versionado, glosario y proceso de publicación |
| R-06 | La IA genera respuestas plausibles pero no auditables | Alta | Alto | Retrieval sólo desde modelos autorizados, citas de lineage y registro de consulta |
| R-07 | Se asume frescura o disponibilidad no aprobada | Media | Alto | No fijar SLO no respaldados; declarar freshness por dataset y acordar objetivos |
| R-08 | Ontología demasiado ambiciosa retrasa el núcleo | Media | Medio | Implementar relaciones necesarias para casos priorizados; extender después |
| R-09 | Datos sensibles quedan expuestos en capas intermedias | Media | Crítico | Clasificación, minimización, tokenización/mascarado y controles por columna |

## 8. Arquitectura conceptual objetivo

### 8.1 Capas lógicas

1. **Fuentes y contratos de entrada**: APIs, bases transaccionales, archivos, eventos y conectores autorizados.
2. **Ingesta y preparación**: extracción, CDC, normalización, validación, deduplicación, historización y reconciliación cuando aplique.
3. **Catálogo y gobierno**: fuentes, datasets, entidades, definiciones, owners, clasificación, políticas, lineage y versiones.
4. **Modelo semántico**: dimensiones, medidas, KPI, relaciones, filtros, jerarquías, sinónimos y reglas de acceso.
5. **Serving analítico**: consultas, agregaciones, materializaciones y cachés bajo políticas de tenant.
6. **Experiencias**: dashboards, charts, KPI, exploración, alertas, exportaciones, APIs y agentes IA.

### 8.2 Control plane y data plane

**Control plane:** tenants, usuarios, roles, catálogo, glosario, modelos semánticos, versiones, políticas, lineage, publicación y auditoría.

**Data plane:** datos de entrada, datasets preparados, tablas analíticas, consultas, agregaciones, cachés y archivos derivados.

La separación permite que una actualización de un KPI se gobierne como cambio de metadatos y publicación, mientras que una recomputación física se ejecuta sólo cuando sea necesaria.

## 9. Límites de bounded contexts

Los bounded contexts se definen por lenguaje, ownership y reglas, no por tablas ni por pantallas. Una implementación puede agrupar varios contextos al inicio, pero no debe mezclar sus contratos.

| Bounded context | Responsabilidad | Posee | No posee | Contratos principales |
|---|---|---|---|---|
| **Source Connectivity** | Conectar y leer fuentes autorizadas | Conectores, credenciales referenciadas, estado de conexión, esquema observado | KPI, definiciones de negocio, dashboards | SourceRegistration, ConnectionHealth, SchemaObservation |
| **Data Engineering** | Preparar datasets cuando la capa semántica no basta | Jobs, transformaciones, checkpoints, calidad técnica, datasets preparados | Definición oficial de KPI y experiencia visual | DatasetContract, JobRun, DataQualityResult |
| **Semantic Governance** | Definir y publicar significado de negocio | Glosario, entidades, dimensiones, medidas, KPI, relaciones, owners, versiones y lineage lógico | Ejecución física de jobs y layout de dashboards | SemanticModel, MetricDefinition, Publication |
| **Analytical Serving** | Resolver consultas semánticas de forma eficiente | Planes, agregaciones, materializaciones y resultados temporales | Autoridad para cambiar el significado de una métrica | SemanticQuery, QueryResult, FreshnessStatus |
| **Visualization & Experience** | Componer y presentar análisis | Dashboards, charts, filtros, layouts, preferencias y permisos de presentación | Lógica canónica de KPI y acceso directo no gobernado a tablas | DashboardDefinition, VisualizationQuery |
| **AI Analytics** | Facilitar exploración y explicación | Prompts, sesiones, grounding, explicaciones, feedback y trazabilidad de respuestas | Definiciones, permisos o acceso fuera del modelo autorizado | AIQuery, GroundedAnswer, ExplanationCitation |
| **Tenant & Access Governance** | Aplicar aislamiento y autorización | Tenant, membresía, roles, políticas de fila/columna, claves y auditoría de acceso | Significado de las métricas | AccessPolicy, TenantScope, AccessDecision |

### 9.1 Reglas de integración entre contextos

- Visualization & Experience no consulta tablas físicas sin pasar por Analytical Serving o una API autorizada.
- AI Analytics no consulta fuentes directamente; recibe un modelo y un contexto autorizado.
- Semantic Governance referencia datasets y campos por contrato, pero no acopla el lenguaje de negocio al nombre físico de una tabla.
- Data Engineering puede publicar un dataset preparado, pero no puede publicar un KPI sin una definición semántica y un owner.
- Tenant & Access Governance debe ser invocable desde cada contexto que lea, materialice, exporte o almacene datos.

## 10. Estrategia Medallion opcional

### 10.1 Decisión de diseño

Medallion se adopta como patrón de preparación y trazabilidad para datasets que necesitan varias etapas de calidad, historización, replay, desacoplamiento o reutilización. No se adopta como una obligación para cada fuente o cada dashboard.

### 10.2 Capas

| Capa | Propósito | Puede contener | Consumidor autorizado |
|---|---|---|---|
| **Bronze / Raw** | Preservar el dato recibido y permitir replay | Payload original, metadatos de ingestión, versión de esquema, partición temporal | Data Engineering y operaciones; acceso restringido |
| **Silver / Conformed** | Normalizar, deduplicar, validar y conformar | Entidades limpias, claves técnicas, historización, resultados de calidad | Data Engineering y Semantic Governance |
| **Gold / Analytical** | Servir hechos, dimensiones, agregados o data marts | Modelos dimensionales y datasets optimizados | Analytical Serving y consumidores autorizados |

### 10.3 Cuándo usarlo

Activar Medallion cuando se cumpla uno o más de estos criterios:

- la fuente no es estable o debe poder reproducirse;
- se requiere CDC, replay o historización;
- varios modelos semánticos reutilizan el mismo dato conformado;
- existen reglas de calidad, conciliación o deduplicación no triviales;
- el volumen o la concurrencia justifican separar preparación y serving;
- se necesita desacoplar el ciclo de la fuente del ciclo del producto BI;
- existe una obligación de auditoría o retención que no conviene resolver en la fuente.

### 10.4 Cuándo no usarlo

No crear Bronze/Silver/Gold sólo para:

- una fuente pequeña, estable y ya gobernada;
- un dashboard de bajo riesgo que puede consultar un modelo semántico directo;
- copiar datos sin una necesidad de replay, calidad, rendimiento o ownership;
- satisfacer una taxonomía arquitectónica sin beneficio medible.

### 10.5 Reglas de calidad

Cada dataset Medallion debe declarar owner, esquema, partición, retención, clasificación, calidad mínima, freshness esperada, lineage y política de tenant. “Gold” no significa automáticamente “verdad de negocio”: la verdad de negocio se publica en Semantic Governance.

## 11. Modelos dimensionales

### 11.1 Rol

Los modelos dimensionales son una representación física o lógica para consumo analítico. No sustituyen el catálogo, el glosario, las reglas semánticas ni las políticas de acceso.

### 11.2 Convenciones

- **Hechos:** eventos o mediciones con grano declarado; ejemplo conceptual: `fact_sales_line` con grano “una línea de venta”.
- **Dimensiones:** entidades descriptivas conformadas; ejemplo: `dim_customer`, `dim_product`, `dim_date`, `dim_org`.
- **Medidas aditivas:** sumables en todas las dimensiones aplicables.
- **Medidas semi-aditivas:** sumables en algunas dimensiones, como inventario por fecha.
- **Medidas no aditivas:** ratios, porcentajes y promedios que deben expresarse como fórmula semántica.
- **Dimensiones lentamente cambiantes:** sólo cuando el análisis histórico requiera preservar versiones.
- **Grano:** obligatorio en el contrato del modelo; ningún KPI puede ocultar un cambio de grano.

### 11.3 KPI

Cada KPI publicado debe declarar al menos:

- identificador estable y nombre de negocio;
- definición y propósito;
- fórmula y componentes;
- unidad y moneda;
- grano y dimensiones válidas;
- filtros incluidos y excluidos;
- tratamiento de nulos, devoluciones y datos tardíos;
- owner y steward;
- versión, estado y fecha de vigencia;
- fuentes y lineage;
- políticas de acceso y clasificación;
- freshness y estado de calidad.

### 11.4 Ontologías y cubos

- La ontología describe conceptos, tipos, relaciones y sinónimos útiles para navegación y grounding.
- El cubo o modelo dimensional describe una forma de analizar hechos por dimensiones y jerarquías.
- Una ontología no debe convertirse automáticamente en tablas físicas.
- Un cubo no debe inventar conceptos que no estén gobernados en el catálogo.
- La primera versión debe soportar las relaciones necesarias para los dominios priorizados y no intentar modelar toda la empresa.

## 12. Selección de motores de almacenamiento y consulta

### 12.1 Decisión recomendada para v1.1

La plataforma debe minimizar el número de motores físicos y preservar contratos portables:

1. **Metadatos y control plane:** almacén transaccional relacional para tenants, catálogo, modelos, versiones, permisos y auditoría de control.
2. **Preparación opcional:** almacenamiento de objetos con formato de tabla abierto o equivalente cuando Medallion sea necesario.
3. **Serving analítico:** un motor SQL columnar/OLAP o warehouse existente, elegido mediante benchmark, para modelos Gold y consultas semánticas.
4. **Caché:** componente separado sólo si la evidencia de latencia/concurrencia lo justifica; nunca como fuente de verdad.
5. **Búsqueda semántica/vectorial:** capacidad complementaria para catálogo y grounding, no sustituto del motor analítico ni del control de acceso.

### 12.2 Criterios de selección

| Criterio | Pregunta de evaluación |
|---|---|
| Aislamiento | ¿Permite separar o filtrar tenants sin depender de convenciones frágiles? |
| SQL y semántica | ¿Expresa joins, ventanas, fechas, jerarquías y agregaciones requeridas? |
| Concurrencia | ¿Mantiene comportamiento aceptable para dashboards, exploración y cargas programadas? |
| Coste operativo | ¿Cuántos motores, jobs y habilidades exige mantener? |
| Portabilidad | ¿El modelo semántico evita depender de funciones propietarias? |
| Historización | ¿Permite datos tardíos, snapshots y reconstrucción cuando sean necesarios? |
| Observabilidad | ¿Expone planes, consumo, errores, frescura y lineage suficiente? |
| Seguridad | ¿Soporta seguridad de fila/columna, cifrado, auditoría y credenciales por tenant o dominio? |
| Evolución | ¿Permite cambiar la forma física sin romper el contrato semántico? |

### 12.3 Alternativas

| Alternativa | Ventaja | Coste/riesgo | Recomendación |
|---|---|---|---|
| Warehouse/OLAP existente | Menor tiempo de adopción y operación | Dependencia del proveedor y límites de workload | Preferida si ya existe y cumple aislamiento |
| Object storage + table format + query engine | Replay, desacoplamiento y flexibilidad | Más componentes y operación | Para datasets con necesidad Medallion real |
| Base relacional como único motor | Simplicidad inicial | Riesgo en volumen, concurrencia y analítica compleja | Sólo para PoC o cargas pequeñas verificadas |
| Motor especializado por producto | Optimización local | Fragmentación, duplicación y gobernanza difícil | Evitar en v1.1 salvo evidencia fuerte |

La selección concreta de producto queda pendiente de un benchmark con muestras representativas. El PRD fija la capacidad y los criterios, no inventa una marca como decisión arquitectónica.

## 13. Aislamiento multitenant

### 13.1 Modelo de tenancy

El tenant es un límite de seguridad y gobierno. Todo objeto de negocio debe tener un alcance explícito: global de plataforma, de producto, de tenant, de dominio o de usuario.

Se admiten tres estrategias físicas, seleccionables por tier y riesgo:

- **Compartido con aislamiento lógico:** tablas compartidas con políticas obligatorias de tenant; adecuado para datos de menor riesgo cuando el motor y las pruebas lo soporten.
- **Schema o base por tenant:** mayor aislamiento y personalización, con coste operativo superior.
- **Cuenta/proyecto/cluster por tenant:** aislamiento fuerte para tenants regulados o de alto riesgo, con mayor coste.

La estrategia no se decide sólo por tamaño. Debe considerar sensibilidad, residencia, personalización, ruido de vecinos, recuperación, coste y obligaciones contractuales.

### 13.2 Controles obligatorios

- contexto de tenant derivado de identidad autorizada, no de un parámetro confiado del cliente;
- políticas de fila/columna aplicadas en el punto de consulta o en una capa equivalente verificable;
- separación de claves y secretos según el nivel de aislamiento;
- cachés y materializaciones con clave compuesta por tenant y versión del modelo;
- exportaciones, archivos temporales y logs sin mezcla de tenants;
- jobs y colas con alcance de tenant explícito;
- lineage y catálogo filtrados por autorización;
- pruebas negativas para consultas, joins, agregaciones, exports, IA y recuperación;
- borrado, retención y restauración con alcance de tenant;
- auditoría de decisiones de acceso y de cambios de modelo.

### 13.3 IA y tenancy

Un agente IA no puede recibir un contexto que agregue tenants por defecto. El grounding debe construirse después de resolver identidad, tenant, producto, rol y políticas de columnas. Las citas de la respuesta deben apuntar a artefactos autorizados y no revelar nombres o valores de otro tenant.

## 14. Requisitos funcionales

| ID | Requisito |
|---|---|
| FR-001 | Registrar fuentes y observar sus esquemas sin convertir la observación en definición de negocio. |
| FR-002 | Registrar datasets directos y datasets preparados, con owner, clasificación, freshness y lineage. |
| FR-003 | Definir entidades, dimensiones, medidas, KPI, jerarquías, sinónimos y relaciones. |
| FR-004 | Versionar y publicar modelos semánticos con estado draft, review, published, deprecated y retired. |
| FR-005 | Resolver consultas desde el modelo semántico y devolver metadatos de frescura, calidad y lineage. |
| FR-006 | Componer dashboards y visualizaciones usando consultas semánticas reutilizables. |
| FR-007 | Permitir ingeniería de datos complementaria con ejecuciones, calidad, errores, reintentos y trazabilidad. |
| FR-008 | Activar Medallion por dataset cuando se cumplan criterios documentados. |
| FR-009 | Aplicar aislamiento por tenant a lectura, escritura, exportación, caché, IA, jobs y observabilidad. |
| FR-010 | Permitir exploración IA sólo sobre modelos, documentos y datos autorizados. |
| FR-011 | Registrar cambios de definición y distinguir cambio semántico de cambio físico. |
| FR-012 | Exponer un catálogo navegable y un glosario con ownership y estado de publicación. |

## 15. Requisitos no funcionales y datos faltantes

No se inventan valores numéricos en esta revisión. Antes de aprobar la arquitectura deben acordarse:

- volumen inicial y crecimiento por tenant;
- concurrencia de dashboards, exploración y refresh;
- freshness por clase de dataset;
- disponibilidad y recuperación;
- retención, residencia y clasificación;
- límites de exportación y consultas ad hoc;
- coste máximo o presupuesto por tenant;
- tiempos de publicación de modelos;
- objetivos de seguridad y auditoría.

La ausencia de estos datos bloquea la selección final de motor, el tier de aislamiento y cualquier promesa de rendimiento.

## 16. ADR-011 — BI semántica con ingeniería de datos complementaria

### Metadata

- **Estado:** Propuesto
- **Decisor:** `[PENDIENTE: arquitecto responsable]`
- **Autor del texto:** agente, a partir de la solicitud del usuario y la conversación recuperada
- **Fecha:** 2026-10-15
- **Relacionado con:** PRD BI Analytics Platform v1.1, opción A

### Contexto

La plataforma debe evolucionar desde una PoC de dashboards hacia una capacidad empresarial multitenant con catálogo semántico, ontologías, cubos, KPI, dashboards y agentes IA. Una capa semántica directa acelera el valor, pero puede ser insuficiente para historización, CDC, calidad, reconciliación, reutilización y rendimiento. Un patrón Medallion completo puede resolver algunos de esos problemas, pero también puede introducir duplicación, coste, latencia y complejidad sin necesidad.

### Problema

¿Cómo debe organizarse la arquitectura de datos para que la semántica de negocio sea reutilizable y gobernada, mientras que la ingeniería física se incorpore sólo cuando exista una necesidad demostrable?

### Opciones consideradas

Las opciones y sus pros y contras son una reconstrucción del agente; el decisor no registró el análisis de alternativas.

| Opción | Descripción | Beneficios | Riesgos |
|---|---|---|---|
| A | BI semántica primaria + ingeniería complementaria | Entrega incremental, menor duplicación y contrato común para BI/IA | Requiere disciplina de gobierno y criterios de materialización |
| B | Plataforma Medallion/lakehouse como centro | Replay, desacoplamiento, historización y reutilización física | Mayor coste inicial; riesgo de sobreconstrucción y semántica tardía |
| C | Dashboards sobre fuentes directas | Muy rápida para PoC | Métricas duplicadas, baja trazabilidad, riesgo de seguridad y rendimiento |
| D | Warehouse central como fuente única | Simplifica serving y gobierno físico | Puede acoplar dominios y forzar cargas innecesarias |

### Propuesta del agente

1. Adoptar la opción A como arquitectura de producto para v1.1.
2. Hacer de Semantic Governance el dueño de las definiciones de negocio.
3. Mantener Data Engineering como capacidad complementaria para datasets que requieran preparación física.
4. Permitir Medallion por dataset, con criterios explícitos, y no como requisito universal.
5. Usar un contrato semántico estable entre experiencias y motores de almacenamiento.
6. Seleccionar el motor analítico mediante benchmark, priorizando un único serving engine por entorno o tier cuando sea viable.
7. Tratar tenancy, políticas y lineage como preocupaciones transversales obligatorias.

### Decisión

**Se propone que BI Analytics Platform v1.1 use una capa semántica gobernada como contrato principal de consumo y una capacidad de ingeniería de datos complementaria, con Medallion opcional por dataset y selección de motores basada en workloads y aislamiento multitenant.**

Esta frase no representa una aprobación humana todavía.

### Consecuencias positivas

- dashboards, APIs, exportaciones y agentes IA pueden compartir definiciones;
- se evita duplicar pipelines cuando una fuente gobernada es suficiente;
- la plataforma puede introducir Medallion gradualmente;
- el cambio de motor físico queda desacoplado del lenguaje de negocio;
- lineage, calidad y tenancy se vuelven parte del contrato.

### Consecuencias negativas

- Semantic Governance debe tener ownership y proceso de publicación reales;
- habrá que mantener compatibilidad de modelos y versiones;
- el motor no se puede escoger sólo por preferencia tecnológica;
- algunos casos de uso requerirán dos ciclos: preparación física y publicación semántica;
- el equipo debe probar seguridad en caminos indirectos como cachés, exportaciones e IA.

### No se decidió todavía

- producto concreto del almacén relacional de control plane;
- producto concreto del motor OLAP/warehouse;
- formato de tabla y proveedor de object storage;
- estrategia por tenant para cada tier;
- SLO de disponibilidad, latencia, frescura y recuperación;
- dominios iniciales y owners de negocio;
- política de residencia y retención;
- si los cubos se materializan físicamente o se representan en el modelo semántico;
- protocolo final de aprobación de KPI.

### Metas de calidad

`[PENDIENTE]`. No se encontraron NFR aprobados en el material recuperado. No se deben inventar objetivos de latencia, disponibilidad, throughput o frescura.

### Plan de validación

Antes de aceptar ADR-011:

1. seleccionar dos o tres workloads representativos, incluyendo uno directo y uno con historización;
2. medir consultas de dashboards, exploración, refresh y exportación bajo aislamiento de tenant;
3. probar cambio de versión de un KPI sin romper consumidores compatibles;
4. ejecutar pruebas negativas de tenant en consulta, caché, exportación y IA;
5. comparar coste operativo de fuente directa, Gold materializado y Medallion completo;
6. registrar la decisión humana y actualizar el estado del ADR.

## 17. Cambios trazables al PRD v1.0

| ID | Tema visible de v1.0 / conversación | Cambio en v1.1 | Motivo |
|---|---|---|---|
| CHG-01 | Evolución desde PoC DashboardStudio | Se mantiene la reutilización de UX y componentes, pero se separa la plataforma de producción de la PoC | Evitar que una prueba de visualización defina límites de datos |
| CHG-02 | Plataforma empresarial multiproducto | Se explicitan control plane, data plane, contratos y ownership | Hacer operable la escala de productos |
| CHG-03 | Alcance multitenant | Se agrega aislamiento por capas y por tier, incluyendo caché, exports, IA y observabilidad | `tenant_id` aislado sólo en tablas es insuficiente |
| CHG-04 | Catálogo semántico y ontologías | Semantic Governance se convierte en bounded context explícito | Separar significado de implementación física |
| CHG-05 | Cubos y KPI | Se añade grano, aditividad, fórmula, versionado, owner, lineage y estado | Reducir KPI incompatibles y no auditables |
| CHG-06 | Agentes IA | AI Analytics sólo puede usar modelos y políticas autorizados | Evitar acceso directo y respuestas sin grounding |
| CHG-07 | Medallion | Se cambia de patrón implícitamente universal a estrategia opcional por dataset | Controlar complejidad, coste y duplicación |
| CHG-08 | Base de datos analítica | Se separan control plane, preparación y serving; selección por criterios y benchmark | Evitar un motor único por supuesto no probado |
| CHG-09 | Modelos dimensionales | Se incorporan como forma de serving, no como sustituto del modelo semántico | Mantener semántica, ontología y dimensiones alineadas |
| CHG-10 | Arquitectura objetivo | Se añade ADR-011 propuesto y lista explícita de pendientes | Distinguir propuesta del agente de decisión aprobada |

## 18. Roadmap de entrega

### Fase 0 — Validación y contratos

- confirmar dominios, tenants, owners y NFR;
- inventariar fuentes y consumidores de la PoC;
- definir el contrato mínimo de Semantic Model, MetricDefinition y TenantScope;
- acordar workloads para benchmark.

### Fase 1 — Núcleo semántico

- catálogo de fuentes y términos;
- entidades, dimensiones, medidas y KPI versionados;
- publicación y lineage básico;
- dashboards sobre consultas semánticas;
- aislamiento de tenant en control plane y serving.

### Fase 2 — Ingeniería complementaria

- jobs y datasets preparados;
- calidad, historización y freshness;
- Gold dimensional para los dominios que lo justifiquen;
- materializaciones y caché con invalidación por versión/tenant.

### Fase 3 — IA gobernada

- exploración sobre modelos autorizados;
- explicaciones con lineage y definición de KPI;
- auditoría de prompts, consultas y fuentes usadas;
- pruebas de fuga cross-tenant.

### Fase 4 — Escala y especialización

- Medallion para datasets con evidencia de necesidad;
- cubos y ontologías ampliados por dominio;
- tiers de aislamiento y residencia;
- optimización de coste y rendimiento.

## 19. Criterios de aceptación de producto

- Un mismo KPI publicado produce una definición consistente en dashboard, API y respuesta IA autorizada.
- Una fuente directa puede alimentar un modelo semántico sin crear capas Medallion innecesarias.
- Un dataset con necesidad de replay/historización puede usar Bronze/Silver/Gold con lineage completo.
- Una consulta de un tenant no puede devolver filas, columnas, cachés, archivos o contexto IA de otro tenant.
- Un cambio de fórmula queda versionado, con owner, vigencia y consumidores afectados.
- Un modelo semántico expone origen, grano, freshness y estado de calidad.
- El motor físico puede cambiar sin cambiar el significado de una métrica publicada.
- Un agente IA no puede publicar o cambiar KPI sin pasar por el flujo de gobierno.

## 20. Preguntas que requieren decisión humana

1. ¿Quién es el arquitecto responsable de aceptar o rechazar ADR-011?
2. ¿Cuál es el primer dominio de negocio y quién es su owner?
3. ¿Qué tenants y clases de datos requieren aislamiento físico?
4. ¿Qué fuentes y workloads representan el MVP?
5. ¿Qué NFR deben gobernar el benchmark?
6. ¿Qué política de residencia, retención y borrado aplica?
7. ¿Qué nivel de autonomía se permite a los agentes IA?
8. ¿Qué parte de la ontología/cubo es imprescindible para el primer release?
9. ¿Qué capacidad de la PoC se reutiliza con evidencia de producción y cuál se reescribe?

## 21. Resumen de decisión

La recomendación es avanzar con una plataforma BI semántica como centro de gravedad, complementada por ingeniería de datos y Medallion sólo donde exista una razón operacional o de negocio. La capa semántica gobierna el significado; los modelos dimensionales optimizan el análisis; el motor físico se selecciona por workload; y multitenancy se trata como una propiedad transversal de seguridad, no como una columna aislada.

La recomendación queda propuesta hasta que un arquitecto responsable valide ADR-011, los NFR y el benchmark de motores.

