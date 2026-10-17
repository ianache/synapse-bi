---
type: Data Model
id: DM-003
title: Persistencia del catálogo semántico configurable
description: Modelo lógico y propuesta aditiva SQLite v4 para US-003.
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: data-model-designer/0.2.0
  at: 2026-10-16T20:43:42-05:00
sources:
  - id: IMD-002
    resource: /knowledge-base/business/information-model/IMD-002-catalogo-semantico.md
  - id: API-003
    resource: /knowledge-base/design/api-contracts/API-003-semantic-catalog.md
  - id: SEM-US003-D01-D06
    resource: /docs/ux/us-003/decisions.md
  - id: CURRENT-DATABASE
    resource: /codebase/backend/synapse_api/database.py
  - id: DATASET-MIGRATION
    resource: /codebase/backend/synapse_api/datasets/migration.py
---

# DM-003 — Catálogo semántico, control plane local

## 1. Alcance, procedencia y decisiones

Entrada conceptual IMD-002, R-01..08 aceptadas en D05. SQLite existente almacena
datasets en v3; Gold es fuente externa, no destino. Módulo semantic_catalog posee
las tablas nuevas; no modifica ownership de datasets/sources ni KPI sintéticos.
Responsable de negocio aún por asignar, no inferir del creador técnico.

| ID | Decisión y procedencia |
| --- | --- |
| DM3-D01 | Migración aditiva v4, compatible con datos v1–v3, sin down automático. INFERENCE técnica de integración existente y diseño §8. |
| DM3-D02 | Dominios/componentes/KPI agregados separados, referencias N:N normalizadas con tenant y dominio. D03/D05 y D06. |
| DM3-D03 | Binding snapshot persistido, completitud/status del vínculo derivados. Diseño §7 y API-003 SC-D05. |
| DM3-D04 | BEGIN IMMEDIATE para mutaciones y BEGIN para lectura agregada; auditoría/replay/protección atómicos. Patrón Database y diseño §8. |
| DM3-D05 | Idempotencia propia, no reutilizar tablas de dashboards/datasets con FK distinta. Evidencia del esquema y API-003. |
| DM3-D06 | FK RESTRICT y ausencia de eliminación; conservación local no equivale a retención productiva aprobada. D06, política corporativa pendiente. |

Restricciones/nombres físicos siguientes son propuesta técnica, no conceptos de
negocio adicionales ni ADR aprobado. Gate REQUIRES_REVIEW.

## 2. Esquema físico propuesto

TEXT: UUID/timestamps UTC/texto/JSON; INTEGER: version/protected. PK compuestas
incluyen tenant; NOT NULL salvo columnas explícitamente nullable. JSON validado
contra DTO de API-003 antes de escribir. No consultas dinámicas a nombres físicos.

| Tabla | Columnas / constraints |
| --- | --- |
| semantic_domains | tenant_id,id PK; name,normalized_name,description; owner nullable; created_by,created_at,updated_at; version>=1. UNIQUE(tenant_id,normalized_name). |
| semantic_components | tenant_id,id PK; domain_id,kind CHECK dimension/measure; name,normalized_name; metadata_document JSON con definition/grain/unit/aggregation/synonyms; copy_origin_id nullable; protected INTEGER CHECK 0/1 default 0; created_by,created_at,updated_at; version>=1. UNIQUE(tenant_id,domain_id,kind,normalized_name); UNIQUE(tenant_id,domain_id,kind,id); UNIQUE(tenant_id,domain_id,id). |
| semantic_bindings | tenant_id,component_id PK; dataset_id,column_name,dataset_version>=1,snapshot_document; FK a componente y dataset, ambos con tenant. Una fila como máximo por componente. |
| semantic_kpi_definitions | tenant_id,id PK; domain_id,name,normalized_name; metadata_document JSON con escalares de KPI; created_by,created_at,updated_at; version>=1; UNIQUE(tenant_id,domain_id,normalized_name); UNIQUE(tenant_id,domain_id,id). |
| semantic_kpi_components | tenant_id,kpi_id,component_id PK; domain_id,kind CHECK dimension/measure; FK (tenant_id,domain_id,kpi_id) a KPI; FK (tenant_id,domain_id,kind,component_id) a componente. Sin duplicados ni orden semántico. |
| semantic_requests | tenant_id,subject,operation,target_id,key PK; fingerprint,response_document,resource_kind,resource_id,created_at,expires_at. operation CHECK domain.create/component.create/kpi.create/component.copy; target_id="" para altas, ID origen para copia. Recurso polimórfico controlado por servicio, sin FK ficticia a una sola tabla. |

FK de componentes/KPI `(tenant_id,domain_id)`→semantic_domains; FK de origen de
copia `(tenant_id,domain_id,kind,copy_origin_id)`→componentes con columnas únicas
anteriores: preserva tipo/dominio. CHECK copy_origin_id IS NULL OR !=id;
origen asignado sólo al crear copia de un recurso existente, inmutable, sin ciclos.
Todas las FK ON DELETE RESTRICT; FK de bindings apunta a dataset_registry(tenant_id,id),
no a dataset_columns: retirar selección no debe borrar ni romper vínculo histórico.
Binding snapshot sólo metadata de columna seleccionada, nunca muestras/secretos.
Los detalles exactos y límites se definen en API-003, no una segunda lista divergente.

Índices: cada catálogo `(tenant_id,updated_at DESC,id ASC)`; componentes también
`(tenant_id,domain_id,kind,updated_at DESC,id ASC)`; KPI `(tenant_id,domain_id,updated_at DESC,id ASC)`;
referencias inversas `(tenant_id,component_id,kpi_id)`; bindings `(tenant_id,dataset_id)`;
orígenes `(tenant_id,copy_origin_id)`; requests `(expires_at)`. Búsqueda por nombre
normalizado parametrizada, escapar comodines si se usa LIKE para búsqueda literal.

## 3. Invariantes y transacciones

Crear: autorizar, normalizar DTO, BEGIN IMMEDIATE, resolver replay por scope,
comparar fingerprint, validar referencias actuales, insertar filas, auditoría y
respuesta original de replay, commit único. IDs nuevos por servidor. Replay no
vuelve a resolver binding vigente ni produce una segunda auditoría.
Autorizar acceso a metadatos antes de devolver replay con snapshot; permisos actuales
pueden impedir devolución aunque el alta anterior hubiera sido autorizada.

Editar: mismo write lock, recurso del tenant, comprobar versión y protección,
validar referencias cambiadas, actualizar filas/versión y auditoría en la misma
transacción. Un componente usado queda protegido permanentemente; al marcarlo no
se altera metadata/version de contenido. Escribir referencia de KPI y flag protected
es indivisible. Sin trigger que desproteja al retirar referencias. No copiar flag
ni consumidores al crear copia. Copiar conserva snapshot histórico, origen inmediato
y contenido; no valida binding como nuevo salvo cambio explícito posterior.

GET/list/consumers: BEGIN de lectura consistente para objeto, refs, componentes,
bindings y versiones actuales del dataset. API decide visibilidad de detalle
físico según scopes. Cambios externos generan warnings/faltantes sin mutar snapshot,
versión ni auditoría del objeto; estado de documentación no es estado publicado.

Completeness/status/governanceValidation son DTO derivados (draft/pending), no
fuente duplicada de verdad. No conservar fórmulas en auditoría ni tokens en tablas.
Operaciones SQL sólo parametrizadas y nombres de tablas fijos del módulo.

## 4. Migración, despliegue y recuperación

`apply_v4(connection)` requiere transacción activa; ejecutar DDL statement a
statement y registrar schema_migrations=4 al final. Inicialización admite versiones
1/2/3/4; primero completa v3 si falta, después v4, sin IF NOT EXISTS que esconda
un esquema parcial. Inicializar v4 dos veces no duplica ni reejecuta la migración.
Rechazar versiones futuras antes de cualquier DDL. Fallo en DDL/auditoría: rollback,
sin schema version adelantada, filas parciales ni replay de operación fallida.

Antes de migrar una base valiosa: backup consistente vía sqlite3 backup API (incluye
estado confirmado en WAL), abrir copia en ubicación nueva y probar restore. No
copiar sólo archivo principal mientras hay WAL activo. Medir conteos/checksums de
fuentes/datasets/fixtures/dashboard antes/después y ejecutar foreign_key_check e
integrity_check. No ejecutar sobre base manual sin autorización específica.

Rollback no destructivo: detener únicamente instancia propia, conservar base v4,
restaurar backup en archivo nuevo, comprobar integridad y cambiar configuración
de esa instancia tras autorización. Binario viejo rechaza v4: no prometer rollback
de código sin restore. No DROP/TRUNCATE, eliminación de backups ni down automático.
Restauración pierde cambios posteriores al backup: comunicar y conservar v4 para
recuperación, no inventar RPO/RTO productivos.

Requests expirados dejan de servir replay tras 24 h; no borrar definiciones ni
auditoría como efecto de expiración. Limpieza física/retención/residencia productiva
requiere decisión adicional; no programar purgas silenciosas en este incremento.

## 5. Verificación, riesgos y handoff

Pruebas T2/T3/T7: migrar copia v3 poblada; idempotencia de initialize; fallo DDL
intermedio; versiones futuras; PK/FK y tenant/domain/type cruzados; dos writers con
barreras; reads de un solo snapshot; replay tras reinicio; restauración consistente;
componente usado y copia; dataset cambia sin reanclado. Conteos/resultados aún no
ejecutados; esto es diseño, no script migratorio ni prueba satisfactoria.

Riesgos: nombres/metadata declarativa sensible, tamaño de listas/respuestas, SQLite
writer único, evolución futura de fórmula ejecutable. No hay promesa de escala
productiva; límites API acotan el incremento local. Manejar busy/IO con 503 seguro.

Trazabilidad R-01/02→domain FK; R-03/04→binding opcional; R-05/06→copy_origin;
R-07/08→semantic_kpi_components. Diseño §8→migración/locks/replay/audit;
§7→snapshot; §9→tenant. Cada tabla tiene un consumidor en API-003, sin artefactos
de publicación anticipados. Gate REQUIRES_REVIEW: revisión local de usuario y
desarrollo antes de migrar. Handoff y pruebas en
[plan](../../../docs/superpowers/plans/2026-10-16-us-003-semantic-catalog-plan.md),
[API-003](../api-contracts/API-003-semantic-catalog.md),
[UX](../../../docs/ux/us-003/README.md). No verificador humano inventado ni ADR nuevo.
