---
type: ArchitectureContextPack
id: ACP-002
title: Contexto de arquitectura para identidad y acceso por KPI de US-006
description: Estado actual, impactos y vacíos para el incremento local de identidad Keycloak y autorización por KPI.
status: draft
generated:
  by: architecture-context-builder/1.0
  at: 2026-10-30T00:51:11-05:00
sources:
  - id: RCP-004
    resource: /knowledge-base/requirements/context-packs/RCP-004-us-006-acceso-real-kpi.md
  - id: US-006
    resource: /knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md
  - id: AUTH
    resource: /codebase/backend/synapse_api/auth.py
  - id: API-CONFIG
    resource: /codebase/backend/synapse_api/config.py
  - id: DASHBOARDS
    resource: /codebase/backend/synapse_api/dashboards.py
  - id: API-ROUTES
    resource: /codebase/backend/synapse_api/app.py
  - id: UI-LOGIN
    resource: /codebase/apps/bi-analytics/LOGIN.md
  - id: KEYCLOAK-COMPOSE
    resource: /codebase/case-study/docker-compose.yml
  - id: KC-JS
    resource: https://www.keycloak.org/securing-apps/javascript-adapter
  - id: KC-MAPPERS
    resource: https://www.keycloak.org/admin-api/protocol-mappers
  - id: KC-ADMIN
    resource: https://www.keycloak.org/docs/26.8.0/server_admin/
  - id: KC-26.8
    resource: https://www.keycloak.org/2026/10/keycloak-2680-released
---

# ACP-002 — Identidad real y acceso por KPI para US-006

## 1. Contexto ejecutivo

El incremento de laboratorio US-006 ya permite compartir dashboards con identidades sintéticas dentro del tenant. El API valida JWT/OIDC, pero la interfaz obtiene tokens mediante `/api/v1/auth/dev-session`; todavía no consume Keycloak. No existe autorización individual por KPI. El usuario aprobó iniciar un incremento local con cuentas administradas en Keycloak y permisos KPI mantenidos por BI. Solo el propietario puede conceder permisos KPI en su dashboard; se propone que también pueda revocarlos.

## 2. Alcance

**Incluido para el incremento local:** conectar la sesión de BI con el Keycloak comunitario 26.8 ya desplegado; asociar identidad autenticada a tenant; admitir grants por persona y KPI en contexto de dashboard; filtrar catálogo, metadatos y resultados en el servidor; administrar grants solo desde el propietario del dashboard; aplicar revocaciones en las siguientes solicitudes; conservar auditoría y aislamiento.

**Fuera de alcance por ahora:** federación con directorio corporativo, disponibilidad/soporte de Red Hat, despliegue productivo, alta masiva/provisionamiento corporativo, permisos por grupos, exportaciones y cambio del motor de consulta. El piloto sigue usando la base BI local de laboratorio; Keycloak conserva su base en PostgreSQL y esquema `keycloak`.

## 3. Requisitos y decisiones de negocio vinculadas

- Compartir un dashboard y autorizar cada KPI son controles acumulativos; el invitado no edita.
- El lector solo puede conocer KPI presentes en el dashboard y autorizados para él. Si no queda ninguno, la respuesta no revela identificadores, nombres ni cantidades ocultas.
- La revocación de dashboard o KPI rige desde la siguiente solicitud/recarga; contenido ya recibido no puede borrarse retroactivamente.
- Identidades administradas directamente en Keycloak para este incremento; sin federación.
- Solo el propietario del dashboard puede conceder y retirar permisos por KPI en ese dashboard.
- Keycloak usa la imagen comunitaria `keycloak/keycloak:26.8` en laboratorio, con la misma instancia PostgreSQL y esquema propio `keycloak`; no equivale a Red Hat build/support.

## 4. Evidencia y AS-IS

### Aplicaciones

- React/Vite sirve la UI; las rutas API usan un adaptador FastAPI.
- `ApiRepository` pide una sesión de desarrollo cuando se activa `VITE_API_AUTH=development`; de lo contrario requiere un proveedor de token inyectado.
- `/login` es una pantalla y punto de salida SSO; `LOGIN.md` deja el flujo OIDC real, callback y sesión como trabajo pendiente.

### Integración

- `Authenticator` admite JWT HS256 de desarrollo y JWT RS256 OIDC; exige `sub`, `tenant_id`, `iss`, `aud`, `iat`, `exp`, y consume `scope`.
- Configuración OIDC existente acepta issuer, audience y clave/JWKS. JWKS requiere HTTPS, por lo que el endpoint local HTTP de Keycloak necesita una excepción estricta de desarrollo o un proxy TLS de laboratorio.
- FastAPI expone el directorio sintético de lectores y mutaciones de `dashboard_readers`.
- Keycloak Compose ya se conecta a PostgreSQL `bi_analytics`, schema `keycloak`, en `start-dev` y puerto loopback. El servicio no está conectado a la UI/API.

### Datos y seguridad

- Dashboards, widgets, lectores, consultas y auditoría de BI están en SQLite; todos los accesos existentes filtran por tenant y subject.
- Las escrituras de propietario usan `dashboards:write`; lectura de catálogo exige `catalog:read`, consulta exige `queries:execute`; el tenant procede del claim firmado.
- El DTO del dashboard actualmente devuelve widgets según scope de catálogo, no ACL individual por KPI.
- La búsqueda de lectores usa una lista sintética local; no hay cliente administrativo Keycloak ni catálogo real de usuarios.

## 5. Impacto trazado

| Requisito | Elementos afectados | Impacto | Evidencia / observación |
|---|---|---|---|
| Autenticar mediante Keycloak | Login React, ApiRepository, FastAPI Authenticator, client/realm Keycloak | DIRECT | `LOGIN.md`, `apiRepository.ts`, `auth.py`, Compose |
| Tenant confiable por usuario | Token mapper, `Principal`, todas las consultas filtradas | DIRECT | `tenant_id` obligatorio hoy; debe mapearse desde atributo gobernado |
| Grant individual por dashboard/KPI | UI Share/Edit, rutas catalog/serving/dashboard, SQLite migrations, auditoría | DIRECT | `dashboard_readers`, `widgets`, `audit_events` actuales |
| Solo el propietario concede y revoca grants | Autorización API y operaciones de grants | DIRECT | Propietario ya se valida; administración central de grants queda fuera |
| Ocultar KPI y metadatos sin permiso | catálogo, detalle KPI, dashboard DTO, ejecución semántica y errores | DIRECT | control actual cubre scope/tenant, no ACL por persona |
| Keycloak aislado en esquema PostgreSQL | Compose, bootstrap de realm/clients y secretos locales | DIRECT | servicio y esquema ya existen; no compartir tablas con BI |
| Desactivación o cambio de tenant | duración/validación token, administración y auditoría | UNKNOWN | expiración de access token introduce latencia de baja no definida |

## 6. Restricciones, estándares y deuda

- No confiar en tenant, subject, scopes ni role enviados por el navegador; derivarlos de firma/claims validados.
- Mantener el principio de mínimo privilegio y verificar autorización en toda ruta directa de catálogo, metadatos, consulta y dashboard.
- Identificar usuarios por `sub` estable de Keycloak, no por email/username mutable.
- No mezclar datos de negocio BI con tablas de Keycloak; usar schema `keycloak` exclusivamente para el servidor de identidad.
- Keycloak JavaScript adapter documenta cliente público para SPA, authorization code y PKCE S256; no poner secretos de cliente en `VITE_*` ni persistir tokens en localStorage.
- Deuda: JWKS exige HTTPS aunque el laboratorio corre por HTTP loopback; no hay sesión OIDC en frontend; `Principal.scopes` no contiene roles; tests OIDC validan claims sintéticos y no servidor Keycloak real.

## 7. Riesgos y supuestos

- **Riesgo alto:** un permiso aplicado solo en la UI dejaría disponibles rutas directas; se debe centralizar el chequeo de dominio y cubrir APIs completas.
- **Riesgo alto:** usar `email` como identidad rompe revocación/ownership ante cambios de correo; usar `sub`.
- **Riesgo medio:** deshabilitar usuario no invalida instantáneamente JWT offline; definir tolerancia mediante expiración/renovación o introspección antes de producción.
- **Supuesto del diseño local:** Keycloak tiene usuarios creados manualmente y un atributo único `tenant_id`; un mapper lo publica como claim firmado. Las cuentas de prueba no modelan gobierno de directorio real.
- **Decisión técnica propuesta:** realm local dedicado a BI; consulta de destinatarios vía Admin REST API desde el backend con service account limitado a `query-users` y `view-users`, sin `manage-users`; filtrar por tenant antes de responder. El permiso `view-users` puede exponer usuarios de todo el realm a esa cuenta, por eso el realm no comparte otras poblaciones.
- **Supuesto del diseño local:** el permiso se limita a un KPI dentro de un dashboard concreto. El propietario administra solo sus dashboards; no hay una autoridad central de grants en este incremento.
- **Supuesto del diseño local:** una revocación del propietario elimina la concesión efectiva; se registra actor y request en auditoría.

## 8. Preguntas pendientes

| Pregunta | Responsable | Estado |
|---|---|---|
| ¿Quién administra usuarios y asigna `tenant_id` en un entorno corporativo? | Identidad / Seguridad | Abierta; fuera del laboratorio |
| ¿Qué latencia de baja/desactivación de usuario se admite en producción? | Seguridad / Producto | Abierta |
| ¿Se necesita una herramienta administrativa central de grants en otro incremento? | Producto / Seguridad | Fuera del alcance actual; solo el propietario gestiona grants |
| ¿Qué ambiente y criterios de aceptación productiva aplican? | Producto / Operaciones | Abierta; este pack se limita al laboratorio local |
| ¿Qué metadatos sensibles, retención y consultas de auditoría se requieren? | Seguridad / Operaciones | Abierta |

## 9. ASR candidatos (no aprobados)

- Autorización uniforme por sujeto, tenant, dashboard y KPI en catálogo, metadatos y ejecución.
- Revocación individual con latencia acotada y consistente entre nuevas solicitudes.
- Separación entre identidad (Keycloak) y autorización de negocio (BI).

## 10. Revisión crítica

La evidencia permite describir con confianza el API y el servicio local actual. La decisión del usuario cubre la autoridad de grants y la fuente directa de identidad. El principal límite es que el laboratorio no define gobierno de tenants, baja inmediata, fuente productiva de datos ni operación corporativa; no debe extrapolarse el Compose `start-dev` a producción. La combinación de cuenta desactivada y token firmado requiere una aceptación de latencia antes de un despliegue real.

## 11. Gate y handoff

**READY_FOR_ARQ_102 para diseñar/implementar el incremento local:** sí, si se conserva el alcance local y los supuestos marcados. **Preparado para arquitectura productiva:** no. La especificación propone el permiso por dashboard/KPI; requiere aprobación humana antes de redactar el plan de código.

Siguiente rol: revisar el diseño funcional/técnico del incremento local, confirmar el alcance por dashboard y aprobarlo antes de implementar. No se creó ADR ni se aprobaron ASR.
