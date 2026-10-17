---
type: API Contract
id: API-004
title: Modelos y borradores semánticos
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: api-designer/0.2.0
  at: 2026-10-17T14:44:13-05:00
sources:
  - id: US004-DESIGN
    resource: /docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md
  - id: API-003
    resource: /knowledge-base/design/api-contracts/API-003-semantic-catalog.md
  - id: BRC-002
    resource: /knowledge-base/business/rules/BRC-002-gobierno-publicacion-modelo-semantico.md
---

# API-004 — Propuesta aditiva para revisión

## 1. Alcance y decisiones

Primera entrega local, sin publicación ni ejecución. Las decisiones MD-01–06 son
inferencias técnicas propuestas para cumplir la especificación; no nuevos acuerdos
empresariales ni cambios a ADR. Faltan revisión técnica/seguridad y aprobación del
plan antes de ejecutar. No existe handoff READY_FOR_DEV ni arquitectura productiva
aprobada; no se fabrican esos artefactos.

| ID | Propuesta / fundamento |
|---|---|
| MD-01 | Namespace `/api/v1/semantic-models`, separado de fixtures `/kpis` y US-003. Aditivo, sin migrar consumidores. |
| MD-02 | Principal existente: tenant/subject sólo de identidad verificada. Scopes nuevos `models:read`/`models:write`; lectura además semantic:read/datasets:read/sources:read para evitar filtración de capturas; escritura además semantic:write. Sólo administradores locales reciben los nuevos scopes en modo desarrollo. No equivale a roles de aprobación productiva. |
| MD-03 | Identificadores UUID del servidor; nombre trim/NFC imprimible 1..100, único casefold por tenant/dominio. Descripción hasta 2000. Selección 0..100 KPI UUID distintos; máximo 1000 componentes únicos y 8 MiB de captura UTF-8 canónica, rechazo explícito sin truncar. Límites operativos propuestos. |
| MD-04 | Concurrencia mediante revisión técnica y ETag; confirmación exige también digest SHA-256 de la captura candidata. Digest no es credencial ni autorización. |
| MD-05 | POST persistente idempotente 24 h, clave ASCII imprimible 1..100, por tenant/subject/operación/destino, normalizando orden de selección. Replay recupera respuesta original sólo tras autorización vigente; no repetir captura con catálogo cambiado. |
| MD-06 | No SemVer publicado en este corte: `sequence` identifica Borrador N; `revision` controla edición; `semanticVersion` null. Completitud separada de estado draft. |

## 2. Recursos y DTO

JSON camelCase, DTO estrictos, extra=forbid; errores con envelope existente y requestId.
Model: `id,domainId,name,description,createdBy,createdAt,updatedAt,revision`.
Draft: `id,modelId,sequence,revision,status='draft',semanticVersion=null,kpiIds,
capture,captureDigest,capturedAt,createdBy,createdAt,updatedAt,parentDraftId`.
Capture: `domain` (id/version/name), `kpis[]`, `components[]`; cada entidad incluye
id/version y contenido declarativo API-003 permitido. Componentes incluyen
bindingSnapshot histórico y su referencia, nunca filas de negocio ni credenciales.
Excluir atributos volátiles consumerCount/protected y advertencias dinámicas del
digest. Guardar procedencia como histórica, no como carga actual ni certificación.

Toda lectura aplica permisos vigentes, incluso replay y comparación histórica.
Con scopes insuficientes no devolver cuerpo de captura parcialmente autorizado.
Referencias se comprueban en tenant actual; resolución oculta/no existente devuelve
404 genérico, tipo/dominio incorrecto visible 422. No ampliar IAM actual ni prometer
seguridad por fila/columna productiva no implementada.

| Método y ruta relativa | Entrada | Resultado |
|---|---|---|
| GET `/` | q hasta 100, domainId opcional, limit 1..100 default25, offset>=0 | ModelPage items/total/limit/offset; orden updatedAt DESC,id ASC. Cada item incluye latestDraft resumen. |
| POST `/` | CreateModel{name,description='',domainId,kpiIds=[]}; Idempotency-Key | 201 ModelDetail{model,draft}; modelo y Borrador1 atómicos, Location. |
| GET `/{modelId}` | — | ModelDetail con último borrador, ETag de modelo. |
| GET `/{modelId}/drafts` | limit/offset anteriores | DraftPage por sequence DESC,id ASC, sólo resúmenes, no todo el contenido. |
| GET `/{modelId}/drafts/{draftId}` | — | Draft, ETag de borrador. |
| POST `/{modelId}/drafts` | CloneDraft{sourceDraftId}; Idempotency-Key, If-Match modelo | 201 nuevo borrador copiado del origen guardado; incrementa modelo y secuencia. No relee catálogo para reemplazar captura. |
| POST `/{modelId}/drafts/{draftId}/preview` | PreviewDraft{kpiIds}; If-Match borrador | 200 Preview{candidateDigest,candidateCapture,changes,checkedAt,baseRevision}; no persistencia ni actualización. |
| PUT `/{modelId}/drafts/{draftId}` | UpdateDraft{kpiIds,candidateDigest}; If-Match borrador | 200 Draft confirmado; sólo último borrador editable; anteriores no cambian. |
| GET `/{modelId}/compare` | leftDraftId,rightDraftId | Comparison{left,right,changes}; sin lectura de catálogo ni mutación. |

No cambiar nombre/dominio ni borrar modelos en este corte; la selección puede
cambiarse en el último borrador mediante preview/confirmación. Cliente propone IDs,
nunca captura arbitraria: servidor reconstruye la candidata dentro de una transacción,
verifica digest/revisión y aplica exactamente contenido revisado o rechaza.
Changes: lista `{kind:'kpi'|'component'|'domain',id,field,change:'added'|'removed'|'modified',before,after}`
ordenada kind/id/field; field es ruta declarativa permitida, no SQL arbitrario.
Comparación estructural, nunca equivalencia matemática de fórmulas.

Resúmenes: latestDraft y DraftPage usan `{id,sequence,revision,status:'draft',
semanticVersion:null,capturedAt,updatedAt,kpiCount,componentCount}`. ComponentCount
cuenta IDs únicos. Diff no incluye fecha de comprobación como diferencia de negocio.
Preview baseRevision coincide con revisión del borrador consultado. Completeness y
missingMetadata se derivan sólo de declaraciones capturadas con las reglas de
API-003, sin recalcular desde el catálogo actual ni afirmar preparación para publicar.

## 3. Errores, seguridad y recuperación

- 401 identidad; 403 scope insuficiente; 404 recurso oculto; 422 entrada, referencia,
  versión/digest mal formado; 409 name_conflict/idempotency_conflict/capture_changed/
  draft_not_editable/capture_too_large; 412 version_conflict; 428 precondition_required.
- POST/PUT application/json y límite real de solicitud 262144 bytes → 415/413,
  medido incluso chunked; no registrar cuerpos. GET no acepta parámetros desconocidos.
- `capture_changed` no aplica nada: devolver código, no captura nueva automática;
  usuario vuelve a comparar. 412 preserva edición local. PUT de selección idéntica
  sigue exigiendo digest/revisión; respuesta confirmada no depende de GET posterior.
- Captura en conexión SQLite única/BEGIN, no GET HTTP por dependencia. Todas las
  lecturas de una respuesta deben corresponder a una transacción coherente.
- Sólo el último borrador se actualiza. Anteriores comparables pero read-only.
  Nueva versión y update concurrentes se serializan y vuelven a comprobar editabilidad.

## 4. Evidencias exigidas y rollout

Pruebas de contrato: límites, permisos/revocación, replay original, drift entre
preview y PUT, 412/428, cambio de último borrador, referencias ocultas, comparación
histórica sin catálogo y límites de bytes. Ninguna ejecución SQL/fórmula ni conector.
Auditoría tenant-scoped de crear/copiar/actualizar; no contenido de fórmula en logs.
Retención laboratorio sin purga durante la prueba. Producción bloqueada por gates
BRC-002 y revisión pendiente del presente contrato.

Persistencia: [DM-004](/knowledge-base/design/data-models/DM-004-semantic-model-drafts.md).
Handoff propuesto: [plan](/docs/superpowers/plans/2026-10-17-us-004-model-versions-plan.md).
Sin resultados de pruebas de implementación ni revisión independiente declarados.
