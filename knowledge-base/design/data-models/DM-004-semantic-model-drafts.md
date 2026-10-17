---
type: Data Model
id: DM-004
title: Persistencia local de modelos y borradores
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: data-model-designer/0.2.0
  at: 2026-10-17T14:44:13-05:00
sources:
  - id: IMD-002
    resource: /knowledge-base/business/information-model/IMD-002-catalogo-semantico.md
  - id: API-004
    resource: /knowledge-base/design/api-contracts/API-004-semantic-model-drafts.md
  - id: US004-DESIGN
    resource: /docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md
---

# DM-004 — Propuesta de migración aditiva v5

Actualización 2026-10-17: usuario aprobó este contrato junto con API-004 y el plan
para ejecución local; no implica migración de DB manual ni aprobación productiva.

## Alcance y procedencia

Modelo conceptual IMD-002 R-09 aceptado. Persistencia y estructura siguientes son
inferencias técnicas para laboratorio, REQUIRES_REVIEW; no decisión arquitectónica
productiva ni aprobación de seguridad. Ownership del agregado: módulo semantic_models;
catálogo US-003 y datasets siguen siendo propietarios de definiciones originales.

## Decisiones propuestas

| ID | Decisión / fundamento |
|---|---|
| MDM-01 | SQLite local existente, migración aditiva v5; no PostgreSQL de negocio ni Gold. |
| MDM-02 | Dos entidades: modelo agrupa borradores; captura JSON autocontenida por borrador, no joins que cambien historia. |
| MDM-03 | PK/FK compuestas por tenant; BEGIN IMMEDIATE para escrituras y BEGIN explícito para lecturas compuestas. |
| MDM-04 | Sólo última secuencia editable; nueva secuencia copia captura anterior sin refresco del catálogo. SHA-256 canónico excluye timestamps de captura y atributos volátiles. |
| MDM-05 | Tablas nuevas models_* para no alterar semantic_* ni consumidores legacy; no cascadas de borrado. |

## Modelo lógico/físico propuesto

Todos los campos descritos NOT NULL salvo los marcados nullable; tipos TEXT excepto
sequence/revision INTEGER. PK compuesta tenant_id/id donde hay id. Fechas UTC ISO8601.

- `models_registry`: tenant_id,id,domain_id,name,normalized_name,description,
  created_by,created_at,updated_at,revision>=1. UNIQUE(tenant_id,domain_id,normalized_name),
  UNIQUE(tenant_id,domain_id,id), FK(tenant_id,domain_id)→semantic_domains RESTRICT.
- `models_drafts`: tenant_id,id,model_id,domain_id,sequence>=1,revision>=1,
  status CHECK draft, semantic_version TEXT nullable CHECK IS NULL,
  parent_draft_id TEXT nullable,kpi_ids_document,capture_document,capture_digest,
  captured_at,created_by,created_at,updated_at. UNIQUE(tenant_id,model_id,sequence),
  UNIQUE(tenant_id,model_id,id). FK(tenant_id,domain_id,model_id)→models_registry,
  FK(tenant_id,model_id,parent_draft_id)→models_drafts, RESTRICT; no auto-parent.
- `models_requests`: tenant_id,subject,operation,target_id,key,fingerprint,
  response_document,created_at,expires_at. PK(tenant_id,subject,operation,target_id,key).
  operation CHECK model.create/draft.clone; mismo patrón de replay original de API-003.

Índices: models_registry(tenant_id,updated_at DESC,id ASC),
models_registry(tenant_id,domain_id,updated_at DESC,id ASC),
models_drafts(tenant_id,model_id,sequence DESC), models_requests(expires_at).
No FK a cada KPI capturado: histórico preserva identidad/contenido; integridad de
selección se valida en servidor al capturar, dentro de la misma transacción.
Autorización vigente se revalida al leer; persistir captura no fija derechos.

## Captura, consistencia y concurrencia

Canonical JSON: claves ordenadas, UTF-8, sin espacios; listas de entidades por id y
referencias por id, campos textuales preservados normalizados por API-003.
Incluye versión de dominio/KPI/componentes y bindingSnapshot histórico, sin estado
de consumo dinámico. MD-03 limita cantidad y bytes; no truncar ni almacenar secretos.
Preview y PUT reconstruyen igual candidata; PUT compara digest bajo bloqueo antes
de guardar, revalida referencias/permisos y exige ETag del borrador y ser último.
Crear modelo+primer borrador+idempotencia+auditoría es una transacción. Clonar añade
una secuencia, conserva padres y actualiza revisión del modelo atómicamente.
Confirmar update incrementa revisiones de borrador/modelo sin tocar capturas previas.
Comparación guardada/guardada no necesita leer catálogo actual para construir diff.

## Migración, privacidad y recuperación

`apply_v5(connection)` exige transacción activa, DDL con execute individual y registro
5 sólo al terminar. initialize acepta versiones1..5 y rechaza futuras antes de DDL;
ejecutar v3/v4/v5 en orden. Sin reescribir registros previos. Adaptar pruebas que
antes esperaban versión vigente4 para esperar5, manteniendo fixtures v3/v4 históricos.
Pruebas de fallo inyectado prueban rollback sin tablas parciales y versión anterior intacta.

Probar backup/restore con sqlite backup sobre copias nuevas, foreign_key_check e
integrity_check. No migrar/restaurar DB manual del usuario sin backup y autorización.
Rollback operativo: restaurar copia consistente con binario compatible; no borrar
tablas ni bajar schema_migrations in situ. Retención sin purga en laboratorio;
producción exige política aprobada y revisión legal/seguridad. Auditoría mínima usa
audit_events existente; no afirma implementar todo el ciclo de aprobaciones US-004.

## Trazabilidad y gate

GOV004-12→modelo/dominio; GOV004-13→captura/diff; diseño§7→atomicidad/retry;
GOV004-10→retención/privacidad. Validar con pruebas de migración, carrera de escritores,
snapshot de lectores, permisos y reinicio. No pruebas ejecutadas todavía.
Handoff propuesto en [plan](/docs/superpowers/plans/2026-10-17-us-004-model-versions-plan.md).
REQUIRES_REVIEW: revisar límites, representación de borradores y scopes con API-004;
nombramientos/política de retención siguen bloqueando operación productiva.
