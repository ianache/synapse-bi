# Verificación de navegación compartida

Fecha: 2026-10-18. Rama `feat/shared-navigation`, worktree `.worktrees/shared-navigation`.
Alcance: organismos React Menubar/Mainbar, integración de layouts y ejemplos UI.
No es aceptación humana ni validación del backend, PostgreSQL, publicación o US-005.

## Referencia y comparación visual

[Google Stitch: kit aprobado](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=5bc81890512745cfa93a1fcadf2bd4a0).
Reconsultado al implementar y verificar: HTML `14317538571573095280`, captura `7272703772481844155`, sin cambio de identificadores.
Prevalece la confirmación humana del Mainbar actualizado de una fila, sin búsqueda ni badges de entorno.

Se revisaron capturas reales de escritorio y móvil frente al organismo de referencia:
lateral oscuro `#111827`, ancho256px, activo/CTA `#991b1b`, grupos, marca,
pie de organización y Mainbar blanco con breadcrumbs/utilidades/perfil.
La cabecera mide64px en escritorio a escala normal; al ampliar texto puede crecer.
Las capturas son evidencia de inspección, no una comparación automática pixel-perfect.

Excepciones aprobadas/honestas: identidad ausente = «Perfil no disponible»;
organización de laboratorio identificada como demostración; controles no implementados
deshabilitados con etiqueta; sin salud ni notificaciones ficticias. El aviso de laboratorio
se conserva en el contenido, no en la cabecera. No se retematiza el contenido de cada módulo.

## Evidencia reproducible

Desde `codebase/`:

```powershell
$env:PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run test:navigation
npm test -- --reporter=dot --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run typecheck
npm run build
npm run build-storybook
```

La suite inicia sólo Vite5197 (`BI_NAV_UI_PORT` opcional), puerto estricto,
sin reutilizar servicios. Intercepta explícitamente las lecturas API y la sesión
development con DTO de prueba. Toda petición no prevista recibe501 y hace fallar
la prueba. El proxy apunta a127.0.0.1:1 como protección adicional; no hay backend
ni credenciales reales. No modifica los servicios manuales ni tablas Gold.

Cobertura de navegador:

- Siete familias, entradas directas y SPA en orden inverso para detectar conflictos CSS.
- Fuentes/nuevo/detalle, datasets/nuevo/detalle, catálogo/detalle, modelos/nuevo/detalle/comparar y dashboard anterior.
- Viewports1440,390,320 y frontera1023/1024; texto de cabecera200%, breadcrumb largo con `/` sin partir entidades.
- Drawer nativo: teclado, foco, Escape, fondo, resize y prioridad de otro diálogo; formulario conserva texto.
- Fuentes WOFF2 locales con red externa bloqueada; axe en escritorio/móvil y drawer.
- Login sin barras operativas; kit de componentes con navegación sólo local al ejemplo.

Artefactos regenerables ignorados: `codebase/test-results-navigation/screens/`.
`desktop-0..6.png` = Inicio/Explorar/Dashboards/Fuentes/Datasets/Catálogo/Modelos.
`subroute-0..8.png` siguen el orden de subrutas anterior; `mobile-drawer.png`,
`mobile-closed.png`, `reflow-*.png`, `mobile-family-*.png` y `component-kit.png`.
Los screenshots full-page del drawer muestran el backdrop limitado al viewport nativo.
No representan una capa que deba cubrir todo el documento desplazable.

## Resultados y correcciones

La primera aceptación detectó overflow del perfil neutral con texto200% y una
importación heredada de Google Fonts en el CSS general. Se corrigieron con wrap
y fuentes locales; los nombres públicos originales siguen siendo aliases de los
mismos cuatro archivos. Una etiqueta errónea de prueba («KPIs» por «KPI») se corrigió
sin alterar producto. Se amplió el presupuesto de la matriz de rutas a240s por
sus23 entradas en este host; ninguna aserción fue retirada.

La regresión del dashboard anterior reprodujo la ausencia de h1 y se corrigió
la jerarquía, sin modificar consultas ni filtros. Primera suite de navegador
corregida:5/5,4.1min, sin infracciones axe ni peticiones externas/no previstas.

Tipos: exit0. Aplicación: exit0,142 módulos, cuatro WOFF2.
Storybook: exit0,165 módulos, fuentes y licencia distribuidas.
Advertencias de herramientas: API CJS de Vite, colores de terminal,
runtime eval y chunk de documentación >500kB de Storybook; no son fallos de compilación.

Cobertura móvil ampliada y kit: suite completa de navegador6/6,4.5min.
Tipos de fixtures/config/pruebas Playwright: `tsc --noEmit` explícito, exit0.
Regresión completa previa a revisión:130/130 pruebas,45/45 archivos,941.07s, exit0.
`git diff --check`: exit0. Advertencia adicional de Node26 sobre localStorage
experimental sin archivo; los tests de rutas pasan. Revisión independiente detallada a continuación.

## Revisión independiente y correcciones finales

Revisión única read-only de toda la rama `6a04a1e..a9f2ce9`: sin críticos;
dictamen inicial «con correcciones». Detectó pérdida del callback de DashboardLayout
para destinos relativos/fragmentos, y obstrucción del destino de salto por la cabecera.
Este último se reclasificó como importante por su impacto en navegación por teclado.
Regresiones RED:5 destinos internos fallidos/5 casos aprobados en DashboardLayout;
prueba real de enlace de salto fallida. Ajustes: clasificar destinos relativos,
queries y fragmentos como internos manteniendo esquemas externos nativos; medir
la altura real de la cabecera con ResizeObserver para el margen de scroll del contenido.
Verificación final:138/138 pruebas frontend en45/45 archivos,680.28s, exit0;
7/7 pruebas de navegador,4.4min, exit0. DashboardLayout10casos aprobados;
enlace de salto aprobado con altura normal y ampliada. La suite final añadió
`--pool=threads` al mismo comando, manteniendo un worker y aislamiento por archivo.
Tipos, tipos de fixtures/pruebas de navegador, aplicación142módulos y
Storybook165módulos volvieron a terminar exit0 tras las correcciones.
No se solicita segunda revisión ni se declara nueva aprobación independiente;
los dos hallazgos funcionales se cierran con sus regresiones RED→GREEN y suite completa.

Menor diferido: líneas vacías finales en `playwright.navigation.config.ts`,
`tests/navigation/fixtures.ts` y `tests/navigation/navigation.spec.ts`.
El `git diff --check` del árbol de trabajo pasó; la comprobación del rango de commits
señala esas tres líneas (exit1). No se presenta el rango como libre de advertencias.

El revisor comprobó en Chromium la prioridad del modal de negocio al redimensionar
con drawer abierto. No certificó equivalencia visual exacta (falló la descarga de
referencia en su entorno), no repitió suites completas y no verificó Safari/Firefox,
lector de pantalla manual ni backend. La evidencia del implementador y esos límites
se mantienen separados; no se declara aceptación humana.

## Límites y entrega

Chromium/Chrome local Windows, no matriz Safari/Firefox ni lector de pantalla manual.
No se ejecutan suites PostgreSQL para este cambio UI. Pruebas de navegación no
certifican persistencia/seguridad de backend ni funcionalidades no implementadas.
Los controles Sidebar/TopBar anteriores y sus contratos siguen exportados.
No merge, push, publicación, reinicio ni eliminación automática del worktree.
