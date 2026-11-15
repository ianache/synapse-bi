---
type: DesignSpecification
id: DESIGN-US006-IDENTITY-KPI
title: Diseño del incremento local de identidad y acceso por KPI para US-006
description: Keycloak gestionado directamente para login y grants BI por persona/KPI, administrados por el propietario del dashboard.
status: draft
generated:
  by: superpowers/brainstorming
  at: 2026-10-30T00:51:11-05:00
sources:
  - id: RCP-004
    resource: /knowledge-base/requirements/context-packs/RCP-004-us-006-acceso-real-kpi.md
  - id: ACP-002
    resource: /knowledge-base/architecture/context-packs/ACP-002-us-006-identidad-acceso-kpi.md
  - id: US-006
    resource: /knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md
  - id: LOGIN
    resource: /codebase/apps/bi-analytics/LOGIN.md
  - id: KC-JS
    resource: https://www.keycloak.org/securing-apps/javascript-adapter
  - id: KC-MAPPERS
    resource: https://www.keycloak.org/admin-api/protocol-mappers
  - id: KC-ADMIN
    resource: https://www.keycloak.org/docs/26.8.0/server_admin/
---

# US-006 — Identidad real y autorización individual por KPI

## Intento

Permitir que una persona inicie sesión con una cuenta real de Keycloak, y que el backend revele únicamente los KPI autorizados dentro de un dashboard compartido. Esto reemplaza las identidades sintéticas del laboratorio en el flujo conectado y cierra el acceso directo por API con la misma regla que aplica la UI.

## Resultado observable

Un propietario comparte su dashboard con una persona de su tenant y asigna lectura a KPI concretos de ese dashboard. Solo el propietario puede conceder y retirar esos permisos. El lector ve solo la intersección entre dashboard compartido y KPI permitidos; si no hay KPI autorizados, ve el estado vacío seguro. La denegación/revocación se aplica desde la siguiente solicitud.

## Alcance

### Incluye

- Keycloak comunitario `keycloak/keycloak:26.8` para laboratorio local, cuenta administrada directamente en Keycloak.
- Login OIDC de la SPA mediante Authorization Code y PKCE S256; token en memoria y Bearer al API. Sin secreto de cliente en el navegador.
- Claims firmados `sub`, `tenant_id`, `name`, `aud` y roles del cliente API adecuados al API. `sub` es clave de identidad; `tenant_id` se administra como atributo del usuario para este lab. El backend traduce solo roles conocidos a scopes BI; no asume que el `scope` OAuth estándar representa permisos de negocio.
- Resolver destinatarios desde usuarios de un realm dedicado a BI. El API filtra por `tenant_id` y no devuelve personas de otros tenants.
- Permisos de lectura para pares persona + dashboard + KPI, persistidos por BI en su base local. Keycloak conserva exclusivamente sus propios datos en el schema PostgreSQL `keycloak`.
- Solo el propietario concede y revoca permisos KPI en sus dashboards. Requiere que lector y dashboard pertenezcan al mismo tenant.
- El grant de dashboard y los grants por KPI se comprueban conjuntamente. Un grant KPI no comparte por sí mismo el dashboard.
- Filtro de permisos en dashboard, catálogo/detalle, metadatos/lineage y ejecución de consultas, incluyendo rutas API directas.
- Auditoría de concesión/revocación con tenant, subject actor, sujeto destino, dashboard, KPI y request ID, sin guardar tokens.
- `/api/v1/auth/dev-session` disponible únicamente en modo development/test; el modo OIDC real no acepta fallback.
- Adaptación local estricta para descubrir/leer JWKS de Keycloak por HTTP solo en desarrollo y loopback, o endpoint HTTPS configurado. Producción mantiene HTTPS obligatorio.

### No incluye

- Federación LDAP/AD/IdP externo, sincronización masiva o gobierno corporativo de usuarios y tenants.
- Despliegue de producción, alta disponibilidad, Red Hat build/support o migración de datos sintéticos.
- Acceso KPI global por persona, grupos, reglas de herencia, denegaciones explícitas o precedencia entre grants de distinto origen.
- Aplicación de la ACL a fuentes de consulta productivas no conectadas al serving de este laboratorio.
- Exportación, nuevos gráficos o cambios a Stitch fuera de las vistas de acceso que se acuerden.

## Decisiones acordadas

- Plataforma elegida anteriormente: Keycloak 26.x con PostgreSQL en esquema propio `keycloak`; el laboratorio usa imagen comunitaria Docker Hub `keycloak/keycloak:26.8`.
- Se avanza con el camino de cuentas gestionadas directamente por Keycloak y autorización de negocio mantenida por BI.
- Solo el propietario del dashboard puede otorgar permisos por KPI.
- Solo el propietario puede retirar esos permisos de KPI.
- Se conserva el aislamiento por tenant y la lectura de dashboard como condiciones separadas.

## Enfoques considerados

1. **Keycloak como identidad; BI mantiene ACL por dashboard/KPI (elegido).** Se ajusta al modelo actual: FastAPI ya valida OIDC, el dashboard ya comparte por subject y la UI ya tiene gestión de lectores. Añade un grant preciso en BI y permite evaluar la regla en cada ruta. Mantiene roles técnicos fuera del catálogo semántico.
2. **Keycloak como motor de autorización por KPI.** Guardaría permisos de negocio como roles/grupos/recursos de Keycloak. Se descarta para este incremento porque mezcla gobierno BI con identidad, complica permisos dinámicos por dashboard y puede inflar tokens/cachear decisiones; la revocación dependería de sincronización externa.
3. **Federar un directorio corporativo ahora.** Se descarta para el primer laboratorio porque no se ha identificado directorio, atributos/tenants ni operación de sincronización. Se puede agregar después como fuente de identidades sin cambiar la ACL BI si el `sub` y tenant se mapean de forma estable.

## Diseño funcional propuesto

### Identidad y tenant

- Un realm de laboratorio contiene usuarios de prueba gestionados directamente en Keycloak.
- Cada usuario tiene un atributo `tenant_id` único. Un mapper OIDC publica el claim firmado `tenant_id`; los endpoints fallan de forma segura si falta o es inválido.
- El API usa `sub` como identificador estable, verifica firma RS256, issuer, audience, expiración y JWKS. `name` solo sirve para mostrar; email/username no son clave de ACL. Los roles de cliente definidos por BI se mapean a los scopes conocidos en `Principal`.
- No se añade un rol administrativo para otorgar permisos KPI en este incremento.
- Para cargar destinatarios, el backend consulta la Admin REST API de Keycloak desde una cuenta de servicio de solo lectura en un realm dedicado `bi-lab`. Usa `query-users` y `view-users`, no `manage-users`; el API filtra por tenant antes de devolver nombres y subjects. El administrador de Keycloak mantiene cuentas y atributos fuera del flujo de grants KPI. El servicio puede consultar todos los usuarios de `bi-lab`, por eso ese realm no debe alojar otras poblaciones.
- Para SPA se usa cliente público con Authorization Code + PKCE S256 y Redirect URI de loopback exactas. Los tokens permanecen en memoria; API recibe solo access token. El adaptador oficial soporta PKCE S256 y recomienda cliente público en browser. [Documentación del adaptador Keycloak](https://www.keycloak.org/securing-apps/javascript-adapter).

### Reglas de autorización

La operación de lectura requiere todas estas condiciones:

1. Token válido emitido por el realm configurado.
2. Tenant del token igual al tenant del dashboard y del KPI.
3. Dashboard propiedad del usuario o compartido explícitamente con él.
4. KPI incluido como widget del dashboard.
5. Grant activo para `(tenant, dashboard, subject, kpi)`.
6. Scopes técnicos vigentes: `dashboards:read`, `catalog:read` y `queries:execute` según la ruta.

El propietario puede modificar grants solo para sus dashboards y KPI incluidos. Otros usuarios no pueden alterar esos grants desde este incremento.

Un grant KPI nunca concede el dashboard. El usuario solo puede conceder permisos a un destinatario del mismo tenant. KPI ajenos, dashboard inexistente y KPI no autorizados no deben revelar existencia ni metadatos; responder de modo genérico (403/404 según contrato existente). El DTO omite IDs, definiciones, conteos y lineage de KPI no autorizados.

### Persistencia y revocación

- La ACL se guarda en SQLite del backend de laboratorio, separada de Keycloak; migración aditiva, con clave compuesta tenant/dashboard/subject/KPI.
- Cada registro de grant corresponde a una persona, dashboard y KPI. El propietario del dashboard puede revocarlo; cada cambio genera un evento de auditoría con el actor.
- Cada nueva solicitud consulta la ACL vigente, por lo que un grant revocado no sirve en la siguiente API request. La UI descarta estado local del dashboard al recibir 401/403 y requiere recarga para reflejar la lista filtrada.
- Revocar el acceso general al dashboard elimina o invalida el acceso a todos sus KPI en contexto, sin borrar las concesiones centrales de auditoría; volver a compartir no reactiva grants KPI eliminados.
- El access token de Keycloak será de corta duración en el laboratorio. Desactivar cuenta impide renovar sesión; la latencia de invalidación de un JWT ya emitido queda limitada por su expiración. No declarar revocación instantánea de sesión.

### Experiencia

- Login: conectar el punto SSO actual a Keycloak; estados de sesión vencida, error de proveedor y retorno a la ruta solicitada.
- Dashboard > Compartir: resolver destinatarios reales del tenant; al seleccionar persona, permitir elegir solo KPI actualmente en ese dashboard; mostrar permisos activos para lectura y permitir al propietario revocarlos.
- Directorio: la llamada a Keycloak ocurre únicamente desde el servidor. La cuenta de servicio tiene `query-users` y `view-users`, sin `manage-users`; se acota al realm dedicado al BI. Keycloak documenta la separación entre roles de consulta, lectura y gestión de usuarios. [Server Administration Guide 26.8](https://www.keycloak.org/docs/26.8.0/server_admin/).
- No se agrega administración central ni endpoints centrales para grants en este incremento. La concesión y revocación se integran en la gestión del dashboard del propietario.
- La UI no muestra métricas sintéticas adicionales ni botones sin comportamiento. Las pantallas nuevas que necesiten diseño visual deberán contar con referencia Stitch aprobada antes de declararse conformes.

## Guardrails de seguridad

- No confiar en claims no firmados, query params, headers arbitrarios ni estado del cliente para roles/tenant.
- Resolver primero tenant y ACL antes de retornar nombres/definiciones/detalles del KPI.
- Enviar token solo a la API del origen configurado; no incluir access/refresh tokens en URL, localStorage, logs, trazas o screenshots.
- Mantener HTTP permitido solo para loopback de desarrollo; HTTPS obligatorio fuera del laboratorio.
- No compartir la cuenta bootstrap `admin/admin` del entorno de prueba fuera del laboratorio; para la verificación del incremento usar cuentas de usuario separadas.
- Enumeración del directorio restringida al tenant; normalizar errores de usuario inexistente/no autorizado.

## Pruebas de aceptación a planificar

- Login correcto, issuer/audience/firma/expiración inválidos, claim tenant ausente y tenant modificado.
- Usuario del otro tenant no aparece en destinatarios ni comparte dashboard/KPI.
- Owner gestiona grants solo en su dashboard; otro propietario y usuario sin propiedad reciben 403.
- Lector autorizado ve/consulta solo KPI concedidos; KPI sin grant no se filtra por dashboard, catálogo, detalle, metadatos, lineage ni query directa.
- Un grant KPI sin dashboard compartido no da acceso; dashboard compartido sin grants KPI muestra estado vacío sin nombres/cantidades.
- Retirar grant surte efecto en la siguiente solicitud; retirar dashboard revoca todas las rutas directas del lector.
- Revocación, regrant, claims rotados/JWKS, token expirado, usuario deshabilitado y cambios en versión KPI.
- Auditoría registra actor y recurso sin token ni secreto.

## Riesgos y decisiones que este diseño propone

- **Permiso por dashboard, no global por KPI:** limita el alcance de una acción del propietario y corresponde al flujo de compartir actual.
- **Sin administración central de grants:** reduce superficie y mantiene la responsabilidad junto al propietario que comparte el dashboard.
- **Permiso específico por dashboard:** evita que el propietario de un dashboard conceda acceso global a un KPI.
- **Estado de sesión:** el JWT firmado mantiene acceso hasta expirar; la decisión funcional previa de revocación inmediata aplica a grants en nuevas requests, no a sesiones antes de expiración.

## Revisión

Este diseño fue aprobado por el usuario el 2026-10-30. La identidad directa de Keycloak, la concesión exclusiva del propietario, el alcance por dashboard y la revocación por el mismo propietario quedan aprobados para el incremento local. Se añadió la aclaración de que los scopes BI se derivan de roles de cliente explícitos, no del scope OAuth genérico. La tolerancia de JWT hasta su expiración al desactivar una cuenta es una decisión técnica para el laboratorio, limitada mediante tokens cortos; no define la política productiva.
