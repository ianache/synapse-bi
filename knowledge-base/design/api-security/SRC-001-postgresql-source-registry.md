---
type: API Security Review
id: SRC-001
title: Registro PostgreSQL y observaciones técnicas
description: Contrato aditivo, revisión de controles y guía de implementación local de US-001.
status: draft
version: 0.1.0
gate_status: REQUIRES_REVIEW
generated:
  by: agent/codex
  at: 2026-10-16T12:30:59-05:00
sources:
  - id: US-001
    resource: /knowledge-base/requirements/user-stories/US-001-registrar-fuente-y-observar-esquema.md
  - id: DM-001
    resource: /knowledge-base/design/data-models/DM-001-retail-gold-study.md
  - id: SRC-IMPLEMENTATION
    resource: /codebase/backend/synapse_api/sources.py
  - id: SRC-CONNECTOR
    resource: /codebase/backend/synapse_api/source_connector.py
  - id: SRC-UI
    resource: /codebase/apps/bi-analytics/src/pages/SourcesWorkspace.tsx
---

# SRC-001 — Registro y observación PostgreSQL

## Resumen y alcance

Incremento local funcional de US-001: listado → registrar/validar → detalle e
historial → explorar esquema. PostgreSQL es el primer conector, seleccionado
para el laboratorio solicitado por el usuario. No se declara una fuente
empresarial certificada, una aprobación del PO ni un despliegue productivo.
US-002 (datasets), US-003 (semántica) y publicación siguen fuera de alcance.

Las cuatro pantallas siguen el proyecto
[Stitch 4378861557064448535](https://stitch.withgoogle.com/projects/4378861557064448535):
`0bc51d5f422441e1a4b23fb9fff8b406`, `aceb9c51c597465b8e102f7e778fa494`,
`1c06b88026ec43fab488071d868741c1`, `f77357abdce045dca411ebc9a30ccdce`.
Se conservó Crimson Slate; las filas y estados ilustrativos se sustituyeron
por información persistida y errores reales. No se afirma identidad de píxel.

## Actores, fronteras y decisiones provisionales

| ID | Control / decisión | Procedencia y motivo |
| --- | --- | --- |
| SRC-D01 | Scopes `sources:read`, `sources:write`, `sources:observe` separados del analista | Inferencia de mínimo privilegio para US-001/009; pendiente mapeo IAM empresarial. |
| SRC-D02 | Recursos siempre consultados por tenant del JWT; otro tenant recibe 404 | US-009 y patrón ya implementado en API-001. |
| SRC-D03 | Prueba de conexión obligatoria, 10 minutos, ligada a tenant/subject y HMAC de parámetros + secreto | Inferencia para impedir registrar otra conexión usando una prueba ajena u obsoleta. El servidor consume la prueba en la transacción de registro. |
| SRC-D04 | Fernet, clave fuera de SQLite; contraseña solo de entrada | Inferencia de seguridad para el prototipo. Nunca incluir secretos en DTO de salida, errores o auditoría. |
| SRC-D05 | Allowlist de host/puerto y dirección IP fijada por operador | Control de SSRF; `hostaddr` evita resolver un destino aportado libremente por el cliente. No se acepta DSN ni opciones libpq del usuario. |
| SRC-D06 | TLS verify-full; excepción sin TLS solo en development/test + loopback + laboratorio explícito | Inferencia para compatibilidad con Docker local, no política aprobada de producción. |
| SRC-D07 | Cuenta sin privilegios elevados ni escritura sobre los objetos/esquemas seleccionados; transacción read-only | Defensa en profundidad; el laboratorio ofrece logins lectores con RLS. No es auditoría completa de todos los privilegios de la cuenta. |
| SRC-D08 | Observaciones inmutables y numeradas, ligadas a versión de conexión | US-001/BR-002. No equivalen a una versión semántica ni crean registros en el catálogo KPI. |
| SRC-D09 | Máximo 200 objetos, 5000 columnas/restricciones, 2 MB; conexión 3 s y statement timeout 5 s | Límites provisionales del laboratorio; rechazar excesos, no truncar silenciosamente. No es un SLA. |
| SRC-D10 | Migración SQLite v1→v2 aditiva, edición con If-Match | Compatibilidad con dashboards previos y protección frente a sobrescritura concurrente. |

Fronteras: navegador → JWT/API → registro SQLite y archivo de clave → destino
PostgreSQL autorizado. Sólo el backend abre conexiones de base de datos.
Los comentarios de PostgreSQL son texto técnico no confiable, renderizado
como texto por React; no se interpretan como HTML ni semántica validada.

## Contrato implementado

Prefijo `/api/v1/sources`; camelCase, errores uniformes de API-001, no-store.
Los modelos de entrada ejecutables están en `sources.py`; OpenAPI en `/docs`.

| Método y ruta | Scope | Resultado |
| --- | --- | --- |
| GET `/` | read | `{items}` del tenant, ordenados por nombre; máximo 500, error 413 si se excede. |
| POST `/test` | write | Parámetros + password; devuelve testId, validUntil, serverVersion, schemas. No registra fuente. |
| POST `/` | write | Nombre, descripción, parámetros, password y testId; 201, consume prueba. Nombre único por tenant. |
| GET `/{id}` | read | Conexión sin contraseña/cifrado, credentialConfigured, estado y versión. |
| PUT `/{id}/connection` | write | Mismo cuerpo que creación; nueva contraseña y prueba, If-Match obligatorio, incrementa versión. |
| POST `/{id}/test` | write | Prueba la credencial almacenada; actualiza estado sin devolverla. |
| POST `/{id}/observations` | observe | Instantánea síncrona acotada; 201; fallo técnico registra entrada fallida sin destruir instantáneas previas. |
| GET `/{id}/observations` | read | Últimas 100 entradas, éxitos y fallos. |
| GET `/{id}/observations/{observationId}` | read | Instantánea histórica completa o 404. |

Parámetros: host, port, database, username, schemas (1–10 explícitos), tlsMode
(`verify-full`/`disable`), laboratory. El secreto nunca se acepta como URL.
Pruebas se invalidan en la UI al cambiar conexión o contraseña; servidor lo
comprueba independientemente. Editar exige introducir la nueva credencial,
no recuperar la anterior. Las instantáneas antiguas se señalan si la conexión
cambió. Los listados no usan paginación ilimitada ni sustituyen errores por demo.

Metadatos: tablas/vistas, columnas ordenadas, tipo, nullable, generated,
comentarios limitados; PK/UQ/FK/CHECK declaradas y columnas en orden, incluidas
claves compuestas. Sin filas de negocio, muestras, count sobre hechos ni SQL
del usuario. `CHECK` se identifica sin extraer su expresión. Una tabla puede
no verse por falta de SELECT; un esquema vacío no inventa objetos.

Errores principales: 401 sin identidad, 403 sin scope, 404 fuera del tenant,
409 nombre/prueba/configuración en conflicto, 412 If-Match ausente/obsoleto,
413 límites, 422 destino/TLS/cuenta/conectividad inválidos, 503 vault/storage.
No se devuelve el mensaje original de psycopg. Auditoría: tenant, subject,
acción, recurso, request ID y fecha, sin payloads, SQL ni contraseñas.

## Operación local y configuración

Seguir [backend/README](../../../codebase/backend/README.md) y
[case-study/README](../../../codebase/case-study/README.md). Abrir `/fuentes`
con `VITE_API_AUTH=development`; el adaptador solicita persona `data-admin`
sólo en este modo explícito. Analistas normales no reciben scopes de fuentes.
No hay falso conector local si falta el backend.

- Sin configuración extra, development/test permite únicamente localhost o
  127.0.0.1, puerto 55432, IP fijada 127.0.0.1.
- `BI_SOURCE_TARGETS`: JSON de entradas `{host,port,address}` aprobadas por
  operador; producción no tiene destinos por defecto. Ejemplo sin secretos:
  `[{"host":"pg.internal.example","port":5432,"address":"10.10.1.8"}]`.
- `BI_SOURCE_KEY_FILE`: ruta al archivo con clave Fernet. Producción exige
  provisionarlo; development/test genera una clave junto a SQLite si no se fija.
  Guardar la base Y esta clave en backups separados y protegidos. Perder la
  clave impide recuperar credenciales; no regenerarla sobre datos existentes.
- `BI_SOURCE_CA_FILE`: CA administrada por operador para verify-full; por
  defecto se utiliza el almacén `system` de libpq. Nunca viene del cliente.
- `BI_API_PROXY_TARGET`: destino Vite opcional; defecto API local :8000.

Reversión: retirar el enlace o deshabilitar los nuevos scopes, conservar DB y
clave; no bajar el binario a una versión que sólo admite esquema v1. No hay
migración destructiva de vuelta. Los datos de dashboards no se sobrescriben.

## Verificación y trazabilidad

- US-001 AC-1 / BR-002 → observación separada → `test_sources.py` y recorrido
  `tests/sources-integration/sources.spec.ts`; ninguna escritura en catálogo KPI.
- US-009 parcial → tenant/scopes → tests 401/403/404 y recurso de otro tenant.
- SRC-D03/04/10 → prueba ligada, vencimiento, cifrado, reinicio y edición con versión.
- Laboratorio DM-001 → prueba real opt-in `BI_TEST_POSTGRES=true`: 12 tablas,
  4 vistas; fact_sales 16 columnas, PK compuesta y 6 FK.
- Evidencia automatizada y capturas locales se generan con `npm run test:sources`;
  las capturas nunca se toman mientras hay una contraseña en el formulario.

No se fabrica verificación humana ni se cambian los checks de aceptación del PO.
El historial de ejecución final está en el ledger frontend.

## Hallazgos, riesgos y siguiente acción

| ID | Severidad / estado | Responsable y acción |
| --- | --- | --- |
| SRC-F01 | Alta · pendiente para producción | Seguridad: integrar SSO UI, roles/scopes reales y autorización de administradores. El modo desarrollo permite elegir persona local y no debe exponerse. |
| SRC-F02 | Alta · pendiente para producción | Plataforma: vault/KMS, ACL del archivo (en Windows no basta modo POSIX), rotación de claves/credenciales y restore probado. |
| SRC-F03 | Alta · pendiente para producción | Plataforma: egress firewall además de allowlist, rate limiting, cuotas por tenant, concurrencia, métricas y retención de observaciones/auditoría. Los timeouts y límites por petición no sustituyen estos controles. |
| SRC-F04 | Media · pendiente | Producto/Gobierno: confirmar conectores, políticas de metadatos/comentarios sensibles, certificados y asociación entre credencial PostgreSQL y organización. RLS del laboratorio depende del login, no se deriva automáticamente del JWT. |
| SRC-F05 | Media · pendiente | Arquitectura: motor productivo del control plane, migraciones operacionales y jobs asíncronos para esquemas mayores. SQLite y ejecución síncrona son provisionales. |

Gate `REQUIRES_REVIEW`: incremento evaluable localmente; no autorización para
producción. No hay Architecture Context Pack/handoff productivo aprobado para
esta ampliación; este documento y código constituyen evidencia técnica, no lo
sustituyen. Siguiente paso funcional: US-002 registrar datasets explícitos a
partir de una observación seleccionada, tras validar su alcance con Producto.
