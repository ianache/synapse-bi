---
type: Business Glossary
title: "GLS-001 — Glosario de negocio"
description: "Catálogo alfabético de conceptos y términos funcionales de BI Analytics Platform v1.1; cada término tiene un artefacto OKF propio."
tags: [glossary, business, BI-Analytics]
status: draft
generated:
  by: "af-business-glossary-curator/1.1"
  at: "2026-10-17T00:00:00-05:00"
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
  - id: BRC-001
    resource: /knowledge-base/business/rules/BRC-001-reglas-negocio-bi-analytics-v1-1.md
  - id: SEM-US003-D01-D07
    resource: /docs/ux/us-003/decisions.md
  - id: ISO-KPI
    resource: https://www.iso.org/obp/ui?_escaped_fragment_=iso:std:iso:14031:ed-3:v1:es
  - id: ISO-AI
    resource: https://www.iso.org/es/inteligencia-artificial
---

# GLS-001 — Glosario de negocio

> **Procedencia:** PRD v1.1, RCP-001 y BRC-001 (documentos internos en `draft`, nivel N2); páginas oficiales ISO consultadas el 2026-10-16 (N1) para KPI e IA. **Alcance:** BI Analytics Platform v1.1. **Consumidor:** negocio, análisis funcional, Semantic Governance, Data Engineering y equipos de producto. Ninguna definición está verificada hasta que la valide su responsable.

## Cómo leer este glosario

Actualización US-003: se sincroniza TRM-0024 Dominio, incorporado por D05 a partir
del registro interno de decisiones (draft, N2). Incorporación aceptada no implica
verificación de la definición ni asignación de responsable (GQ-05 pendiente).
Consumidores: modelo conceptual IMD-002 y equipo del catálogo semántico local.

- Cada término es un artefacto OKF v0.2 propio en `terms/TRM-NNNN-<slug>.md`, con su estado y su verificación. Este catálogo es solo el índice: se genera con `glossary.py build` y no se edita a mano entre los marcadores.
- El índice está en orden alfabético del español: sin distinguir mayúsculas ni tildes, con la Ñ después de la N y las cifras antes de la A.
- El índice incluye sinónimos y formas completas de siglas en cursiva (*Sinónimo* → Término).
- Niveles de fuente: **N1** primaria, **N2** secundaria confiable, **N3** terciaria (no respalda una definición por sí sola).
- `Clasificación: gap` significa que no hay una fuente N1 o N2 que respalde la definición.

## Índice

<!-- glossary:index:start -->
### A

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Aislamiento multitenant](terms/TRM-0001-aislamiento-multitenant.md) | concepto | Límite de seguridad y gobierno que evita que operaciones, metadatos o datos derivados de un tenant queden accesibles a otro. Abarca consultas, almacenamiento, exportaciones, cachés, jobs, IA y observabilidad. | draft |

### C

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Calidad de datos](terms/TRM-0002-calidad-de-datos.md) | concepto | Condición de un dataset o modelo respecto de controles y resultados de calidad que la plataforma declara y expone a consumidores. Las fuentes no fijan dimensiones ni umbrales comunes. | draft |
| [Catálogo semántico](terms/TRM-0003-catalogo-semantico.md) | concepto | Inventario navegable de fuentes, datasets, entidades, definiciones y modelos semánticos que expone ownership y estado para facilitar su descubrimiento y consumo gobernado. | draft |

### D

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Dashboard](terms/TRM-0004-dashboard.md) | concepto | Experiencia visual que compone y presenta análisis mediante visualizaciones y filtros, consumiendo consultas semánticas autorizadas. | draft |
| [Dataset](terms/TRM-0005-dataset.md) | concepto | Conjunto de datos registrado para consumo directo o preparado, asociado a owner, clasificación, frescura y lineage dentro de la plataforma. | draft |
| [Dataset preparado](terms/TRM-0006-dataset-preparado.md) | concepto | Dataset producido o transformado mediante ingeniería de datos complementaria para normalizar, validar, deduplicar, historizar, reconciliar o servir información cuando la fuente directa no basta. | draft |
| [Dimensión](terms/TRM-0007-dimension.md) | concepto | Entidad descriptiva conformada que permite analizar hechos por categorías, jerarquías u otros atributos relevantes del dominio. | draft |
| [Dominio](terms/TRM-0024-dominio.md) | concepto | Ámbito de negocio creado por el usuario en el catálogo semántico para agrupar dimensiones, medidas y definiciones de KPI reutilizables. | draft |

### E

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Entidad de negocio](terms/TRM-0008-entidad-de-negocio.md) | concepto | Concepto del dominio representado en el catálogo o modelo semántico y relacionado con dimensiones, medidas y KPI. Las fuentes exigen definirlo, pero no establecen qué criterios delimitan una entidad. | draft |

### F

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Frescura de datos](terms/TRM-0009-frescura-de-datos.md) | concepto | Atributo que comunica la actualidad de un dataset o modelo semántico para que el consumidor valore el resultado. Las fuentes exigen declararlo, pero no determinan cálculo, umbrales ni tolerancias. | draft |
| *freshness* → [Frescura de datos](terms/TRM-0009-frescura-de-datos.md) | | | |
| [Fuente gobernada](terms/TRM-0010-fuente-gobernada.md) | concepto | Fuente que el PRD considera apta para consumo semántico directo en casos simples; los documentos no fijan qué controles, ownership u otros criterios debe cumplir para obtener esa condición. | draft |

### G

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Gobierno semántico](terms/TRM-0012-gobierno-semantico.md) | concepto | Capacidad funcional que administra el glosario y define, versiona y publica entidades, dimensiones, medidas, KPI y relaciones, conservando ownership y lineage lógico. | draft |
| [Grano](terms/TRM-0011-grano.md) | concepto | Nivel de detalle que representa cada hecho o medición en el modelo; debe declararse y un KPI no puede ocultar un cambio de ese nivel. | draft |

### I

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [IA](terms/TRM-0013-ia.md) | sigla | En la plataforma, capacidad de apoyar la exploración y explicación de información usando modelos, documentos y datos autorizados, con citas y trazabilidad. | draft |
| [Indicador clave de desempeño (KPI)](terms/TRM-0014-indicador-clave-de-desempeno-kpi.md) | sigla | Métrica gobernada que expresa el desempeño del negocio y puede compartirse entre dashboards, API y experiencias de IA autorizadas. Para publicarse, declara definición, fórmula, unidad, grano, filtros, owner, versión, vigencia, fuentes, acceso, frescura y calidad. | draft |
| [Ingeniería de datos complementaria](terms/TRM-0015-ingenieria-de-datos-complementaria.md) | concepto | Capacidad para preparar, validar, historizar y servir datos cuando la fuente directa o la capa semántica no cubren el caso de forma confiable o eficiente. | draft |
| *Inteligencia artificial* → [IA](terms/TRM-0013-ia.md) | | | |

### K

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| *Key Performance Indicator* → [Indicador clave de desempeño (KPI)](terms/TRM-0014-indicador-clave-de-desempeno-kpi.md) | | | |
| *KPI* → [Indicador clave de desempeño (KPI)](terms/TRM-0014-indicador-clave-de-desempeno-kpi.md) | | | |

### L

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Linaje de datos](terms/TRM-0016-linaje-de-datos.md) | concepto | Trazabilidad que conecta el origen y recorrido de los datos desde la fuente y dataset hasta entidad/medida, KPI y visualización o respuesta de IA. | draft |
| *lineage* → [Linaje de datos](terms/TRM-0016-linaje-de-datos.md) | | | |

### M

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Medallion](terms/TRM-0017-medallion.md) | término | Estrategia opcional de preparación y trazabilidad por dataset con etapas Bronze/Raw, Silver/Conformed y Gold/Analytical, usada cuando hacen falta calidad, historización, replay, desacoplamiento o reutilización. | draft |
| [Medida](terms/TRM-0018-medida.md) | concepto | Valor cuantitativo o cálculo definido en el modelo semántico que puede participar en un KPI y debe tener unidad, grano y reglas de agregación declarados. | draft |
| [Modelo dimensional](terms/TRM-0019-modelo-dimensional.md) | concepto | Representación física o lógica para consumo analítico que organiza hechos con grano declarado y dimensiones descriptivas; optimiza el análisis sin sustituir definiciones semánticas ni políticas de acceso. | draft |
| [Modelo semántico](terms/TRM-0020-modelo-semantico.md) | concepto | Contrato gobernado que reúne dimensiones, medidas, KPI, relaciones, filtros, jerarquías, sinónimos y reglas de acceso para ofrecer un significado de negocio reutilizable a sus consumidores. | draft |

### O

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Ontología](terms/TRM-0021-ontologia.md) | concepto | Descripción de conceptos, tipos, relaciones y sinónimos de negocio que facilita navegación y grounding; no implica convertir automáticamente los conceptos en tablas físicas. | draft |

### P

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| *patrón Medallion* → [Medallion](terms/TRM-0017-medallion.md) | | | |
| [Publicación de modelo semántico](terms/TRM-0022-publicacion-de-modelo-semantico.md) | concepto | Cambio gobernado por el que una versión de un modelo semántico queda disponible para consumo con estado, ownership, versión, vigencia y lineage asociados. | draft |

### S

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| *Semantic Governance* → [Gobierno semántico](terms/TRM-0012-gobierno-semantico.md) | | | |

### T

| Término | Tipo | Definición | Estado |
|---|---|---|---|
| [Tenant](terms/TRM-0023-tenant.md) | término | Ámbito de seguridad y gobierno al que se asocian objetos y operaciones de negocio; la plataforma mantiene separados sus datos y deriva el contexto de una identidad autorizada. | draft |
<!-- glossary:index:end -->

## Preguntas abiertas

| ID | Término | Pregunta | Responsable | Prioridad | Estado |
|---|---|---|---|---|---|
| GQ-01 | [Fuente gobernada](terms/TRM-0010-fuente-gobernada.md) | ¿Qué criterios convierten una fuente en “gobernada” para consumo directo? | Responsable funcional / Semantic Governance | Alta | Abierta |
| GQ-02 | [Frescura de datos](terms/TRM-0009-frescura-de-datos.md) | ¿Cómo se mide freshness y qué objetivos o tolerancias aplican por dataset/KPI? | Owner de dominio / Data Engineering | Alta | Abierta |
| GQ-03 | [Entidad de negocio](terms/TRM-0008-entidad-de-negocio.md) | ¿Qué criterios delimitan una entidad de negocio en el catálogo semántico? | Semantic Governance / owner de dominio | Media | Abierta |
| GQ-04 | [Tenant](terms/TRM-0023-tenant.md) | ¿Qué entidad organizacional representa un tenant y cómo se relaciona con producto/dominio? | Producto / Tenant & Access Governance | Alta | Abierta |
| IM2-Q1 | [Dominio](terms/TRM-0024-dominio.md) | ¿Incorporar Dominio? | Usuario de esta conversación | Media | Cerrada — SEM-US003-D05 (N2, sin verificación nominal); incorporación realizada |
| GQ-05 | [Dominio](terms/TRM-0024-dominio.md) | Revisar definición y asignar responsable | Producto / Semantic Governance, por confirmar | Media | Abierta |

## Preparación y entrega

- **Estado:** CONDITIONAL
- **Términos con `gap`:** Entidad de negocio; Fuente gobernada; Frescura de datos; Tenant.
- **Decisión humana requerida:** validar las definiciones y asignar responsables del dominio; resolver las preguntas abiertas.

## Lista de calidad

- [x] Cada definición tiene al menos una fuente N1 o N2 con localizador
- [x] Sinónimos y formas completas respaldados por una fuente
- [x] Sin conocimiento propio del modelo como fuente
- [x] `glossary.py check` sin errores (24 términos, 0 errores)
- [x] `knowledge-base/index.md` y `changelog.md` actualizados
- [ ] Validación humana registrada
