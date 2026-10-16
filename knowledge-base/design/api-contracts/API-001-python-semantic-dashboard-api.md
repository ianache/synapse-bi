---
type: API Contract
id: API-001
title: API Python de consultas semánticas y dashboards
description: Contrato implementado para el primer recorrido del analista, con decisiones de desarrollo explícitas y revisiones pendientes.
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: agent/codex
  at: 2026-10-16T02:49:08-05:00
sources:
  - id: US-005
    resource: /knowledge-base/requirements/user-stories/US-005-resolver-consulta-semantica.md
  - id: US-006
    resource: /knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md
  - id: US-009
    resource: /knowledge-base/requirements/user-stories/US-009-aplicar-aislamiento-por-tenant.md
  - id: ADR-001
    resource: /knowledge-base/architecture/ADR-001-arquitectura-de-servicios.md
  - id: ADR-003
    resource: /knowledge-base/architecture/ADR-003-fuente-maestra-semantica.md
  - id: ADR-009
    resource: /knowledge-base/architecture/ADR-009-contratos.md
  - id: ADR-018
    resource: /knowledge-base/architecture/ADR-018-separacion-control-plane-data-plane.md
---

# API-001 — Primera entrega del backend Python

## Alcance, contexto y procedencia

El usuario solicitó construir el backend desde cero en Python después de
implementar el recorrido Explorar KPI → Añadir a dashboard. Esta entrega cubre
lectura de catálogo publicado, consulta, persistencia de dashboards personales,
referencias a KPI versionadas y aislamiento en esas operaciones. No implementa
US-001–US-004 de administración/publicación ni el alcance completo de US-009
(exports, jobs, caches e IA). Los ADR de entrada son propuestas, no decisiones
aprobadas; no se cambia su estado.

Fuentes internas de requisitos: US-005/006/009 y ADR-001/003/009/018. Su estado
`draft`/`CONDITIONAL` sigue vigente. La solicitud de Python es una instrucción
humana de esta conversación; la elección de framework/almacén local y la
semántica de endpoints son propuestas de implementación del agente.

## Decisiones de implementación

| ID | Elección | Razón y procedencia |
| --- | --- | --- |
| API-D01 | Python + FastAPI modular | Python solicitado; framework inferido para DTO/OpenAPI y pruebas. No impone microservicios físicos. ADR-001/009. |
| API-D02 | SQLite de desarrollo, esquema v1 | Persistencia local ejecutable sin infraestructura adicional; inferencia reversible, no selección del motor productivo. ADR-018. |
| API-D03 | Registro de KPI publicado, versionado y tenant-scoped | US-005 y ADR-003; seed sintético opt-in sustituye temporalmente el flujo de publicación no construido. |
| API-D04 | JWT RS256/OIDC por defecto | US-009; issuer/audience/exp/tenant/sub validados. Mapeo exacto de scopes es provisional. |
| API-D05 | Sesión dev sólo con configuración explícita, loopback y origen permitido | Inferencia para probar sin un IdP; prohibida en production. |
| API-D06 | Dashboard privado por defecto; compartidos visibles al mismo tenant; edición sólo del propietario con scope | Política mínima propuesta del agente para probar US-006/009. No constituye aprobación de una ACL empresarial. |
| API-D07 | If-Match, idempotencia de creación y unicidad de widgets | Inferencia para proteger reintentos y escrituras concurrentes. |
| API-D08 | Calidad/frescura sin evaluar; no inventar umbrales ni bloqueo | Vacío US-005-Q1. Se expone origen y fecha disponible sin afirmar certificación. |
| API-D09 | Contrato v1; camelCase y errores uniformes | ADR-009 propuesto. Cambios incompatibles requieren nueva versión de API. |

## Recursos, DTO y ejemplos

El contrato ejecutable se genera directamente desde los modelos y rutas de
[`app.py`](../../../codebase/backend/synapse_api/app.py) y
[`schemas.py`](../../../codebase/backend/synapse_api/schemas.py) en
`GET /openapi.json`. Swagger UI se sirve en `/docs`.
La [guía del backend](../../../codebase/backend/README.md) documenta todas las
rutas, parámetros, headers, configuración y ejemplos PowerShell.

| ID | Recurso / operación | Trazabilidad |
| --- | --- | --- |
| API-R01 | GET /api/v1/kpis y /kpis/{id} | US-005, US-012 parcial; descubrimiento del recorrido acordado. |
| API-R02 | POST /api/v1/queries | US-005, BR-009/012. |
| API-R03 | GET/POST /api/v1/dashboards; GET /dashboards/{id} | US-006. |
| API-R04 | PUT/DELETE /dashboards/{id}/widgets/{kpiId} | US-006, contrato semántico versionado. |
| API-R05 | GET /me; scopes y tenant de todas las operaciones | US-009 parcial. |

Consulta mínima:

```json
{"kpiId":"kpi_fin_net_revenue","modelVersion":1,"startDate":"2026-10-01","endDate":"2026-10-03"}
```

Resultado: valor decimal textual `3100.00`, unidad `PEN`, modelo `sales-demo`
v1, `dataMode: synthetic`, fecha de último registro, lineage y estados de
calidad/frescura `not_evaluated`. Es un resultado calculado desde datos de
ejemplo, no evidencia de un KPI corporativo aprobado.

Paginas: items/total/limit/offset, máximo 100 por página. Consultas: fechas
ordenadas y hasta 366 días; agrupación channel/product sólo si el KPI la
permite. La conversión agrega numeradores y denominadores, no promedia tasas.
No se acepta SQL del cliente.

## Errores, concurrencia e idempotencia

- 401 autenticación, 403 permiso, 404 recurso inexistente/no visible.
- 409 nombre/clave en conflicto; 412 versión obsoleta; 428 falta If-Match.
- 422 input fuera de contrato; 503 dependencia no disponible.
- Todos usan error.code/message/requestId y Cache-Control no-store.
- POST dashboard admite Idempotency-Key por tenant/subject; misma clave y
  contenido reutiliza el recurso, contenido distinto devuelve 409.
- PUT widget es único por tenant/dashboard/KPI. Con versión actual, repetir
  el mismo KPI/versión no crea duplicado. If-Match obsoleto siempre da 412.
- SQLite BEGIN IMMEDIATE más versión evita perder actualizaciones concurrentes.

## Seguridad, privacidad y observabilidad

La identidad se deriva de JWT validado; X-Tenant-ID y payloads no establecen el
tenant. Todas las consultas de recursos y hechos están acotadas al tenant;
widgets tienen claves foráneas compuestas. Dashboards privados de otro usuario
y recursos de otro tenant devuelven 404 sin revelar existencia.

JWT acepta sólo RS256 en OIDC. Se requiere exp/iat/sub/tenant_id/iss/aud;
JWKS usa URL HTTPS configurada, no URLs del token. En desarrollo se usa una
clave efímera HS256 y el endpoint local explícito; nunca se mezcla ese
algoritmo con la verificación OIDC.

Auditoría persistente de consultas y mutaciones: tenant, subject, acción,
recurso, request ID y timestamp. No registra tokens ni payloads. Errores
inesperados devuelven mensaje genérico y request ID. CORS tiene orígenes
explícitos. Retención de auditoría y controles operacionales siguen pendientes.

## Integración, compatibilidad y reversión

`VITE_DATA_SOURCE=api` activa el adaptador HTTP y la persistencia servidor. El
modo local anterior se conserva si no se configura esa variable. En modo API,
un fallo nunca se sustituye por fixtures locales. Los tokens de desarrollo
permanecen en memoria. El adaptador expone callback getAccessToken para una
integración OIDC posterior del navegador; no hay login SSO productivo completo.

Clasificación: endpoints v1 aditivos; la integración frontend es opt-in. El
estado local previo no se migra automáticamente ni se elimina. Para volver a
la demo local, retirar VITE_DATA_SOURCE=api y reiniciar Vite; no se borra la base
de datos. Se requiere estrategia de migración/backup antes de evolucionar el
esquema o desplegar para usuarios reales.

## Evidencia y revisión

Pruebas fuente en [`backend/tests`](../../../codebase/backend/tests) y
[`tests/api-integration`](../../../codebase/tests/api-integration). Cubren
firma/claims/scopes, aislamiento, visibilidad privada, consultas, errores,
idempotencia, conflictos y persistencia. La verificación del frontend cubre
crear dashboard, añadir KPI, calcular valor/canal y recuperar desde otro
contexto del navegador sin localStorage.

Este documento no tiene `verified` humano. Gate REQUIRES_REVIEW: el código
puede evaluarse localmente; no declara US-005/006/009 completas en producción.

Ejecución del agente el 2026-10-16: 30 pruebas Python aprobadas en el entorno
aislado de `uv.lock`, 32 pruebas de frontend aprobadas, 7 pruebas smoke y 3 de
integración con la API aprobadas. TypeScript y build Vite pasan. Los checks axe
cubren las pantallas previas en escritorio/móvil y el dashboard conectado.
Pytest informa una deprecación de httpx/Starlette y una advertencia de permisos
de caché en este entorno; no hubo pruebas omitidas ni fallidas en la ejecución
final. El problema de permisos del directorio temporal compartido se resolvió
usando un directorio nuevo para esa ejecución, sin borrar archivos existentes.

## Vacíos y siguiente acción

| ID | Pendiente | Responsable |
| --- | --- | --- |
| API-Q01 | Fuente empresarial y primer modelo/KPI aprobado | Producto / Data Governance. |
| API-Q02 | Proveedor OIDC, claims, roles y ACL compartida | Seguridad / Producto. |
| API-Q03 | Motor productivo, migraciones y operación | Arquitectura. |
| API-Q04 | Política de calidad/frescura, NFR y retención | Producto / Data Governance / Seguridad. |

Handoff implementable de esta entrega: guía del backend, OpenAPI ejecutable,
schemas y pruebas enlazados. No se abre una aprobación arquitectónica ficticia;
las decisiones provisionales y vacíos deben revisarse antes de producción.
