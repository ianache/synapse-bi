# US-006 — verificación y entrega de laboratorio

Fecha: 2026-10-29. Implementación en la rama de trabajo `feat/us-006-interactive-dashboard`.

## Alcance y decisiones

- Los dashboards anteriormente compartidos con todo el tenant migran a privados; el propietario puede volver a compartirlos con personas concretas.
- El selector utiliza un directorio sintético de laboratorio. La autorización de KPI utiliza los permisos existentes del tenant y `catalog:read`; la autorización individual por KPI y el directororio real quedan para una entrega posterior.
- Se excluyen las variantes móviles de los estados excepcionales por decisión del usuario. Los textos y controles contradictorios de Stitch se tratan conforme a la autorización registrada en `implementation-conflicts.md` del espacio principal.

## Evidencia funcional

- Backend: 207 pruebas aprobadas y una omitida. Incluye migración, compartición, revocación y consultas asociadas al dashboard.
- Interfaz: comprobación de tipos aprobada; siete pruebas del componente interactivo aprobadas, incluida la regresión de carga de versiones fijadas y foco. La suite completa posterior al ajuste visual produjo 153 aprobadas y una prueba de datasets agotó el límite de tiempo; las 11 pruebas de ese archivo aprobaron al ejecutarse por separado. Una ejecución completa anterior al ajuste visual pasó 154 pruebas.
- Integración con backend Python: recorrido de creación, consulta y filtros; persistencia entre sesiones; gestión de acceso; estados de metadatos y errores. Las capturas generadas por Playwright están en `codebase/test-results/` y pueden regenerarse con `playwright.api.config.ts`.
- Inspección manual en navegador: el filtro Digital produjo 1.400,00 PEN frente a 3.100,00 PEN para todos los canales en los datos sintéticos; se concedió y retiró acceso a un lector de ejemplo.
- La segunda revisión independiente identificó fallos de recuperación de versiones fijadas y gestión del foco; se corrigieron y se añadió una prueba de regresión. No se ha efectuado una tercera revisión independiente de esas correcciones.

## Estado visual y pendientes

- Se contrastaron las referencias de dashboard y gestión de Stitch con la interfaz de escritorio. La gestión utiliza cabecera, secciones y resumen en dos columnas; quedan diferencias de composición, densidad, controles y estados respecto de las pantallas aprobadas. La captura de Stitch de gestión tiene controles recortados.
- La comparación exhaustiva con capturas de todos los estados excepcionales y la validación visual móvil del dashboard ordinario aún no están documentadas. Las pruebas funcionales y de accesibilidad no prueban fidelidad visual; no se declara conformidad visual exacta.
- Antes de integrar: completar comparación visual de cada pantalla aplicable, resolver diferencias pendientes y revisar las últimas correcciones. El incremento está orientado a laboratorio, no a despliegue productivo con identidades reales.

## Revisión de continuidad — 2026-10-29

- Se consultaron las seis capturas y los HTML de Stitch del dashboard, gestión corregida, móvil y estados excepcionales. La comparación del dashboard de escritorio con la captura existente `dashboard-python-api.png` confirma que faltan, entre otros detalles, la jerarquía y densidad del encabezado y filtros, el tratamiento visual de las tarjetas y la composición del gráfico. La captura existente usa un solo KPI y todos los canales; no demuestra el estado de filtro activo de la referencia.
- La comprobación focalizada actual de migración, período y compartición produjo 9 pruebas aprobadas. Las pruebas focalizadas de `DashboardInteractive` y `ChannelChart` produjeron 9 aprobadas. Estas comprobaciones no sustituyen la comparación visual ni la verificación integrada.
- La suite completa de backend terminó con código 0 y una prueba omitida; `npm run typecheck` también terminó con código 0. La suite completa de interfaz se interrumpió antes de terminar y debe repetirse; no se considera aprobada en esta revisión.
- El plan del espacio principal describe únicamente la migración; este worktree contiene además cambios sin confirmar para compartición, período y componentes interactivos. Preservar esos cambios y sus pruebas durante la continuación.

## Continuación del cierre de laboratorio

- Se añadió un estado accesible para invitados sin indicadores y un estado genérico al abrir un dashboard no visible. No se revelan identificadores de KPI ni se atribuye una causa específica a la falta de acceso.
- El filtro activo muestra su canal real y el diseño móvil ubica ambas fechas en una fila. Las nuevas capturas `dashboard-active-desktop.png` y `dashboard-active-mobile.png` se contrastaron con Stitch: persisten diferencias en shell, composición y contenido de tarjetas, gráfico y gestión; no se declara conformidad exacta.
- Pruebas focalizadas de dashboard y workspace después de la corrección: 15 aprobadas. Suite de interfaz: 156 aprobadas en 48 archivos, antes de la última corrección del estado de acceso. Backend completo: código 0 y una omitida. Tipos y compilación: código 0 antes de la última corrección.
- Navegador integrado: 4 aprobadas con servicios y SQLite aislados, incluyendo captura de filtro activo en escritorio y móvil, comprobación de desbordamiento y axe móvil. La primera ejecución ampliada agotó el límite de 30 segundos; la repetición con 120 segundos pasó sin retirar verificaciones.
- Pendientes para cierre: comprobar las últimas modificaciones, terminar las diferencias visuales señaladas y la comparación de estados excepcionales, revisar seguridad y el conjunto completo e integrar el worktree. No se ha obtenido aceptación humana final.

## Iconos de acciones

- Se consultaron los HTML y capturas Stitch de dashboard escritorio/móvil y gestión. Se añadieron iconos decorativos para añadir, editar y compartir; y para volver, guardar período y conceder acceso en gestión. Los nombres accesibles permanecen en el texto de cada acción.
- Pruebas de componente: 9 aprobadas; tipos: código 0. Recorrido de navegador con backend y base aislados: 1 aprobado, con captura desktop/móvil, axe móvil y comprobación de desbordamiento. Captura desktop del dashboard manual y gestión inspeccionadas.
- Comparación móvil: los tres iconos aparecen, pero los botones se distribuyen en dos filas con las etiquetas completas, mientras que Stitch muestra una fila y trunca etiquetas. Siguen abiertas las diferencias generales de composición ya registradas; no se declara conformidad visual exacta.

## Ancho del gráfico

- El HTML de Stitch dispone el gráfico en 7 de 12 columnas en escritorio y en una sola columna en móvil. Se ajustó el gráfico real a esa proporción en pantallas de al menos 1024 px, sin crear visualizaciones ni datos adicionales.
- La prueba de navegador falló antes del cambio al medir una proporción de 1,00 y pasó después en escritorio y móvil; verificó también filtro, axe y ausencia de desbordamiento móvil. Las dos capturas generadas se inspeccionaron frente a las referencias. Las diferencias generales de composición y contenido siguen abiertas.
- La tarjeta de KPI también ocupaba todo el ancho cuando era única. Se cambió la cuadrícula a tres columnas en escritorio, dos en ancho intermedio y una en móvil. La prueba de navegador reprodujo el ancho completo antes del cambio y pasó después, comprobando tarjeta y gráfico en escritorio y móvil; las capturas de ambos tamaños se inspeccionaron. La composición y contenido completos aún tienen diferencias con Stitch.
- Ajuste solicitado posteriormente por el usuario: tarjeta KPI y gráfico comparten una cuadrícula para ocupar la misma fila cuando caben; esta composición para un solo KPI se desvía de la distribución por filas de la referencia Stitch por instrucción explícita. En móvil se apilan. La prueba de navegador reprodujo la separación anterior y pasó con posiciones y proporciones desktop/móvil, filtros, axe y control de desbordamiento; las capturas de ambos tamaños se inspeccionaron. Pruebas de componentes: 11 aprobadas. Otras diferencias con Stitch siguen abiertas.

## Verificación de cierre solicitada por el usuario

- El usuario comunicó conformidad para todos los casos manuales, sin adjuntar evidencia individual; detalle en `casos-prueba-manual.md`. La composición conjunta de KPI y gráfico fue solicitada después de la aprobación visual inicial y se documenta arriba.
- Verificación nueva: backend completo terminó con código 0 y una prueba PostgreSQL omitida; tipos y build terminaron con código 0. Navegador integrado con datos sintéticos y base aislada: 4 pruebas aprobadas, incluyendo capturas desktop/móvil y comprobación de posiciones, filtros, axe y desbordamiento móvil.
- Suite completa de interfaz: 158 pruebas aprobadas en 48 archivos. El cierre visual completo no se certifica: quedan diferencias con Stitch y falta comparación documentada de todas las pantallas excepcionales; no se declara integración ni despliegue.
- Revisión independiente: reproducida inconsistencia entre el ocultamiento de KPI sin `catalog:read` en el dashboard y las rutas preexistentes de consulta directa/añadir KPI, que podían resolverlos con otros scopes. En una base temporal, catálogo devolvió 403 mientras consulta directa y alta de widget devolvieron 200. La decisión y corrección posteriores se registran en la sección siguiente.

## Política de scopes confirmada y corrección

- El usuario aprobó exigir `catalog:read` junto a `queries:execute` para consultar y junto a `dashboards:write` y propiedad para añadir un KPI. La falta de `catalog:read` se rechaza antes de resolver el KPI, con 403 tanto para IDs existentes como inexistentes. Esto cambia la compatibilidad para identidades que solo disponían de `queries:execute`; se actualizó API-001 en este worktree.
- La prueba de regresión falló inicialmente porque la consulta devolvía 200; tras el cambio pasan las pruebas de compartición/API y la suite completa de backend, con una integración PostgreSQL omitida. La prueba asegura además que el dashboard no se modifica. La integración de navegador con base y servicios aislados pasó 4 casos.
- En el momento de esta revisión Keycloak aún no estaba instalado y el servidor manual necesitaba reinicio. Posteriormente, Keycloak se instaló como servicio independiente de laboratorio y la API manual se reinició; BI todavía no está integrada con Keycloak.

## Comparación de cierre y revisión de seguridad — 2026-10-29

- Se cotejaron las referencias Stitch de dashboard desktop/móvil, gestión y las tres pantallas excepcionales con las capturas reales en `screens/`. La captura de invitado emplea una respuesta HTTP de prueba sin scope de catálogo; la autorización se comprueba por separado en backend. Las capturas usan exclusivamente datos sintéticos de una base aislada.
- Se implementaron los estados centrados de sin datos y fallo parcial con reintento, el icono de invitado sin indicadores y la pantalla genérica de acceso no disponible. Se conservaron los mensajes y controles que no filtran información ni inventan un diagnóstico o funcionalidad. Se añadió identificación y definición reales a las tarjetas KPI y se corrigió la distribución móvil de acciones y su desbordamiento.
- Diferencias identificadas: la disposición en la misma fila de un KPI y un gráfico fue solicitada expresamente por el usuario; las maquetas usan métricas, controles y afirmaciones sintéticas omitidas o sustituidas según `implementation-conflicts.md`; la gestión conserva acciones realmente implementadas y el nombre no editable. Shell, densidad y composición no son idénticos; la captura Stitch de gestión presenta controles recortados. No se afirma fidelidad exacta.
- La revisión independiente verificó que las consultas y altas de KPI sin `catalog:read` responden 403 uniforme para identificadores existentes e inexistentes; con scopes requeridos funcionan, y con acceso a catálogo pero sin `queries:execute` se preservan 403/404. El README de backend y API-001 explicitan el cambio de compatibilidad para consumidores antiguos. La autorización individual por KPI sigue fuera de este incremento.
- Backend completo: código 0, una prueba PostgreSQL omitida; interfaz: 159 pruebas aprobadas en 48 archivos; tipos y compilación: código 0; navegador: 6 pruebas aprobadas con base y servicios aislados, incluyendo errores/recuperación, invitado, acceso genérico, posiciones y accesibilidad. El primer intento de navegador detectó desbordamiento móvil tras la composición de acciones; se reprodujo y corrigió antes de la repetición aprobada.
- El usuario comunicó conformidad funcional de todos los casos, sin evidencia individual adjunta. La integración local y las diferencias visuales señaladas no convierten esta entrega de laboratorio en una aprobación de producción ni en la finalización de la historia US-006 completa.

## Integración local

- A solicitud del usuario, `master` avanzó de `1883e7e` a `dae9b52` mediante fast-forward. Antes de integrar se verificó que el índice principal estaba vacío y que ninguna de las rutas entrantes coincidía con los cambios locales existentes. No se ejecutó pull, push, migración de bases manuales ni limpieza de worktrees.
- Keycloak comunitario 26.8.1 funciona en Docker Compose con PostgreSQL y esquema dedicado `keycloak`; la aplicación BI aún no está integrada con Keycloak. La autorización individual por KPI y demás requisitos productivos continúan en el siguiente incremento.
- Verificación desde `master` integrado: backend completo con código 0 y una integración PostgreSQL omitida; 25 pruebas focalizadas de interfaz y 6 recorridos de navegador aprobados; tipos y compilación con código 0. El entorno de navegador usó puertos y SQLite aislados.
- La comparación visual identifica diferencias residuales: la captura de gestión contiene una repetición del shell fijo en la imagen de página completa; algunas secciones y estados del mockup contienen información o controles no disponibles, y la distribución conjunta KPI/gráfico fue solicitada por el usuario. Se entrega evidencia sin certificar equivalencia exacta de píxeles; se mantiene el alcance de laboratorio y la conformidad funcional comunicada por el usuario.
