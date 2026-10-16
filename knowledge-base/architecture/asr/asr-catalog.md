---
type: ASR-Candidate-Catalog
id: ASR-CATALOG-001
title: Catálogo de candidatos ASR - BI Analytics Platform v1.1
description: Candidatos de requisitos arquitectónicamente significativos identificados a partir del PRD, RCP-001 y ADRs existentes.
status: draft
generated:
  by: agent/gpt-5
  at: 2026-10-15T00:00:00-05:00
sources:
  - id: PRD-BI-ANALYTICS-V1.1
    resource: /intents/PRD.md
    title: PRD - BI Analytics Platform v1.1, opcion A
  - id: RCP-001
    resource: /knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md
    title: Requirement Context Pack - BI Analytics Platform v1.1
  - id: ADRS-BI-ANALYTICS-V1.1
    resource: /knowledge-base/architecture/ADRs.md
    title: Resumen de decisiones - BI Analytics Platform v1.1, opcion A
---

# ASR Candidate Catalog

## Metadata

- **Producto / iniciativa:** BI Analytics Platform v1.1, opción A.
- **Architect / responsable:** `[PENDIENTE: arquitecto responsable]`.
- **Fecha:** 2026-10-15.
- **Versión:** 1.0.
- **Entradas:** PRD-BI-ANALYTICS-V1.1, RCP-001 y ADRs ADR-011 a ADR-019.
- **Estado:** Borrador; requiere disposición humana.

## Candidates

| ID | Requirement | Quality Concern | Why Architecture-Significant? | Impact Evidence | Evidence IDs | Confidence | Missing Evidence | Human Disposition |
|---|---|---|---|---|---|---|---|---|
| ASR-001 | FR-003, FR-004, FR-005, FR-011, FR-012 | Consistencia semántica, versionado, lineage y publicación gobernada | Afecta el contrato común de dashboards, APIs, exportaciones e IA y separa significado de implementación física | PRD §§1, 4, 5, 11, 14; ADR-011 | E-001, E-005, E-009, E-010 | Alta | Owners, workflow de aprobación, compatibilidad y dominios iniciales | `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]` |
| ASR-002 | FR-009 | Aislamiento cross-tenant y protección de datos derivados | Cruza identidad, control plane, data plane, consultas, cachés, exports, jobs, IA y observabilidad | PRD §§5, 7, 13, 14; ADR-015 | E-006, E-010 | Alta | Clasificación, tiers, residencia, retención y pruebas objetivo | `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]` |
| ASR-003 | FR-007, FR-008 | Historificación, replay, calidad, desacoplamiento y coste de preparación | Puede cambiar persistencia, procesamiento, lineage, operación y selección de datasets físicos | PRD §§1, 6, 10, 14, 18; ADR-012 | E-003, E-004, R-003 | Alta | Workloads, volumen, criterios cuantitativos y ownership de datasets | `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]` |
| ASR-004 | FR-005, FR-011 | Rendimiento, concurrencia, portabilidad y reversibilidad del serving | Condiciona motores, materializaciones, cachés, contratos SQL/modelo y plan de salida | PRD §§5, 8, 12, 15; ADR-014 | E-010, R-004 | Alta | NFR, workloads representativos, presupuesto y motores actuales | `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]` |
| ASR-005 | FR-010 | Grounding autorizado, auditabilidad y control de autonomía de IA | Introduce requisitos transversales de identidad, tenant, lineage, auditoría y publicación de KPI | PRD §§5, 7, 13, 14, 19; ADR-016 | E-007, R-006 | Alta | Política de autonomía, retención de sesiones, proveedores y formato de citas | `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]` |
| ASR-006 | FR-006 y decisión propuesta ADR-019 | Reutilización, accesibilidad, compatibilidad y gobernanza del Design System | Afecta todos los productos consumidores y requiere librería, versionado, contribución y pruebas compartidas | PRD §§2.1, 4, 8, 17; ADR-019 | E-005, ADR-019 | Media | Taxonomía, framework, ownership, métricas, alcance de Claude Design y primer release | `[PENDIENTE: CANDIDATE / REJECT / INVESTIGATE]` |

## Constraints

- No se inventan objetivos de latencia, disponibilidad, throughput, freshness, RTO/RPO, adopción o accesibilidad.
- No se recomienda una tecnología concreta como prueba de significancia arquitectónica.
- La selección de motores y tiers de aislamiento queda condicionada a evidencia de workloads y NFR.
- Todos los candidatos permanecen sin aprobación hasta la disposición del arquitecto responsable.

## Rejected Candidates

| Requirement | Classification | Reason |
|---|---|---|
| FR-001, registrar fuentes y observar esquemas | Requisito funcional ordinario, salvo que futuros contratos o seguridad lo eleven | No se ha demostrado aún que determine por sí solo una decisión arquitectónica significativa. |
| FR-006, componer dashboards mediante consultas semánticas | Requisito funcional; su impacto compartido se cubre en ASR-001 y ASR-006 | El requisito aislado no necesita un ASR separado en esta fase. |
| FR-012, catálogo navegable y glosario | Requisito funcional dependiente de ASR-001 | Se mantiene trazado al contrato semántico, no como candidato independiente. |

## Knowledge Gaps

- Arquitecto responsable y proceso de disposición.
- NFR aprobados y workloads del MVP.
- Primer dominio, owners, fuentes, tenants y clases de datos.
- Política de residencia, retención, borrado y recuperación.
- Contratos de publicación y compatibilidad de KPI/modelos.
- Política de IA y evidencia de uso de Claude Design.
- Métricas y gobernanza del Design System.

## Human Validation

- [ ] El arquitecto confirmó que cada fila es un candidato potencial y no una aprobación.
- [ ] El arquitecto clasificó cada candidato como `CANDIDATE`, `REJECT` o `INVESTIGATE`.
- [ ] Se validaron los impactos en seguridad, datos, operación, experiencia y evolución.
- [ ] Se identificaron los NFR y workloads que faltan para confirmar significancia.
- [ ] Se registró responsable y fecha de disposición.

**Disposición humana:** `[PENDIENTE]`.
