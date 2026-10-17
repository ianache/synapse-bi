---
type: RequirementContextPack
id: RCP-002
title: Contexto inicial de US-003 — Definir elementos semánticos
description: Contexto trazable para delimitar el primer recorrido semántico después de la validación local de US-002.
status: draft
generated:
  by: af-requirement-context-builder/1.0
  at: 2026-10-16T18:30:56-05:00
sources:
  - id: US-003
    resource: /knowledge-base/requirements/user-stories/US-003-definir-elementos-semanticos.md
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
  - id: BRC-001
    resource: /knowledge-base/business/rules/BRC-001-reglas-negocio-bi-analytics-v1-1.md
  - id: UX-US002-D04
    resource: /docs/ux/us-002/README.md
  - id: DATASET-REGISTRY-EVIDENCE
    resource: /.superpowers/sdd/2026-10-16-us-002-dataset-registry-plan/progress.md
  - id: CASE-STUDY
    resource: /codebase/case-study/README.md
  - id: DEMO-KPIS
    resource: /codebase/backend/synapse_api/demo.py
  - id: TRM-0008
    resource: /knowledge-base/business/glossary/terms/TRM-0008-entidad-de-negocio.md
  - id: SEM-US003-D01
    resource: /docs/ux/us-003/decisions.md
  - id: SEM-US003-D02
    resource: /docs/ux/us-003/decisions.md
  - id: SEM-US003-D03
    resource: /docs/ux/us-003/decisions.md
  - id: SEM-US003-D04
    resource: /docs/ux/us-003/decisions.md
  - id: SEM-US003-D05
    resource: /docs/ux/us-003/decisions.md
  - id: SEM-US003-D06
    resource: /docs/ux/us-003/decisions.md
  - id: TRM-0024
    resource: /knowledge-base/business/glossary/terms/TRM-0024-dominio.md
  - id: IMD-002
    resource: /knowledge-base/business/information-model/IMD-002-catalogo-semantico.md
  - id: US003-DESIGN
    resource: /docs/superpowers/specs/2026-10-16-us-003-semantic-catalog-design.md
---

# RCP-002 — Definición semántica, primer incremento

Actualización 2026-10-17 / D07: incremento local implementado y verificado en
worktree aislado, con revisión independiente y dos Important corregidos. Las
afirmaciones de descubrimiento/no implementación siguientes son históricas. Guía
y estado de entrega en docs/ux/us-003/README.md; aceptación manual y gobierno de
producción siguen pendientes, sin owner/aprobador nominal inventado.

Actualización D06 (2026-10-16): usuario conforme con diseño/plan y método nativo
con revisión independiente final. Los pendientes de revisión de esos dos artefactos
en el registro histórico siguiente quedan superados localmente. API-003, DM-003
y UX creados en T1 requieren revisión propia antes de implementar; GQ-05/owners
y autoridad productiva no se declaran verificados. No se implementó código US-003.

## 1. Metadata y pregunta de trabajo

- Producto: BI Analytics Platform.
- Iniciativa: US-003, después del incremento local de US-002.
- Fecha: 2026-10-16. Responsable funcional: aún no identificado.
- Pregunta: ¿qué primer recorrido permite definir significado de negocio sobre
  datasets registrados, sin confundir documentación con publicación o cálculo?
- Estado: borrador para descubrimiento/refinamiento; no listo para implementar.

## 2. Objetivo y alcance

Resultado buscado: que un responsable pueda recuperar y revisar una definición
semántica con significado, grano y procedencia explícitos, reutilizable por futuros
consumidores y distinguible de los metadatos técnicos de una fuente (US-003 §§2–5).

Alcance de la historia existente: entidades, dimensiones, medidas, KPI, jerarquías,
sinónimos y relaciones. La propia US-003 §17 exige descomponerla y priorizar.

**Alcance confirmado en SEM-US003-D01:** editor configurable para crear dominios
y KPI propios sin modificar código; asociar datasets, definir dimensiones y medidas
y documentar atributos semánticos. Ventas e Ingresos netos sólo son ejemplos del
laboratorio, nunca valores fijos del producto ni definiciones empresariales ratificadas.

**Borradores de KPI confirmados en SEM-US003-D02:** guardar con nombre y dominio,
permitiendo fórmula, unidad, grano o responsable faltantes, siempre mostrando los
pendientes. Toda referencia que se declare debe existir y estar autorizada.
Guardar no implica validar significado, publicar, certificar o ejecutar.

**Integridad confirmada en SEM-US003-D04:** dominio con nombre; dimensión/medida
con nombre y dominio y mapeo opcional; referencias existentes/autorizadas, faltantes
de componentes visibles en KPI; una dimensión/medida utilizada no admite edición
directa y se cambia mediante copia y actualización explícita del KPI elegido.

La organización como catálogo reutilizable quedó aprobada en SEM-US003-D03.
El detalle adicional se presenta como propuesta en el diseño escrito para revisión;
no se declara toda US-003 lista para implementar ni aprobados sus contratos técnicos.

Fuera del primer recorrido propuesto: publicación/aprobación/versionado del modelo
(US-004), ejecución/SQL/serving de Gold (US-005), IA, pipelines y ontología completa.
No convertir automáticamente PK/FK, tablas o vistas en entidades/relaciones de negocio.

## 3. Resumen ejecutivo del contexto

El usuario confirmó la validación local de US-002 y pidió continuar con US-003.
Ya hay procedencia técnica persistida; falta el significado de negocio. La historia
de semántica sigue CONDITIONAL porque aún no se han definido dominio/owner,
criterios de entidad ni validaciones de borradores. La confirmación de US-002
no cierra esas decisiones ni equivale a aprobar una arquitectura de US-003.
Posteriormente el usuario confirmó el alcance configurable (SEM-US003-D01);
la política de borradores de KPI también quedó confirmada (SEM-US003-D02).
También se aprobó la organización como catálogo reutilizable (SEM-US003-D03).
Los mínimos e integridad/edición mediante copia se confirmaron en SEM-US003-D04.
Las relaciones y cardinalidades R-01 a R-08 quedaron aceptadas en SEM-US003-D05,
que también autoriza incorporar Dominio al glosario. Roles, detalle de completitud
y diseño escrito completo continúan pendientes; la definición nueva de Dominio
se incorpora en draft para revisión, no como texto previamente aprobado.

## 4. Registro de evidencia

| ID | Hallazgo | Fuente y fragmento | Tipo | Confianza |
| --- | --- | --- | --- | --- |
| SEM-E01 | Usuario conforme con US-002 y solicita continuar US-003 | UX-US002-D04, cita de la conversación | Decisión humana | Alta |
| SEM-E02 | US-003 depende de US-002 y exige vocabulario y atributos semánticos | US-003 §§1, 4–5 | Hecho | Alta |
| SEM-E03 | La historia es demasiado amplia y requiere división | US-003 §§14, 17 | Hecho | Alta |
| SEM-E04 | Los KPI publicados declaran componentes, grano, filtros, casos límite, owner/steward, vigencia, lineage, acceso, frescura/calidad | PRD §11.3 | Hecho documental | Alta |
| SEM-E05 | Los criterios de entidad y autoridad/completitud siguen abiertos | US-003 §12; TRM-0008 | Vacío | Alta |
| SEM-E06 | Gold retail contiene ventas, devoluciones y vistas de ingresos | CASE-STUDY, Modelo y grano / Contratos de agregación | Hecho documental del laboratorio | Alta |
| SEM-E07 | Ingresos netos descuenta reembolsos y reconoce devolución en fecha de devolución | CASE-STUDY, Contratos de agregación | Hecho del caso de estudio, no regla empresarial | Alta |
| SEM-E08 | Los KPI actuales se insertan como fixtures sintéticos de demostración | DEMO-KPIS, demo_kpis/seed | Hecho | Alta |
| SEM-E09 | Empezar con Ventas e Ingresos netos reduce descubrimiento y permite trazar componentes | SEM-E06–08 | Hipótesis/propuesta del agente | Media |
| SEM-E10 | El alcance será un editor configurable de dominios/KPI propios; Ventas sólo como ejemplo | SEM-US003-D01, aclaración del usuario y respuesta «conforme. Proceguir» | Decisión humana | Alta |
| SEM-E11 | KPI borrador exige nombre/dominio; permite fórmula/unidad/grano/responsable faltantes visibles; las referencias declaradas deben existir y estar autorizadas | SEM-US003-D02, respuesta «si» del usuario | Decisión humana | Alta |
| SEM-E12 | Catálogo reutilizable: dimensiones y medidas independientes referenciadas por varios KPI; evitar cambios silenciosos | SEM-US003-D03, respuesta «si» a esa organización | Decisión humana | Alta |
| SEM-E13 | Dominio exige nombre; dimensión/medida exige nombre/dominio; mapeo opcional; KPI muestra pendientes de componentes; dimensión/medida usada se protege y cambia mediante copia/reasociación explícita | SEM-US003-D04, respuesta «si» a las reglas presentadas | Decisión humana | Alta |
| SEM-E14 | Usuario acepta IM2-Q1 (incorporar Dominio) y R-01 a R-08, incluidas sus cardinalidades, para el incremento local | SEM-US003-D05, respuesta explícita a cada ID | Decisión humana | Alta |

No se sustituyen las propuestas de BRC-001 por decisiones humanas aprobadas.

## 5. Hechos confirmados

- Conformidad del usuario con la validación local de US-002 (SEM-E01).
- Relaciones/cardinalidades R-01 a R-08 aceptadas e incorporación de Dominio
  autorizada (SEM-E14); no implica aprobación del diseño escrito completo.
- Editor configurable, con dominios y KPI propios sin cambios de código; ejemplos
  separados de definiciones del usuario (SEM-E10). No implica ejecución de fórmulas.
- Política local de borradores de KPI confirmada con los mínimos y límites de
  SEM-E11. No se extrapola a los otros tipos de elemento ni a publicación.
- Catálogo de componentes reutilizables como organización funcional confirmada
  (SEM-E12), con protección/copia aceptada para componentes usados (SEM-E13).
- La definición semántica precede a la publicación y a su futuro consumo (US-003 §11).
- US-003 exige documentar significado, fórmula, unidad y grano; no autoriza
  inferirlos a partir de metadatos observados (US-003 §§5, 10).
- El laboratorio tiene convenciones explícitas de devoluciones, moneda y grano;
  no deben confundirse con los fixtures SQLite ni con reglas empresariales
  ratificadas (CASE-STUDY, Contratos de agregación y Verificación reproducible).
- La implementación previa y su evidencia local no constituyen aprobación
  productiva ni ratificación de owners (UX-US002-D04).

## 6. Supuestos e hipótesis

- H1 ajustada tras SEM-US003-D01: Ventas / Ingresos netos puede usarse como caso
  de prueba del editor genérico; no limita los dominios/KPI que el usuario puede crear.
- H2 parcialmente resuelta: el usuario aprobó borradores incompletos de KPI en
  SEM-US003-D02; su utilidad general sigue siendo una hipótesis y no fija reglas
  para los demás elementos. La decisión no se heredó automáticamente de US-002.
- H3: documentar fórmulas y componentes sin ejecutarlos separa definición de serving;
  representación y validación funcional de fórmulas aún por acordar.
- S1: usar el laboratorio existente evita introducir una nueva fuente en este
  recorrido; no establece tecnología, tablas de persistencia ni contratos de API.

## 7. Vacíos y preguntas abiertas

| ID | Pregunta | Destinatario | Prioridad / Estado |
| --- | --- | --- | --- |
| SEM-Q01 | ¿Editor configurable o limitado a Ventas / Ingresos netos? | Usuario / Producto | Resuelta en SEM-US003-D01: configurable; ejemplos no obligatorios |
| SEM-Q02 | ¿Quién valida significado y qué diferencia owner declarado de aprobador? | Producto / Semantic Governance | Alta / Abierta; relacionada con US-003-Q1 |
| SEM-Q03 | ¿Qué campos/referencias se exigen aun en borrador y qué faltantes se permiten? | Producto / AF / QA | Mínimos y referencias resueltos en D02/D04; detalle adicional de completitud propuesto en diseño §5 |
| SEM-Q04 | ¿Cómo delimitar entidades de negocio y su relación con dimensiones y datasets? | Semantic Governance / owner | Alta / Abierta; GQ-03 |
| SEM-Q05 | ¿Qué dataset(s), grano, componentes y convenciones representan el KPI elegido? | Owner / Data Engineering | Alta / Abierta para detalle; cardinalidades resueltas en D05 |
| SEM-Q06 | ¿Qué roles pueden definir/leer/editar y qué alcance por tenant aplica? | Producto / Seguridad | Alta / Abierta |
| SEM-Q07 | ¿Cómo se cambia un componente compartido sin alterar silenciosamente los KPI que lo usan? | Producto / Semantic Governance / AF | Resuelta en SEM-US003-D04: protección y copia, cambio explícito por KPI; mecánica técnica sujeta al diseño |

## 8. Actores, procesos, datos y dependencias

- Actores conceptuales: Semantic Governance y owner/steward (US-003); personas y
  concesiones de permisos no confirmadas. Data Engineering aporta procedencia,
  no decide unilateralmente el significado de negocio.
- Proceso propuesto: elegir caso/dataset → declarar grano y componentes → documentar
  definición → guardar borrador → recuperar/revisar → editar. No es workflow aprobado.
- Datos relevantes: identificador/nombre, dominio, definición/propósito, dataset y
  columnas de procedencia, dimensiones, medidas, fórmula/componentes, unidad/moneda,
  filtros, nulos/devoluciones/datos tardíos, owner/steward, sinónimos, vigencia,
  clasificación/acceso, lineage, estado de frescura/calidad (PRD §11.3).
- Dependencias confirmadas: US-002; consumidores posteriores US-004 y US-005.
- Jerarquías y relaciones generales permanecen en la historia madre, no se declaran
  implementadas ni eliminadas por la propuesta de un primer corte.

## 9. Restricciones y riesgos funcionales

- El tenant no puede derivarse de un campo libre declarado por el usuario;
  mantener el aislamiento existente al ampliar la capacidad (PRD §13; BRC-001 BR-012).
- No sobrescribir los KPI sintéticos existentes ni sustituir sus resultados por
  definiciones nuevas sin publicación/consulta acordadas; evitar regresiones.
- Diferenciar grano físico del dataset, grano declarado del negocio y dimensiones
  válidas de agregación. Una selección parcial de PK no demuestra unicidad.
- No inventar scores, objetivos de frescura, aprobadores ni nombres de equipos.
- Si se elige Ingresos netos, ignorar devoluciones o mezclar sus fechas con la de
  venta altera el significado; un join de hechos puede duplicar importes.
- Diferencia documental: RCP-001 describe fuentes no confirmadas; hoy hay un
  laboratorio local (SEM-E06), no una fuente empresarial productiva confirmada.
- Diferencia de alcance: US-002 fue aceptada localmente; las historias originales
  conservan preguntas de gobierno corporativo. Esa aceptación no las cierra todas.

## 10. Decisiones y validación humana

| Decisión o validación | Responsable | Evidencia | Fecha |
| --- | --- | --- | --- |
| Conformidad con validación local US-002; continuar US-003 | Usuario de esta conversación, sin identidad nominal inventada | UX-US002-D04 | 2026-10-16 |
| Editor configurable de dominios y KPI propios, sin cambios de código; Ventas sólo como ejemplo | Usuario de esta conversación | SEM-US003-D01 / SEM-E10 | 2026-10-16 |
| Borrador de KPI con nombre/dominio, faltantes visibles y referencias autorizadas existentes | Usuario de esta conversación | SEM-US003-D02 / SEM-E11 | 2026-10-16 |
| Catálogo reutilizable de dominios, dimensiones, medidas y KPI | Usuario de esta conversación | SEM-US003-D03 / SEM-E12 | 2026-10-16 |
| Mínimos de dominios/componentes, integridad y protección/copia explícita de dimensiones/medidas usadas | Usuario de esta conversación | SEM-US003-D04 / SEM-E13 | 2026-10-16 |
| Incorporación de Dominio y aceptación de R-01 a R-08 con sus cardinalidades para incremento local | Usuario de esta conversación | SEM-US003-D05 / SEM-E14 | 2026-10-16 |
| Reglas de otros elementos y corte funcional de US-003 | Producto / usuario | SEM-Q03–05 | Pendiente |
| Autoridad y permisos semánticos | Producto / Semantic Governance / Seguridad | SEM-Q02/06 | Pendiente |

Revisión de consistencia del agente: objetivo, evidencia, propuestas y vacíos
separados; no hay decisiones técnicas ni reglas nuevas presentadas como aprobadas.
Validación humana del pack: pendiente. La autorización para continuar habilita
descubrimiento, no equivale a aceptación de este documento ni de un diseño/plan futuro.

## 11. Knowledge Candidates con provenance

| Candidato | Provenance | Verificador | Estado |
| --- | --- | --- | --- |
| Vocabulario de Ventas / Ingresos netos como ejemplo del editor genérico | CASE-STUDY + SEM-E09/10 | Owner de dominio / Semantic Governance | Ejemplo, no definición empresarial aprobada |
| Regla de reconocimiento de devoluciones del primer KPI | CASE-STUDY, Contratos de agregación | Owner de dominio | Válida para laboratorio; pendiente como definición semántica del incremento |
| Política local de borradores de KPI | SEM-US003-D02 / SEM-E11 | Usuario / Producto | Confirmada para KPI; detalle de otros elementos y publicación pendiente |

## 12. Handoff para el siguiente rol

Puede usarse: historia madre, evidencia del laboratorio, aceptación local de US-002,
atributos de PRD §11.3 y preguntas priorizadas. No requiere redescubrir US-002.

SEM-Q01 está resuelta: no volver a preguntar si el producto se limita a Ventas.
SEM-Q03 ya tiene decisión para borradores de KPI; no volver a solicitar esa confirmación.
El catálogo reutilizable está seleccionado (SEM-US003-D03); no reabrir las alternativas
de componentes embebidos/editor gráfico como si no hubiera decisión.
Los mínimos e integridad/copia están resueltos en D04; no volver a someterlos a decisión.
Siguiente paso: revisar el diseño escrito US003-DESIGN, que consolida decisiones y
propone el detalle de alcance/completitud/permisos. IMD-002 aporta relaciones
conceptuales con cardinalidades aceptadas en D05, no tablas. IM2-Q1/2 están
cerradas; no reabrirlas. TRM-0024 incorpora Dominio, cuya definición y responsable
se revisan mediante GQ-05, sin confundir incorporación con verificación del término.
Después de la revisión se prepara el plan con contratos/persistencia/UX y sus
dependencias explícitas. No habilitar todavía el botón US-003 ni iniciar producto.

Checklist humano pendiente: selección de caso, alcance/validaciones, owner y
permisos; aprobación de contexto/refinamiento; revisión del diseño escrito; revisión
del plan y elección de ejecución. No se crean pantallas externas ni código en esta etapa.

Artefactos: US-003, RCP-001, PRD §11.3, BRC-001 BR-006/007, UX-US002-D04,
CASE-STUDY y evidencia de implementación de datasets, enlazados en sources.
