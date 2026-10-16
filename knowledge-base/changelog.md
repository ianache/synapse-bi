---
title: Knowledge Base Changelog
status: draft
generated:
  by: agent/gpt-5
  at: 2026-10-16T01:15:43-05:00
---

# Changelog

## 2026-10-15

- Se creó `RCP-001`, Requirement Context Pack para BI Analytics Platform v1.1, a partir de `intents/PRD.md`.
- Se separaron hechos, supuestos, hipótesis, vacíos y decisiones humanas pendientes.
- Se añadió índice inicial de Knowledge Base.
- Se creó ADR-019 para formalizar Atomic Design como estándar del Design System y una librería reutilizable de componentes con Claude Design.
- Se creó el catálogo ASR-001 a ASR-006 con candidatos potenciales y disposición humana pendiente.
- Se formalizaron ADR-001 a ADR-010 como archivos independientes a partir de la tabla de decisiones de Sprint 0 proporcionada por el usuario y el PRD.
- Los diez ADRs quedaron en estado `Propuesto`, con decisor y justificación humana pendientes; no se marcaron como aprobados ni verificados.

## 2026-10-16

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
