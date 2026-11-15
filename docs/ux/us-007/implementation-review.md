# Revision de implementacion UI US-007

Fecha de revision: 2026-11-03
Diseno: pantallas Stitch aprobadas por el usuario el 2026-11-02; referencias exactas en [README.md](README.md).

## Evidencia funcional y visual

Capturas reales tomadas con Playwright sobre la aplicacion y el API del laboratorio. Viewports: desktop 1280x900 y movil 390x844 CSS px, DPR 2. Las capturas usan datos persistidos del tenant `demo-global`; no son filas de mockup.

| Estado | Desktop | Movil | Evidencia |
|---|---|---|---|
| Configuracion de pipeline | [Configuracion](evidence/config-drawer-desktop.png) | [Configuracion movil](evidence/config-drawer-mobile.png) | Fuentes, datasets y controles vienen del API. |
| Historial de ejecuciones | [Historial](evidence/history-demo-desktop.png) | [Historial movil](evidence/history-demo-mobile.png) | Lista filtrada por el pipeline del laboratorio; incluye estados persistidos. |
| Ejecucion publicada | [Ejecucion](evidence/published-run-desktop.png) | [Ejecucion movil](evidence/published-run-mobile.png) | El detalle enlaza la version resultante. |
| Version y linaje | [Version](evidence/published-version-desktop.png) | [Version movil](evidence/published-version-mobile.png) | Manifiesto, historial CDC y estado vigente cargados por version. |
| Rechazo por calidad | [Calidad](evidence/quality-desktop.png) | [Calidad movil](evidence/quality-mobile.png) | Diagnostico y controles bloqueantes desde el API. |
| Fallo tecnico | [Fallo original](evidence/technical-desktop.png) / [Tras reinicio](evidence/technical-after-restart-desktop.png) | [Fallo movil](evidence/technical-mobile.png) | Mensaje saneado correcto tras reiniciar; el historial antiguo conserva su texto original. |
| Reintento JSON | [Editor abierto](evidence/technical-retry-editor-desktop.png) | [Editor movil](evidence/technical-retry-editor-mobile.png) | Editor del lote completo aprobado por el usuario. |
| Reintento publicado desde UI | [Resultado inicial](evidence/ui-retry-published-desktop.png) / [Tras reinicio](evidence/post-restart-retry-published-desktop.png) | ? | Tras reiniciar servicios, el editor se cierra y el intento enlazado publica v4. |

La automatizacion de navegador reporto cero errores JavaScript. Tras reiniciar los servicios, el reintento desde la UI produjo `e8d4c012-1e8d-4bb6-b3a6-1942816770d6`, enlazado a `f12bd714-4426-4e4a-8134-a44b82404d5f`, y publico la version 4 (`53936356-0b53-4d85-9aed-982bf78ed283`) del dataset `3cef48dd-1ee6-4293-b548-3b5ba502008b`.

## Pruebas ejecutadas

- Backend: 16 pruebas de preparacion aprobadas, incluidas API, catalogo, migracion, polling, procesamiento, repositorio y regresion del mensaje saneado.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` aprobado.
- Navegador: recorridos desktop/movil de configuracion, historial, version, calidad, fallo tecnico y reintento JSON; cero errores JavaScript.
- Vitest: 52 archivos y 167 pruebas aprobados. Se ejecuto por la API programatica sin cargar la configuracion local que esbuild no puede resolver desde la ruta profunda del worktree.
- Build de produccion Vite: aprobado; transformo 153 modulos. Se ejecuto con la API de Vite y `configFile: false` por el mismo bloqueo del cargador de configuracion.

## Comparacion con Stitch y diferencias

Se compararon las pantallas desktop y movil aprobadas con las capturas actuales. Se mantienen la jerarquia y el flujo de configuracion, tabla/tarjetas del historial, detalle de rechazo/fallo, editor JSON, linaje y pestanas de historial/estado vigente. Los breadcrumbs ahora muestran el historial antes del detalle de ejecucion y, en versiones, el nombre real del dataset, Versiones y Detalle. El linaje presenta el nombre registrado del dataset y la etiqueta del proceso CDC (`sales-cdc-v1` -> `Pipeline CDC / Captura`), sin sustituir IDs donde el diseno expone parametros tecnicos.

Diferencias conocidas:

- El menu global conserva el tema oscuro que el usuario pidio igualar con las otras paginas. Stitch muestra una variante clara para estas pantallas; prevalece la decision explicita del usuario.
- El registro tecnico antiguo `4d4ceb7a-219e-47f3-8229-e6c18d9fc3ea` conserva el texto anterior con codificacion incorrecta por ser evidencia inmutable. Despues del reinicio, los fallos nuevos muestran el mensaje corregido; se comprobo en la pantalla y en el API. No se reescribio la evidencia historica.
- Las capturas desktop se hicieron a 900 px de alto; Stitch tiene referencias mas altas. Las capturas son full-page y comparan la composicion y densidad, aunque el alto de viewport no es identico.

La suite frontend y el build ya pasan. No se declara fidelidad visual del 100% por las diferencias descritas y por la diferencia de alto entre los viewports capturados y las referencias Stitch.

## Validacion funcional confirmada

El usuario confirmo el 2026-11-03 que el lote original se publico y aparece en el historial y en la version preparada. Ademas, se ejercito desde la UI el reintento manual de un fallo tecnico con un lote corregido antes y despues del reinicio. La prueba posterior quedo enlazada al intento previo, publico v4 y navego al detalle publicado con el editor cerrado. El 2026-11-04 el usuario aprobo M05-M06: `d58f8557-a431-4b29-9894-88f24b2a0432` publico un evento en v5 (`20cf8bad-73f1-4a14-827f-d2df06111330`); se comprobo la clave `99007021` tanto en historial como en estado vigente.
