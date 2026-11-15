# US-007 · Casos de prueba manuales

**Estado:** listos para ejecución manual
**Alcance:** configuración del pipeline CDC, ingreso manual y por polling, publicación/versionado, catálogo, calidad, reintentos, linaje, permisos y pantallas desktop/móvil.
**Referencias:** [diseño backend aprobado](../../superpowers/specs/2026-11-02-us-007-backend-cdc-design.md), [guía de validación API](backend-manual-validation.md), [diseños Stitch](README.md).

## Entorno y datos de prueba

La UI está en `http://127.0.0.1:5182/datasets/preparacion-cdc`, la API en `http://127.0.0.1:8001/docs` y PostgreSQL en `127.0.0.1:55432`. El backend de pruebas usa una base de control aislada. En el arranque actual todavía no hay fuentes ni datasets registrados en esa base.

Antes de ejecutar los casos de CDC:

1. Inicia sesión en la aplicación o solicita una sesión al endpoint de desarrollo `POST /api/v1/auth/dev-session` con la persona indicada en la tabla de usuarios. Envía el token como `Authorization: Bearer <token>` para llamadas directas a la API. No guardes tokens en capturas ni evidencias.
2. Con `data-admin`, registra una fuente PostgreSQL para el tenant `demo-global`, usando el lector tenant, y observa el esquema `gold`.
3. Confirma que el dataset registrado para `gold.fact_sales` esté disponible y completo o incompleto según sus metadatos declarados. No completes metadatos que no existan.
4. Confirma que el laboratorio PostgreSQL tenga las tablas `gold.cdc_sales_events` y `prepared`, que el lector tenga acceso de solo lectura y que el writer separado esté configurado en el backend.
5. Para los casos de polling, habilita la opción del pipeline. El backend activo debe tener el polling de laboratorio habilitado; revisa el estado del servicio antes de esperar el primer ciclo de 60 segundos.

### Personas de desarrollo

No hay contraseñas para estas personas: son identidades del modo local de desarrollo, emitidas por `POST /api/v1/auth/dev-session`. El modo de desarrollo es solo para el laboratorio y no representa autenticación Keycloak ni productiva.

| Persona | Tenant | Uso en las pruebas |
|---|---|---|
| `data-admin` | `demo-global` | Data Engineering del tenant bajo prueba; puede registrar fuentes, datasets, configurar pipelines, enviar lotes y revisar errores técnicos saneados. |
| `analyst` | `demo-global` | Consumidor; permite comprobar lectura y que no se muestren detalles técnicos. No tiene `datasets:write` ni `sources:read`. |
| `viewer` | `demo-global` | Consumidor de solo lectura para controles de acceso. |
| `other-data-admin` | `demo-other` | Administrador de otro tenant con scopes de escritura; se usa para comprobar aislamiento sin que la falta de permisos enmascare el resultado. |
| `other-tenant` | `demo-other` | Analista de otro tenant; útil para comprobar respuestas uniformes según sus scopes. |

### Datos sintéticos permanentes

El laboratorio conserva ejecuciones, eventos, versiones e indicadores de error saneados sin vencimiento. **No borres datos para limpiar el entorno.** Usa IDs únicos de ejecución y claves de negocio reservadas para estas pruebas, por ejemplo `99007001`–`99007020`, junto con source event IDs `manual-us007-<caso>-<n>`. Usa `tenant_id: "demo-global"` en imágenes de evento del tenant principal. Si otra persona ya usa ese rango, elige otro rango y anótalo aquí antes de ejecutar.

Usa una sola clave por la secuencia inserción → actualización → baja. Para comprobar validaciones, crea IDs de evento únicos salvo en el caso específico que prueba duplicados. No reutilices las claves o IDs del ejemplo de la guía backend.

### Registro del resultado

Por caso, anota **Pendiente / Aprobado / Fallido / Bloqueado**, fecha y hora, persona, pipeline/dataset/run/version IDs (sin tokens ni secretos), navegador/ancho de ventana, resultado observado y enlace a captura saneada. Para un fallo, registra request ID y código de error, nunca el lote privado ni credenciales. Los casos de persistencia son acumulativos: conserva los IDs porque el historial es permanente.

### Resultados confirmados

| Casos | Estado | Fecha | Resultado confirmado |
|---|---|---|---|
| US007-M05, US007-M06 | Aprobado por el usuario y repetido desde UI | 2026-11-03 | El usuario confirmo la publicacion original. El reintento UI `c6872dbe-6990-4910-8f93-34cec4f7cbc5` quedo enlazado al fallo tecnico `da740d55-b749-4ed5-b3cd-b4a46e458647` y publico v3 `2a08e0b3-a8bc-4c20-a1e9-231ede555b22`. Tras reiniciar los servicios, el reintento `e8d4c012-1e8d-4bb6-b3a6-1942816770d6` publico v4 `53936356-0b53-4d85-9aed-982bf78ed283`; evidencia en [post-restart-retry-published-desktop.png](evidence/post-restart-retry-published-desktop.png). |
| US007-M05, US007-M06 | Aprobados por el usuario | 2026-11-04 | Ejecucion `d58f8557-a431-4b29-9894-88f24b2a0432` publicada con 1 evento; version 5 `20cf8bad-73f1-4a14-827f-d2df06111330`. Se verifico que la insercion de clave `99007021` aparece en el historial CDC y en el estado vigente. |

## Casos de prueba

| ID | Prioridad | Caso y pasos | Resultado esperado |
|---|---|---|---|
| US007-M01 | P1 | Abrir Preparación CDC sin pipelines y navegar a Ejecuciones, en desktop y móvil. | Se ve el estado vacío real; no aparecen filas, contadores ni ejecuciones inventadas. Navegación y volver a pipelines funcionan. |
| US007-M02 | P1 | Abrir Configurar pipeline y guardar con nombre vacío o sin fuente/dataset; repetir con valores solo de espacios. | El guardado está deshabilitado o valida los campos requeridos. No se crea pipeline ni dataset. La fuente y dataset solo pueden elegirse desde registros reales. |
| US007-M03 | P1 | Crear pipeline con `data-admin`, fuente PostgreSQL y dataset `gold.fact_sales` registrados; dejar polling deshabilitado. | Se crea un pipeline del tenant y un dataset preparado con ID asignado por sistema. Aparece en el catálogo, enlazado al input; la completitud refleja metadatos disponibles. El estado inicial queda deshabilitado. |
| US007-M04 | P1 | Abrir el pipeline recién creado y revisar su configuración y la lista de ejecuciones. | Se muestran las relaciones fuente, dataset de entrada/salida y estado real. No se crea una ejecución solo por configurar el pipeline. |
| US007-M05 | P1 | Enviar un lote manual válido con una inserción y una clave de negocio reservada. Abrir la ejecución publicada y su versión. | La ejecución queda Publicada; los conteos coinciden con el lote. Se crea una versión inmutable con linaje a input, pipeline/configuración, ejecución y rango CDC consumido. El catálogo muestra el dataset preparado. |
| US007-M06 | P1 | Consultar historial y estado vigente de la versión de M05. | El evento de alta aparece en historial; la imagen completa aparece como estado vigente para la clave. Los resultados se limitan al tenant y paginan. |
| US007-M07 | P1 | Enviar una actualización válida para la misma clave de M05 con un nuevo `sourceEventId`, timestamp/posición posteriores e imagen completa. Consultar historial y estado de la nueva versión. | Se publica una nueva versión. El historial conserva alta y cambio; el estado vigente contiene la imagen actualizada. La versión anterior no cambia. |
| US007-M08 | P1 | Enviar una baja válida para esa clave, con `sourceEventId` único y sin `afterImage`. | Se publica una nueva versión; la baja permanece en historial y la clave ya no aparece en el estado vigente. Las versiones anteriores siguen consultables e intactas. |
| US007-M09 | P1 | Enviar un evento sin `businessKey`. | La ejecución queda Rechazada por calidad; el control correspondiente identifica claves ausentes; no se publica versión y se conserva la última versión exitosa. |
| US007-M10 | P1 | Enviar un evento con operación no admitida o estructura de evento inválida. | La publicación se bloquea como rechazo de calidad; se informa el control fallido sin publicar una versión. La última versión exitosa no cambia. |
| US007-M11 | P1 | Enviar un `insert` o `update` con uno o más campos requeridos ausentes en `afterImage`; ejecutar en una clave de prueba separada. | Se registra el control de campos obligatorios fallido; no se publica versión. El detalle no muestra el lote crudo. |
| US007-M12 | P1 | Enviar dos eventos del mismo lote con el mismo `sourceEventId`. | La ejecución se rechaza por duplicado, indica el control de calidad y conserva la última versión exitosa. |
| US007-M13 | P1 | Forzar rechazo de calidad en un lote manual. Desde el detalle, abrir reintento, probar JSON malformado, arreglo vacío y luego un lote corregido con IDs nuevos. | JSON inválido o vacío no se envía y muestra validación. El lote corregido crea otro intento enlazado al rechazo; el original sigue en historial. Si es válido, el nuevo intento publica versión y actualiza la última versión exitosa. |
| US007-M14 | P1 | Comparar eventos que tengan `sourcePosition` y eventos sin posición ordenados por `eventTimestamp`. Incluir dos eventos empatados en timestamp sin posición. | Prevalece la posición del origen cuando existe. Sin posición se usa fecha/hora del evento. Los empates del fallback se conservan y se marcan ambiguos; no se descartan silenciosamente. |
| US007-M15 | P1 | Crear pipeline con polling habilitado y observar al menos dos ciclos de 60 segundos sin eventos nuevos. | No se crean ejecuciones ni versiones vacías. El estado de polling es visible y corresponde a la configuración real. |
| US007-M16 | P1 | Agregar eventos CDC sintéticos nuevos a la fuente de laboratorio por el mecanismo autorizado de preparación del caso; esperar el siguiente ciclo. | Polling crea una ejecución por el rango nuevo, usa el mismo proceso de validación/materialización que el envío manual y publica la versión. El historial refleja el rango consumido. |
| US007-M17 | P1 | Causar un fallo técnico de polling en un entorno de prueba aislado, revisar el detalle y esperar al menos otro ciclo. | La ejecución figura como Fallo técnico; el error técnico es saneado y no revela secreto, payload ni dato personal. No se reintenta automáticamente, no avanza el checkpoint y se conserva la última versión publicada. |
| US007-M18 | P1 | Desde el detalle del fallo de polling, usar reintento sin cuerpo una vez corregida la causa. | Se crea un nuevo intento vinculado, reusa el rango retenido y, si los datos son válidos, publica versión y avanza el checkpoint. Los intentos previos permanecen. |
| US007-M19 | P1 | Como `analyst` o `viewer`, consultar lista/detalle de ejecuciones y versión publicada; revisar si aparece la evidencia técnica. | El consumidor puede leer los datos permitidos del tenant; solo ve estado y resultado de publicación. No ve código/mensaje técnico saneado ni lote de eventos si la API los omite. |
| US007-M20 | P1 | Como `analyst` o `viewer`, intentar crear un pipeline, enviar un lote y reintentar. | La API rechaza las escrituras con 403 y no crea pipeline, ejecución ni versión. La UI muestra permiso insuficiente de forma segura. |
| US007-M21 | P1 | Como `other-data-admin`, consultar, leer, enviar/reintentar usando IDs de pipeline, run y dataset de `demo-global`. | Los recursos del otro tenant no se revelan ni modifican; las respuestas usan el contrato uniforme de recurso no disponible. Ningún dato de `demo-global` aparece en la respuesta. |
| US007-M22 | P1 | Leer una ejecución de calidad/técnica con `analyst`; comparar la respuesta con la de `data-admin`. | Solo el rol de Data Engineering recibe los campos técnicos saneados. Ninguna respuesta incluye secretos ni lote original. |
| US007-M23 | P1 | Navegar el linaje de una versión y cambiar entre pestañas Historial y Estado vigente; recargar y paginar. Repetir en móvil. | Los vínculos llevan a la misma versión seleccionada; cada pestaña usa esa versión. La navegación y paginación no mezclan datos entre versiones o tenants. |
| US007-M24 | P1 | En desktop, comparar configuración, historial, linaje, rechazo por calidad y fallo técnico con sus referencias Stitch aprobadas. Repetir capturas en móvil para las cinco pantallas. | Se conserva composición, jerarquía, navegación, tipografía, colores, espaciado, densidad, iconografía y estado. Registrar cada diferencia; una prueba funcional aprobada no cierra la comparación visual. |
| US007-M25 | P2 | Validar integridad de roles en el laboratorio: intentar escribir en `gold` con la credencial writer y escribir en `prepared` con el lector. | Writer no puede alterar Gold; el lector es de solo lectura; el writer separado puede operar únicamente dentro del esquema preparado autorizado. |
| US007-M26 | P2 | Confirmar por API que no haya límite de reintentos configurado; crear más de un reintento manual sobre una falla, cada uno con nuevo lote válido/ajustado. | Cada reintento queda enlazado y auditado como intento distinto. No hay reintento automático ni máximo fijo. |

## Trazabilidad de los cuatro bloqueos

| Regla que bloquea publicación | Caso |
|---|---|
| Falta la clave de negocio | US007-M09 |
| Evento u operación inválida | US007-M10 |
| Faltan campos requeridos | US007-M11 |
| `sourceEventId` duplicado | US007-M12 |

Los cuatro casos deben dejar sin cambios la última versión exitosa. Las ejecuciones rechazadas y las versiones publicadas permanecen en el laboratorio; usa claves y lotes diferentes para cada corrida.



## Evidencia complementaria 2026-11-03

El reintento manual corregido se envió desde el editor JSON de la interfaz. La ejecución quedó en estado `published`, conservó `retryOfRunId` y generó una versión inmutable. La UI cerró el editor y mostró el enlace a linaje. Las capturas desktop y móvil de los estados de configuración, historial, versión, calidad, fallo técnico y editor están enlazadas en [implementation-review.md](implementation-review.md).
