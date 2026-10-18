# Menubar y Mainbar reutilizables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar los organismos Menubar y Mainbar fieles a Stitch y compartirlos entre todas las páginas operativas existentes.

**Architecture:** Componentes React presentacionales exportados por la librería actual. SynapseShell y DashboardLayout componen ambos organismos y mantienen sus contratos anteriores. Estilos y fuentes compartidos independientes del CSS por módulo, sin cambios de backend.

**Tech Stack:** React19/TypeScript/Vite existentes, Vitest/Testing Library, Storybook y Playwright/axe existentes. Sin dependencias nuevas de producto.

**Spec:** [diseño aprobado](../specs/2026-10-18-menubar-mainbar-design.md), aprobación humana «conforme», 2026-10-18. Este plan requiere revisión y elección de ejecución antes de implementar.

## Global Constraints

- Menubar: 256 px (16 rem), fondo `#111827`, textos neutros claros, activo y CTA `#991b1b`, hover `#7f1d1d`.
- Mainbar: una fila, 64 px incluyendo borde/padding en escritorio a zoom normal; sin búsqueda ni badges de entorno en la cabecera.
- Desde1024px lateral persistente; por debajo drawer cerrado inicialmente. Zoom/texto ampliado puede aumentar altura por accesibilidad.
- Precedencia: decisión humana explícita > organismo actualizado > blueprint compatible. Referencia Stitch `5bc81890512745cfa93a1fcadf2bd4a0`; exportación HTML `14317538571573095280`, captura `7272703772481844155`.
- Reconsultar captura/HTML exactos al ejecutar; si el diseño cambia, registrar diferencias y solicitar decisión, no sustituirlo silenciosamente.
- Fuentes locales Hanken Grotesk/Plus Jakarta Sans con licencia; no CDN/Angular/router/framework CSS nuevo.
- Capas Menubar30/Mainbar20/acciones10; modales de negocio por encima del drawer. No copiar puntos de salud/notificaciones sin datos reales.
- Conservar Sidebar/TopBar, las props anteriores de layouts y la lógica de formularios, permisos, persistencia y recuperación US-004.
- No backend, credenciales, DB manual, Gold, nuevas utilidades, roles, publicación US-004 o US-005. No push, merge, publicación NPM ni reinicio de servicios automático.
- Aislamiento al ejecutar mediante using-git-worktrees; preservar cambios ajenos. No eliminar recursivamente worktrees con junctions ni copiar secretos/DB.

## Review Focus

1. Clic Ctrl/Meta/Shift/Alt o botón central: preservar navegación nativa y no cerrar drawer como si hubiera navegación SPA (T1/T2).
2. Cambiar de móvil a desktop con drawer abierto: liberar foco/scroll y volver cerrado a móvil; desmontaje/StrictMode sin residuos (T2).
3. Breadcrumb con nombre que contiene `/`, ruta larga o perfil ausente: no dividir entidades, inventar identidad ni desbordar documento (T3/T6).
4. CSS de cada módulo cargado en distinto orden y entrada directa a subruta: barras idénticas, activo correcto y formulario conservado (T4/T6).
5. Drawer junto a modal de negocio: foco/fondo no se liberan indebidamente y el modal conserva prioridad (T2/T6).

## Mapa de archivos

Raíz de comandos: `codebase/`, salvo Git/ledger. Archivos nuevos indicados como tales.

- `packages/design-system/src/organisms/navigation/`: nuevos `types.ts`, `NavigationLink.tsx`, `navigation.css`; contratos/enlaces comunes, sin negocio.
- `packages/design-system/src/organisms/Menubar/`: nuevos `Menubar.tsx`, `Menubar.test.tsx`, `useMenubarDrawer.ts`, `MenubarDrawer.test.tsx`.
- `packages/design-system/src/organisms/Mainbar/`: nuevos `Mainbar.tsx`, `Mainbar.test.tsx`.
- `packages/design-system/src/assets/navigation-fonts/`: cuatro WOFF2 y OFL trasladados desde `apps/bi-analytics/src/assets/us004-fonts/`; nuevo `fonts.css`. Mantener aliases US004 y shim CSS de importación anterior para no romper modelos.
- Modificar `packages/design-system/src/organisms/index.ts`, `src/types/contracts.test.ts`, `src/atoms/Icon/Icon.tsx` sólo para exports, contratos y glyphs necesarios. CSS de navegación importado desde organismos; sin retematizar átomos globalmente.
- Nuevo `apps/bi-analytics/src/components/shellNavigation.ts`; modificar `SynapseShell.tsx`; nuevo `SynapseShell.test.tsx`.
- Modificar `packages/design-system/src/templates/DashboardLayout/DashboardLayout.tsx` y su test; nuevo `layout.css` en ese directorio.
- Modificar `apps/bi-analytics/src/pages/kpi-workspace.css`, `pages/datasets/stitch-datasets.css`, `pages/semantic-catalog/stitch-catalog.css`, `pages/semantic-models/semantic-models.css` sólo en estilos de shell en conflicto.
- Modificar `apps/bi-analytics/src/app/routes.test.tsx`, `pages/semantic-models/ModelsChrome.test.tsx`; los componentes de contenido no requieren cambios de negocio.
- Nuevos `apps/storybook/src/stories/menubar.stories.tsx` y `mainbar.stories.tsx` (un default meta por archivo); modificar `storybook-contract.test.ts`, `packages/design-system/src/templates/ComponentKitShowcase/ComponentKitShowcase.tsx`; nuevos `NavigationPreview.tsx` y `NavigationPreview.test.tsx` junto al showcase.
- Nuevos `playwright.navigation.config.ts`, `tests/navigation/navigation.spec.ts`, `tests/navigation/fixtures.ts`; modificar `package.json` sólo para script y `.gitignore` para artefactos específicos.
- Nuevos `docs/ux/navigation/verification.md` y `.superpowers/sdd/2026-10-18-menubar-mainbar-plan/progress.md` desde raíz. Ledger registra RED/GREEN, decisiones y revisión, no contraseñas ni payloads sensibles.

## Task 1: Menubar presentacional y contrato público

**Files:** tipos/enlace/CSS compartidos, Menubar y test, exports/contracts, fuentes/Icon del mapa.
**Interfaces:** consumir `IconName` y React; producir tipos exactos de §4 del spec y `Menubar(props: MenubarProps): React.JSX.Element`. `NavigationLink` interno recibe `{href, onNavigate?, children, ...anchorProps}` y preserva semántica de enlace.

- [ ] **1. Escribir RED** `Menubar.test.tsx`: `renders_groups_and_exact_active_item`, `unavailable_items_have_no_fake_href`, `navigation_preserves_modified_clicks`, `brand_preserves_native_navigation`. Incluir fixture de dos grupos y aserciones:

```tsx
expect(screen.getByRole('link', {name: 'Modelos semánticos'})).toHaveAttribute('aria-current', 'page')
expect(screen.queryByRole('link', {name: /Glosario/})).not.toBeInTheDocument()
expect(screen.getByText(/Glosario.*no disponible/)).toBeInTheDocument()
fireEvent.click(screen.getByRole('link', {name: 'Inicio'}), {ctrlKey: true})
expect(onNavigate).not.toHaveBeenCalled()
```

  Añadir contratos TypeScript para exportar ambos tipos de navegación y rechazar `href` combinado con `unavailableReason` mediante `@ts-expect-error`. Preservar imports existentes Sidebar/TopBar.
- [ ] **2. Ejecutar RED:** `npx vitest run packages/design-system/src/organisms/Menubar/Menubar.test.tsx --maxWorkers=1 --minWorkers=1`. Esperar fallo por export/componente inexistente, no por fixture mal formado.
- [ ] **3. Implementar mínimo:** estructuras `aside/nav`, marca, grupos, activo, CTA/utilidades deshabilitadas con razones y pie de organización sin salud ficticia. Enlaces comunes interceptan sólo clic primario interno sin modificadores y no interceptan `target`/`download`. Mantener fallback sin grupo/activo/organización. Estilos propios `bi-menubar`/`bi-mainbar`/`bi-navigation-*`, sin clases antiguas del shell. Mover fuentes con aliases originales, incorporar familias de navegación y licencia sin duplicar WOFF2. Reutilizar Icon; si un glyph de Stitch falta, añadir nombre SVG específico sin alterar glyphs existentes. No sustituir shapes por un icono de otro significado.
- [ ] **4. Ejecutar GREEN:** comando anterior, `npm run typecheck` y `npx vitest run packages/design-system/src/types/contracts.test.ts --maxWorkers=1 --minWorkers=1`. Confirmar aliases de modelos siguen resolviendo; la medida/paleta real se prueba en T6, no con jsdom.
- [ ] **5. Commit:** sólo rutas T1, mensaje `feat: add reusable Stitch Menubar and navigation contracts`; registrar RED/GREEN en ledger.

## Task 2: Drawer móvil, foco y ciclo de vida

**Files:** `Menubar.tsx`, `useMenubarDrawer.ts`, `MenubarDrawer.test.tsx`, `navigation.css`.
**Interfaces:** consumir `MenubarProps.mobileOpen/onMobileClose`; producir hook interno `useMenubarDrawer(options: {open: boolean; panelRef: React.RefObject<HTMLElement | null>; onClose: () => void}): {isMobile: boolean}`. Menubar notifica cierre; el consumidor mantiene estado, conectado en T4. MatchMedia `(min-width: 1024px)` compartido en hook, no dos breakpoints contradictorios.

- [ ] **1. Escribir RED:** `opens_and_traps_focus_then_restores_trigger`, `escape_backdrop_and_navigation_request_close`, `desktop_transition_releases_modal_effects`, `strictmode_and_unmount_restore_prior_scroll`, `nested_business_dialog_keeps_priority`. Mock matchMedia cambiable, probar estado controlado con un harness; afirmar limpieza del valor original de `body.style.overflow`, no imponer cadena vacía. Clic Ctrl en enlace no solicita cierre. Cuando aparece modal de negocio sobre drawer, el trap inferior se suspende y Escape no cierra ambos.
- [ ] **2. Ejecutar RED:** `npx vitest run packages/design-system/src/organisms/Menubar/MenubarDrawer.test.tsx --maxWorkers=1 --minWorkers=1`. Fallo esperado: foco/limpieza/cierre aún ausentes.
- [ ] **3. Implementar mínimo:** panel móvil accesible modal con nombre, cierre visible, backdrop y trapping sólo mientras es la capa modal activa. Fondo no interactivo y scroll bloqueado con restauración respetuosa de locks ya existentes; eventos/cambios de breakpoint limpian sus efectos. Drawer cerrado no conserva enlaces en orden de tabulación. No atribuir `aria-modal` al lateral desktop. Restaurar foco si el activador sigue conectado; navegación permite foco del nuevo contenido. Preferir composición con infraestructura modal existente si admite estos requisitos sin romperla.
- [ ] **4. Ejecutar GREEN:** suites T1/T2 y tests existentes de modales/experiencias; `npm run typecheck`. Comprobar ausencia de listeners activos tras desmontaje.
- [ ] **5. Commit:** sólo rutas T2 y ledger, `feat: add accessible mobile Menubar drawer`.

## Task 3: Mainbar de una fila y breadcrumbs reutilizables

**Files:** Mainbar/test, navigation CSS, exports/contracts.
**Interfaces:** consumir `BreadcrumbItem`, `ShellAction`, `MainbarProps` del spec y `NavigationLink` T1. Producir `Mainbar(props: MainbarProps): React.JSX.Element`, con toggle conectado por `menubarId`/estado/callback; no búsqueda ni fetching.

- [ ] **1. Escribir RED:** `renders_structured_breadcrumbs_without_splitting_slashes`, `labels_current_location_without_fake_link`, `toggles_controlled_mobile_menu`, `profile_and_actions_do_not_invent_capabilities`, `missing_profile_is_neutral`. Usar etiqueta `Ventas / Canal`; debe permanecer un solo breadcrumb. Afirmar `queryByRole('searchbox') === null`, toggle `aria-controls` correcto, `aria-expanded=false`, utilidades deshabilitadas y ninguna notificación ficticia. Perfil sin callback no presenta menú operativo.
- [ ] **2. Ejecutar RED:** `npx vitest run packages/design-system/src/organisms/Mainbar/Mainbar.test.tsx --maxWorkers=1 --minWorkers=1`.
- [ ] **3. Implementar mínimo:** breadcrumb `ol` con separación decorativa, utilidades, divisor y perfil; avatar rojo y texto según datos recibidos. CSS `min-height:64px`, box-sizing y una fila a escala normal; padding y contenido producen 64px, crecimiento permitido para texto ampliado. Rail de breadcrumbs `min-width:0` con overflow interno accesible y perfil compacto bajo640px; toggle visible bajo1024px. No derivar el perfil de la ruta ni mostrar chevron de selector cuando no existe esa capacidad.
- [ ] **4. Ejecutar GREEN:** suite T3 más contratos y `npm run typecheck`. T6 confirma altura real, reflow y contraste.
- [ ] **5. Commit:** sólo rutas T3 y ledger, `feat: add reusable single-row Stitch Mainbar`.

## Task 4: Composición en shell y layouts sin regresiones de negocio

**Files:** shellNavigation/SynapseShell/tests, DashboardLayout/layout.css/test, routes.test, ModelsChrome.test y cuatro CSS por módulo del mapa.
**Interfaces:** consumir organismos T1–T3. Producir `getShellNavigation(active: ShellSection, pathname: string): {groups: NavigationGroup[]; activeItemId?: string}` y `ShellSection` con los seis valores actuales. Preservar `SynapseShell({children,active,breadcrumb})`; añadir `breadcrumbs?: BreadcrumbItem[]`. DashboardLayout conserva `navigation/onNavigate/children` y admite `mainbar?: Pick<MainbarProps,'breadcrumbs'|'actions'|'profile'>` y `activeHref?: string`.

- [ ] **1. Escribir RED:** `SynapseShell.test.tsx` parametrizado por Inicio/Explorar/Dashboards/Fuentes/Datasets/Catálogo/Modelos y subrutas. Afirmar un header global, un nav principal, activo correcto; excepción `/` activa Inicio aunque `active=explore`. Preservar children y callbacks de formularios al abrir/cerrar drawer. Sin selección basada sólo en nombre visible. Ampliar DashboardLayout test para contratos previos, Ctrl-click y navegación mediante enlace específico, sin depender de que sea el primer elemento tabulable. Actualizar ModelsChrome a grupo exacto `Gobernanza & Semántica` sólo donde cambia esta decisión aprobada.
- [ ] **2. Ejecutar RED:** `npx vitest run apps/bi-analytics/src/components/SynapseShell.test.tsx packages/design-system/src/templates/DashboardLayout/DashboardLayout.test.tsx apps/bi-analytics/src/app/routes.test.tsx --maxWorkers=1 --minWorkers=1`.
- [ ] **3. Implementar mínimo:** configuración central con rutas existentes y utilidades honestamente no disponibles. Ambos layouts mantienen estado drawer y cierre al navegar/cambiar breakpoint; no manipular historia desde la librería. DashboardPage conserva sus datos y filtros. Breadcrumb legacy string se muestra como una etiqueta intacta; usar prop estructurada cuando haya niveles reales, no `split('/')`. Mantener avisos de laboratorio en contenido accesible, no en Mainbar. Perfil/organización sólo de datos suministrados o neutral/contexto demo explícito; no añadir consultas de identidad ni inferir rol por URL. Aislar CSS de barras y conservar grid/canvas específico por página, `#workspace`, skip link y pies de acciones. No desmontar formularios por togglear navegación.
- [ ] **4. Ejecutar GREEN:** comando anterior más `npx vitest run apps/bi-analytics/src/pages packages/design-system/src/templates --maxWorkers=1 --minWorkers=1 --testTimeout=15000`, `npm run typecheck`. Comparar entrada directa y navegación SPA; formularios aún conservan selección/cancelación/revisión.
- [ ] **5. Commit:** sólo rutas T4 y ledger, `refactor: compose reusable navigation across application layouts`.

## Task 5: Storybook y catálogo de organismos

**Files:** menubar.stories/mainbar.stories, storybook-contract.test, NavigationPreview/test y ComponentKitShowcase.
**Interfaces:** consumir exports públicos T1–T3. Producir `NavigationPreview(): React.JSX.Element` con datos de demostración identificados y estado local sólo para navegación del ejemplo; no datos de sesión reales.

- [ ] **1. Escribir RED:** contrato de historias `Organisms/Navigation/Menubar` y `Organisms/Navigation/Mainbar`; casos Desktop, MobileDrawer, UnavailableActions, LongBreadcrumbs, MissingProfile y Combined. Test de preview confirma ambos organismos, estados interactivos del ejemplo y que acciones no disponibles no disparan notices falsos. El showcase conserva sus ejemplos actuales y añade los dos, sin sustituirlos por HTML duplicado.
- [ ] **2. Ejecutar RED:** `npx vitest run apps/storybook/src/stories/storybook-contract.test.ts packages/design-system/src/templates/ComponentKitShowcase/NavigationPreview.test.tsx --maxWorkers=1 --minWorkers=1`.
- [ ] **3. Implementar mínimo:** stories con args tipados por API pública, control de estado y tamaños fijos de preview que no secuestran la página de Storybook. Preview en `/componentes` con etiquetas de demostración; no envolver todo el kit en un segundo shell ni copiar el blueprint completo fuera del alcance.
- [ ] **4. Ejecutar GREEN:** comando anterior, `npm run typecheck`, `npm run build-storybook`. Confirmar OFL en distribución de aplicación y fuentes accesibles desde Storybook sin CDN.
- [ ] **5. Commit:** sólo rutas T5 y ledger, `docs: showcase Menubar and Mainbar in component library`.

## Task 6: Evidencia en navegador y regresión final

**Files:** playwright.navigation.config, navigation.spec/fixtures, package.json/.gitignore y docs/ux/navigation/verification.md.
**Interfaces:** consumir rutas/layouts T4 y ejemplos T5. Producir script `test:navigation` = `playwright test --config playwright.navigation.config.ts`; evidencia en `test-results-navigation/` ignorada y reporte textual versionado.

- [ ] **1. Escribir pruebas de aceptación antes de ajustes finales:** fixtures controladas para autenticación development y lecturas `/me`, fuentes/datasets/catálogo/modelos según sus DTO existentes. No iniciar backend ni reenviar peticiones a API manual. Rutas no contempladas fallan explícitamente, no devolver `{}` genérico. Cubrir lista/nuevo/detalle/compare con datos técnicos de ejemplo identificados. No disparar mutaciones de negocio contra servicios reales.

```ts
expect(await page.locator('.bi-menubar').evaluate(el => el.getBoundingClientRect().width)).toBe(256)
expect(await page.locator('.bi-mainbar').evaluate(el => el.getBoundingClientRect().height)).toBe(64)
expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
```

  Tests específicos: `consistent_bars_after_direct_and_spa_navigation`, `drawer_keyboard_and_business_modal_priority`, `long_breadcrumb_reflow_preserves_content`, `local_fonts_without_external_network`, `login_has_no_operational_bars`. Verificar1440/390, frontera1023/1024 y320; altura64 sólo desktop normal. Capturar contenido del formulario antes/después de drawer para detectar pérdida. Repetir rutas en orden inverso para detectar CSS dependiente del orden. Probar texto200% sin exigir altura fija.
- [ ] **2. Ejecutar aceptación inicial:** config UI5197 por defecto, variable `BI_NAV_UI_PORT` opcional; `--strictPort`, `reuseExistingServer:false`, workers1, sólo servidor Vite en modo fixture y auth development interceptada. `PLAYWRIGHT_EXECUTABLE_PATH` acepta Chrome local existente. Ejecutar `npm run test:navigation`; si falla registrar causa, no relajar aserciones para obtener verde.
- [ ] **3. Ajustar sólo discrepancias verificadas:** reconsultar referencia Stitch exacta y comparar captura del organismo y de vistas KPI/Fuentes/Datasets/Catálogo/Modelos/dashboard con menú/cabecera; viewport móvil con drawer abierto/cerrado. Corregir capas, foco, tipografía o dimensiones en el componente responsable. Si exige cambiar decisión aprobada, detener y consultar; sin backend/DB ni nuevos datos sintéticos en producto.
- [ ] **4. Verificar resultado completo:** `npm test -- --reporter=dot --maxWorkers=1 --minWorkers=1 --testTimeout=15000`, `npm run typecheck`, `npm run build`, `npm run build-storybook`, `npm run test:navigation`. Desde raíz `git diff --check`. Exigir exit0/ningún fallo, registrar conteos reales, advertencias y diferencias visuales; no asumir que serán los97 tests anteriores. No ejecutar suites PostgreSQL para un cambio UI ni omitir esta distinción en el reporte.
- [ ] **5. Commit y handoff:** guardar reporte con referencia, decisiones, comandos/resultados, capturas y limitaciones. Commit sólo rutas T6/ledger, `test: verify shared Stitch navigation across routes`. Ejecutar una revisión independiente de toda la rama según método elegido; corregir hallazgos con pruebas específicas. No declarar aceptación humana ni integrar/publicar/limpiar automáticamente.

## Cobertura y elección de ejecución

Spec§1–3 y7 → T4; contratos§4 → T1/T3; responsive/estilos§5 → T1/T2/T3/T6;
estados/seguridad§6 → T1/T3/T4; Storybook y aceptación§8 → T5/T6; autorización§9
→ preflight/entrega. Los cinco Review Focus tienen casos asignados arriba.

Recomendación: **Native**, por interfaces estrechamente compartidas entre seis
tareas; un implementador mantiene continuidad y un revisor independiente verifica
la rama completa al final. Alternativa **Subagent-driven**: implementador y revisor
independientes por tarea, mayor revisión intermedia y coste de contexto. El usuario
debe revisar este plan y elegir antes de ejecutar. Tras elegir, crear worktree
aislado para este cambio, no reutilizar ni limpiar el de US-004 automáticamente.
