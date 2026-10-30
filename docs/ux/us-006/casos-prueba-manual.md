# Casos de prueba manual — US-006, incremento de laboratorio

Estado: conformidad comunicada por el usuario para todos los casos; sin evidencias individuales adjuntas. Fecha: 2026-10-29.

## Registro de ejecución

| Caso | Resultado | Fecha | Evidencia y observación |
|---|---|---|---|
| US006-M01 | Aprobado por el usuario | 2026-10-29 | Dashboard «Prueba de Dashboard»: se mostró el aviso para configurar el período y «Ingresos netos» con su botón de retirada. El usuario confirmó «Es conforme el resultado». |
| US006-M02 | Aprobado por el usuario | 2026-10-29 | El usuario confirmó «Conforme» después de revisar la configuración del período y el resultado esperado. |
| US006-M03–M14, US006-A01–A05 y US006-X01–X04 | Conformes según el usuario | 2026-10-29 | El usuario indicó «Todos los test cases son conforme». No se aportaron resultados ni evidencias individuales para cada caso; no se registra una ejecución independiente. |

## Preparación

- Interfaz: http://127.0.0.1:5246/explorar. API y Swagger: http://127.0.0.1:8046/docs.
- La interfaz inicia automáticamente como `analyst` (Ana Rivas, tenant `demo-global`). No dispone de un selector de personas. La base `data/us006-manual-lab.db` es independiente y puede conservar cambios de pruebas anteriores: usa nombres de dashboard únicos.
- Datos sintéticos de Ingresos netos: 01/10/2026–03/10/2026, total 3.100,00 PEN; Digital 1.400,00 PEN; Tienda 1.700,00 PEN. Estos importes corresponden únicamente a esta muestra de laboratorio.
- Preparar un dashboard: 1) abrir «Explorar KPI» y localizar la tarjeta «Ingresos netos»; 2) pulsar «Añadir al dashboard» en esa tarjeta; 3) en la pantalla «Añadir KPI al dashboard», buscar el botón «Crear dashboard» junto al buscador de dashboards y pulsarlo; 4) escribir un nombre único y pulsar «Crear y seleccionar»; 5) con el dashboard seleccionado, pulsar «Añadir KPI» en la barra inferior; 6) abrir «Editar dashboard», configurar 01/10/2026–03/10/2026 y pulsar «Guardar período». Conservar su URL e ID para las pruebas de acceso. La lista general de dashboards no tiene un botón de creación directa en este incremento.
- Registrar por caso: resultado (pendiente/aprobado/fallido/bloqueado), fecha, persona evaluadora, datos usados, evidencia y observaciones. No marcar aprobado sin ejecución.

## Casos ejecutables desde la interfaz

| ID | Caso y pasos | Resultado esperado |
|---|---|---|
| US006-M01 | Crear el dashboard y añadir Ingresos netos siguiendo los pasos 1–5 de la preparación, sin configurar todavía el período. | Se abre el dashboard personal con el nombre elegido. Aparece «Configura el período inicial para consultar este dashboard.» y, en «KPI añadidos», se ve «Ingresos netos» junto a «Retirar Ingresos netos». Todavía no se muestra un valor numérico. |
| US006-M02 | Guardar el período inicial indicado y volver al dashboard. | Se muestran las fechas guardadas, todos los canales y el resultado 3.100,00 PEN. |
| US006-M03 | Seleccionar Digital desde el selector de canal. | Resultado 1.400,00 PEN; el filtro se identifica y la barra Digital aparece seleccionada. |
| US006-M04 | Seleccionar la barra Tienda y después pulsarla otra vez. | Tienda reemplaza Digital y muestra 1.700,00 PEN; la segunda pulsación elimina el filtro y restaura todos los canales. |
| US006-M05 | Seleccionar Digital y quitarlo mediante la etiqueta del filtro. | La etiqueta desaparece, el selector vuelve a todos los canales y el resultado vuelve a 3.100,00 PEN. |
| US006-M06 | Seleccionar Digital, cambiar el período a 01/10/2026–01/10/2026 y después pulsar «Limpiar filtros». | Cambiar fechas conserva Digital; limpiar restaura 01/10/2026–03/10/2026 y todos los canales. |
| US006-M07 | Seleccionar un período válido sin datos, por ejemplo 01/11/2026–02/11/2026. | Se conserva el período elegido y las visualizaciones afectadas informan que no hay datos; no se muestran resultados anteriores como actuales. |
| US006-M08 | Introducir fecha inicial posterior a la final, tanto en el filtro como en la configuración inicial. | El filtro muestra una validación y no consulta con rango inválido; en la configuración no se permite guardar. |
| US006-M09 | Introducir un intervalo mayor de 366 días en la configuración inicial. | No se permite guardar el intervalo. |
| US006-M10 | Con un período válido guardado, recargar el dashboard o abrir su URL en una ventana nueva. | Se recuperan el dashboard, KPI y período guardado; inicia con todos los canales. |
| US006-M11 | En «Compartir», seleccionar «Lector de ejemplo», conceder acceso y luego retirarlo. | La persona aparece como lectora tras conceder y desaparece al retirar; se indica que la revocación se aplica en la siguiente solicitud o recarga. |
| US006-M12 | En «Editar dashboard», retirar el KPI añadido y recargar. | El KPI deja de aparecer y la modificación persiste. Usar un dashboard de prueba, porque la acción modifica sus datos. |
| US006-M13 | Probar teclado: recorrer controles con Tab/Shift+Tab, cambiar canal, abrir gestión y volver. Repetir a 390 px de ancho. | Controles alcanzables y con foco visible; la gestión y el regreso conservan navegación comprensible; no aparece desplazamiento horizontal de página. |
| US006-M14 | Comparar dashboard con filtro activo en escritorio y móvil y gestión en escritorio con las referencias Stitch enlazadas al final. | Registrar diferencias de composición, jerarquía, controles y estados; no aprobar fidelidad visual si persisten discrepancias. Las variantes móviles de estados excepcionales están fuera de este incremento. |

## Acceso mediante Swagger/API

La API de desarrollo permite obtener tokens de prueba sin cambiar la identidad automática de la interfaz. En Swagger, ejecutar `POST /api/v1/auth/dev-session` con `{"persona":"analyst"}`, `{"persona":"viewer"}` o `{"persona":"other-tenant"}`. Copiar el `accessToken` a «Authorize»; cambiar el token cuando el caso indique otra identidad. No publicar ni guardar los tokens en evidencias. Para mutaciones del propietario, usar la versión actual del dashboard en `If-Match`, entre comillas, por ejemplo `"1"`; actualizarla con cada respuesta.

| ID | Caso y pasos | Resultado esperado |
|---|---|---|
| US006-A01 | Como `viewer`, consultar `GET /api/v1/dashboards/{id}` antes de conceder acceso. Como `analyst`, concederlo con `PUT /api/v1/dashboards/{id}/readers/viewer`; volver a consultar como `viewer`. | Antes: 404 genérico. Después: 200 y `editable: false`; se ven únicamente los KPI permitidos por el tenant y los scopes de laboratorio. |
| US006-A02 | Con acceso concedido, como `viewer` intentar modificar el período o compartir el dashboard. | La API rechaza la escritura (403); el dashboard no cambia. |
| US006-A03 | Como `other-tenant`, consultar el mismo ID y probar una consulta semántica asociada al dashboard. | Acceso denegado sin revelar el recurso de otro tenant; comprobar respuesta genérica y ausencia de datos. |
| US006-A04 | Como `analyst`, revocar acceso de `viewer` mediante `DELETE /api/v1/dashboards/{id}/readers/viewer` con la versión actual. Repetir GET y una consulta asociada como `viewer`. | La siguiente solicitud no accede al dashboard ni a su consulta; GET responde 404 genérico. No se afirma retirada inmediata de contenido ya mostrado. |
| US006-A05 | Con identidad de propietario, intentar actualizar el período usando `If-Match` ausente y después una versión anterior. | Se rechaza con 428 y 412 respectivamente; los valores guardados no se sobrescriben. |

## Casos que requieren preparación adicional

| ID | Caso | Preparación y resultado esperado |
|---|---|---|
| US006-X01 | Invitado sin KPI autorizados | Requiere una identidad de prueba con lectura del dashboard pero sin `catalog:read`; el selector de personas de la UI no la ofrece. Debe mostrar estado vacío sin nombres, identificadores ni número de KPI ocultos. Hay cobertura automatizada de API, pero no sustituye la prueba manual. |
| US006-X02 | Filtro incompatible | Requiere un KPI disponible sin dimensión `channel`. Al seleccionar canal, debe permanecer visible y señalar «Este filtro no aplica». No inventar un KPI para completar el caso. |
| US006-X03 | Error parcial y reintento | Requiere provocar controladamente un fallo de una consulta, por ejemplo con una herramienta de pruebas del navegador o proxy. La visualización afectada debe mostrar error y reintento; las demás permanecen disponibles. No detener servicios compartidos. |
| US006-X04 | Migración de dashboard compartido antiguo | Requiere copia aislada de una base anterior a la migración, con dashboard `shared=1`. Tras iniciar la nueva versión, el dashboard y sus widgets se conservan, pasa a privado y el acceso anterior deja de funcionar. No usar la base manual activa para este ensayo. |

## Fuentes

- [Decisiones de alcance y reglas aprobadas](../../../../../knowledge-base/requirements/context-packs/RCP-003-us-006-dashboard-semantico.md), sección 10.
- [Plan de US-006](../../../../../docs/superpowers/plans/2026-10-28-us-006-interactive-dashboard-plan.md).
- [Referencias Stitch](../../../../../docs/ux/us-006/README.md) y [evidencia y limitaciones](verification.md).
