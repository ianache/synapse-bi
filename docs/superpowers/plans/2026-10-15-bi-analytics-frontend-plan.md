# BI Analytics Frontend and Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir en `codebase/` una aplicación BI Analytics navegable con React, TypeScript y Vite, una librería reutilizable basada en Atomic Design y un Storybook que documente y pruebe sus componentes.

**Architecture:** Se implementará un monorepo npm con dos aplicaciones (`bi-analytics` y `storybook`) y tres paquetes compartidos (`design-system`, `tokens` y `config`). La aplicación coordinará adaptadores mock tipados y estados de experiencia; `design-system` sólo presentará props y eventos, consumiendo tokens sin conocer APIs de negocio.

**Tech Stack:** React, TypeScript, Vite, Storybook, Vitest, Testing Library, axe para accesibilidad y npm workspaces.

**Spec:** `docs/superpowers/specs/2026-10-15-bi-analytics-frontend-design.md`

## Global Constraints

- La estructura debe mantenerse como monorepo y la aplicación y Storybook deben consumir el mismo paquete `design-system`.
- Los componentes reutilizables no acceden directamente a APIs de negocio, motores analíticos ni fuentes de datos.
- El primer incremento usa mocks tipados y debe permitir sustituir el adaptador por Semantic API sin cambiar la API pública del Design System.
- La librería se organiza por Tokens, Atoms, Molecules, Organisms, Templates y Patterns; la taxonomía no obliga a separar cada nivel en un paquete.
- Deben representarse explícitamente los estados `idle`, `loading`, `success`, `empty`, `error`, `stale`, `unauthorized` y `disabled` donde sean relevantes.
- No se seleccionará todavía una librería de charts concreta; `ChartCard` recibirá una visualización presentacional mínima y datos por props.
- No se implementan en este incremento autenticación productiva, persistencia, multi-tenancy operativo, publicación externa ni un motor OLAP/warehouse.

## Review Focus

- **Dependencia accidental de APIs en componentes:** `MetricCard`, `FilterBar`, `DataTable` y `ChartCard` sólo aceptan props y callbacks; la prueba de contrato debe fallar si requieren un adapter.
- **Estados incompletos:** la página dashboard debe renderizar `loading`, `success`, `empty` y `error`, y Storybook debe exponer también `stale`, `unauthorized` y `disabled` en los componentes aplicables.
- **Accesibilidad de controles y tablas:** navegación por teclado, nombres accesibles, foco visible y roles correctos deben quedar cubiertos por tests de componente y axe.
- **Duplicación entre aplicación y Storybook:** ambos consumidores deben resolver `@bi-analytics/design-system` y `@bi-analytics/tokens` desde workspace; un smoke test debe validar los exports públicos.
- **Sustitución del mock:** una prueba del adapter de página debe verificar que el contrato `SemanticQueryState<T>` es independiente de la implementación mock.

---

### Task 1: Scaffold del monorepo y configuración compartida

**Files:**
- Create: `codebase/package.json`
- Create: `codebase/tsconfig.json`
- Create: `codebase/vite.config.ts`
- Create: `codebase/vitest.config.ts`
- Create: `codebase/.gitignore`
- Create: `codebase/packages/config/package.json`
- Create: `codebase/packages/config/tsconfig.base.json`
- Create: `codebase/packages/config/vite.config.ts`
- Create: `codebase/packages/config/vitest.setup.ts`
- Create: `codebase/packages/tokens/package.json`
- Create: `codebase/packages/design-system/package.json`
- Create: `codebase/apps/bi-analytics/package.json`
- Create: `codebase/apps/storybook/package.json`
- Test: `codebase/scripts/verify-workspace.mjs`

**Interfaces:**
- Produces npm workspace names `@bi-analytics/config`, `@bi-analytics/tokens`, `@bi-analytics/design-system`, `@bi-analytics/bi-analytics` and `@bi-analytics/storybook`.
- Produces scripts `dev`, `build`, `test`, `test:accessibility`, `storybook` and `build-storybook` at the root.

- [ ] **Step 1: Write the failing workspace verification**

  Define `verify-workspace.mjs` to assert the five package manifests, workspace globs and root scripts exist.

- [ ] **Step 2: Run the verification to confirm the scaffold is absent**

  Run: `node codebase/scripts/verify-workspace.mjs`

  Expected: FAIL because the `codebase/` workspace files do not exist.

- [ ] **Step 3: Implement the monorepo manifests and shared configuration**

  Configure npm workspaces for `apps/*` and `packages/*`, strict TypeScript, path-safe package exports, Vite, Vitest and a shared Testing Library setup. Keep all build/test dependencies in the workspace root unless a package must expose a runtime dependency.

- [ ] **Step 4: Run the verification and type/config checks**

  Run: `node codebase/scripts/verify-workspace.mjs`

  Expected: PASS and all expected workspace names/scripts are detected.

### Task 2: Tokens y contrato público del Design System

**Files:**
- Create: `codebase/packages/tokens/src/tokens.css`
- Create: `codebase/packages/tokens/src/theme.ts`
- Create: `codebase/packages/tokens/src/index.ts`
- Create: `codebase/packages/tokens/README.md`
- Create: `codebase/packages/design-system/src/types/semantic.ts`
- Create: `codebase/packages/design-system/src/types/components.ts`
- Create: `codebase/packages/design-system/src/index.ts`
- Test: `codebase/packages/tokens/src/theme.test.ts`
- Test: `codebase/packages/design-system/src/types/contracts.test.ts`

**Interfaces:**
- Produces `ThemeName = 'light' | 'dark'`, CSS custom properties for color, typography, spacing, radius, elevation and breakpoints, and `themeClass(name: ThemeName): string`.
- Produces `LineageReference`, `MetricCardProps` and `SemanticQueryState<T>` with the exact fields and union values from the spec.

- [ ] **Step 1: Write failing token and contract tests**

  Assert that `themeClass('light')` and `themeClass('dark')` are stable, that the token stylesheet contains both themes, and that a valid `MetricCardProps` and `SemanticQueryState<number>` compile without API or domain dependencies.

- [ ] **Step 2: Run focused tests to verify failure**

  Run: `npm --prefix codebase test -- packages/tokens/src/theme.test.ts packages/design-system/src/types/contracts.test.ts`

  Expected: FAIL because the token and type modules do not exist.

- [ ] **Step 3: Implement tokens and public types**

  Define semantic visual tokens as CSS variables and export the TypeScript theme helper. Keep `MetricCardProps` presentational and place `LineageReference` in the Design System type boundary without making atoms or molecules depend on it.

- [ ] **Step 4: Run focused tests and typecheck**

  Run: `npm --prefix codebase test -- packages/tokens/src/theme.test.ts packages/design-system/src/types/contracts.test.ts`

  Expected: PASS.

### Task 3: Atoms y molecules accesibles

**Files:**
- Create: `codebase/packages/design-system/src/atoms/Button/Button.tsx`
- Create: `codebase/packages/design-system/src/atoms/Button/Button.test.tsx`
- Create: `codebase/packages/design-system/src/atoms/Text/Text.tsx`
- Create: `codebase/packages/design-system/src/atoms/Badge/Badge.tsx`
- Create: `codebase/packages/design-system/src/atoms/Input/Input.tsx`
- Create: `codebase/packages/design-system/src/atoms/Spinner/Spinner.tsx`
- Create: `codebase/packages/design-system/src/atoms/Divider/Divider.tsx`
- Create: `codebase/packages/design-system/src/molecules/MetricValue/MetricValue.tsx`
- Create: `codebase/packages/design-system/src/molecules/StatusChip/StatusChip.tsx`
- Create: `codebase/packages/design-system/src/molecules/SearchField/SearchField.tsx`
- Create: `codebase/packages/design-system/src/molecules/FilterField/FilterField.tsx`
- Create: `codebase/packages/design-system/src/molecules/DateRangePicker/DateRangePicker.tsx`
- Create: `codebase/packages/design-system/src/atoms/index.ts`
- Create: `codebase/packages/design-system/src/molecules/index.ts`
- Modify: `codebase/packages/design-system/src/index.ts`
- Test: `codebase/packages/design-system/src/molecules/SearchField/SearchField.test.tsx`

**Interfaces:**
- `Button` supports `variant`, `disabled`, `loading`, keyboard activation and `onClick`.
- `SearchField` supports `value`, `onChange`, `onSubmit`, `label`, `placeholder` and disabled/loading presentation.
- All components accept `className` and standard ARIA/DOM attributes where applicable.

- [ ] **Step 1: Write failing interaction and accessibility tests**

  Test Button keyboard/click behavior, loading/disabled behavior, SearchField submission, accessible labels and axe-clean output.

- [ ] **Step 2: Run focused tests to verify failure**

  Run: `npm --prefix codebase test -- packages/design-system/src/atoms/Button/Button.test.tsx packages/design-system/src/molecules/SearchField/SearchField.test.tsx`

  Expected: FAIL because components and exports do not exist.

- [ ] **Step 3: Implement atoms and molecules with token-backed styles**

  Use semantic HTML, visible focus styles and controlled props. Do not import application adapters or BI-specific data types into this layer.

- [ ] **Step 4: Run interaction, accessibility and type checks**

  Run: `npm --prefix codebase test -- packages/design-system/src/atoms/Button/Button.test.tsx packages/design-system/src/molecules/SearchField/SearchField.test.tsx`

  Expected: PASS with no axe violations.

### Task 4: Organisms, templates y patrones de dashboard

**Files:**
- Create: `codebase/packages/design-system/src/organisms/MetricCard/MetricCard.tsx`
- Create: `codebase/packages/design-system/src/organisms/FilterBar/FilterBar.tsx`
- Create: `codebase/packages/design-system/src/organisms/DataTable/DataTable.tsx`
- Create: `codebase/packages/design-system/src/organisms/ChartCard/ChartCard.tsx`
- Create: `codebase/packages/design-system/src/organisms/Sidebar/Sidebar.tsx`
- Create: `codebase/packages/design-system/src/organisms/TopBar/TopBar.tsx`
- Create: `codebase/packages/design-system/src/templates/DashboardLayout/DashboardLayout.tsx`
- Create: `codebase/packages/design-system/src/templates/AnalysisWorkspace/AnalysisWorkspace.tsx`
- Create: `codebase/packages/design-system/src/patterns/experienceStates.tsx`
- Create: `codebase/packages/design-system/src/organisms/index.ts`
- Create: `codebase/packages/design-system/src/templates/index.ts`
- Create: `codebase/packages/design-system/src/patterns/index.ts`
- Modify: `codebase/packages/design-system/src/index.ts`
- Test: `codebase/packages/design-system/src/organisms/MetricCard/MetricCard.test.tsx`
- Test: `codebase/packages/design-system/src/organisms/DataTable/DataTable.test.tsx`
- Test: `codebase/packages/design-system/src/templates/DashboardLayout/DashboardLayout.test.tsx`

**Interfaces:**
- `MetricCard` consumes `MetricCardProps` and emits no business API calls.
- `DataTable<T>` consumes `columns`, `rows`, `loading`, `empty`, `error` and row callbacks through generic props.
- `ChartCard` consumes title, series and status props; it does not select or expose a charting library.
- `DashboardLayout` consumes navigation and page slots and supports responsive layout.

- [ ] **Step 1: Write failing organism/template tests**

  Cover metric success/loading/error, table empty/loading and keyboard-accessible dashboard layout navigation. Add assertions for `stale`, `unauthorized` and `disabled` presentation helpers where applicable.

- [ ] **Step 2: Run focused tests to verify failure**

  Run: `npm --prefix codebase test -- packages/design-system/src/organisms/MetricCard/MetricCard.test.tsx packages/design-system/src/organisms/DataTable/DataTable.test.tsx packages/design-system/src/templates/DashboardLayout/DashboardLayout.test.tsx`

  Expected: FAIL because organisms/templates do not exist.

- [ ] **Step 3: Implement organisms, templates and reusable state patterns**

  Compose atoms and molecules only. Use semantic table markup, explicit loading/empty/error affordances, and a lightweight presentational chart representation so the chart-library decision remains open.

- [ ] **Step 4: Run component and accessibility tests**

  Run: `npm --prefix codebase test -- packages/design-system/src/organisms/MetricCard/MetricCard.test.tsx packages/design-system/src/organisms/DataTable/DataTable.test.tsx packages/design-system/src/templates/DashboardLayout/DashboardLayout.test.tsx`

  Expected: PASS.

### Task 5: Aplicación BI, adaptador mock y dashboard navegable

**Files:**
- Create: `codebase/apps/bi-analytics/src/domain/semantic.ts`
- Create: `codebase/apps/bi-analytics/src/adapters/mockSemanticAdapter.ts`
- Create: `codebase/apps/bi-analytics/src/hooks/useDashboardQuery.ts`
- Create: `codebase/apps/bi-analytics/src/pages/DashboardPage.tsx`
- Create: `codebase/apps/bi-analytics/src/app/App.tsx`
- Create: `codebase/apps/bi-analytics/src/app/routes.tsx`
- Create: `codebase/apps/bi-analytics/src/main.tsx`
- Create: `codebase/apps/bi-analytics/src/styles.css`
- Create: `codebase/apps/bi-analytics/index.html`
- Create: `codebase/apps/bi-analytics/src/adapters/mockSemanticAdapter.test.ts`
- Test: `codebase/apps/bi-analytics/src/pages/DashboardPage.test.tsx`
- Test: `codebase/apps/bi-analytics/src/app/routes.test.tsx`

**Interfaces:**
- `SemanticAdapter` exposes `getDashboard(): Promise<SemanticQueryState<DashboardData>>`.
- `useDashboardQuery(adapter: SemanticAdapter)` returns the query state and a retry action.
- `DashboardPage` consumes `SemanticAdapter` through the hook and renders the Design System without importing mock internals.

- [ ] **Step 1: Write failing adapter, page-state and navigation tests**

  Verify mock success data, state transitions for loading/success/error/empty, retry behavior and the dashboard route rendering its heading and principal components.

- [ ] **Step 2: Run focused tests to verify failure**

  Run: `npm --prefix codebase test -- apps/bi-analytics/src/adapters/mockSemanticAdapter.test.ts apps/bi-analytics/src/pages/DashboardPage.test.tsx apps/bi-analytics/src/app/routes.test.tsx`

  Expected: FAIL because the application modules do not exist.

- [ ] **Step 3: Implement the typed mock adapter and page orchestration**

  Keep `DashboardData` and adapter behavior in the app boundary. Map query state into reusable component props; do not add API access to Design System components. Include controls that can deterministically demonstrate success, empty and error states in development/demo mode.

- [ ] **Step 4: Run application tests and build**

  Run: `npm --prefix codebase test -- apps/bi-analytics/src/adapters/mockSemanticAdapter.test.ts apps/bi-analytics/src/pages/DashboardPage.test.tsx apps/bi-analytics/src/app/routes.test.tsx` and `npm --prefix codebase run build --workspace @bi-analytics/bi-analytics`

  Expected: PASS and a Vite production build is emitted for the application.

### Task 6: Storybook compartido y documentación visual

**Files:**
- Create: `codebase/apps/storybook/.storybook/main.ts`
- Create: `codebase/apps/storybook/.storybook/preview.tsx`
- Create: `codebase/apps/storybook/src/stories/atoms.stories.tsx`
- Create: `codebase/apps/storybook/src/stories/molecules.stories.tsx`
- Create: `codebase/apps/storybook/src/stories/organisms.stories.tsx`
- Create: `codebase/apps/storybook/src/stories/templates.stories.tsx`
- Create: `codebase/apps/storybook/src/stories/dashboard.stories.tsx`
- Create: `codebase/apps/storybook/src/stories/tokens.stories.mdx`
- Modify: `codebase/apps/storybook/package.json`
- Test: `codebase/apps/storybook/src/stories/storybook-contract.test.ts`

**Interfaces:**
- Stories import every public component from `@bi-analytics/design-system`, never from `apps/bi-analytics/src`.
- Story args expose primary usage, responsive variants and relevant states: loading, empty, error, unauthorized and disabled.

- [ ] **Step 1: Write failing Storybook contract test**

  Assert that story modules exist, use the workspace Design System import and include at least one primary story plus required state stories for MetricCard, DataTable and DashboardLayout.

- [ ] **Step 2: Run the contract test to verify failure**

  Run: `npm --prefix codebase test -- apps/storybook/src/stories/storybook-contract.test.ts`

  Expected: FAIL because Storybook configuration and stories do not exist.

- [ ] **Step 3: Implement Storybook configuration and stories**

  Configure Vite/React Storybook, global token/theme decorators and controls. Document token usage, Atomic Design composition, responsive behavior, accessibility expectations and complete dashboard composition.

- [ ] **Step 4: Build Storybook and run the contract test**

  Run: `npm --prefix codebase test -- apps/storybook/src/stories/storybook-contract.test.ts` and `npm --prefix codebase run build-storybook`

  Expected: PASS and a static Storybook build is emitted.

### Task 7: Smoke navigation, quality gates y entrega verificable

**Files:**
- Create: `codebase/tests/smoke/dashboard-navigation.spec.ts`
- Create: `codebase/playwright.config.ts`
- Create: `codebase/README.md`
- Modify: `codebase/package.json`
- Modify: `codebase/apps/bi-analytics/package.json`
- Modify: `codebase/apps/storybook/package.json`

**Interfaces:**
- Produces root commands `npm run test`, `npm run test:accessibility`, `npm run build`, `npm run storybook` and `npm run build-storybook` that work from `codebase/`.
- Smoke test navigates to the dashboard, verifies principal content, exercises a filter and confirms a recoverable error state.

- [ ] **Step 1: Write the failing smoke test**

  Start the Vite app with the test web server and assert dashboard navigation, visible metric/table content, filter interaction and retry/error recovery.

- [ ] **Step 2: Run the smoke test to verify failure**

  Run: `npm --prefix codebase run test:smoke`

  Expected: FAIL because the app and smoke configuration are not yet wired together.

- [ ] **Step 3: Implement the smoke harness, documentation and root quality gates**

  Add Playwright configuration, document install/start/build/test commands and ensure package scripts delegate consistently across workspaces. Keep accessibility checks available for component and smoke suites.

- [ ] **Step 4: Run the complete verification suite**

  Run from `codebase/`:

  ```text
  npm install
  npm run test
  npm run test:accessibility
  npm run test:smoke
  npm run build
  npm run build-storybook
  ```

  Expected: all tests pass, the application and Storybook builds complete, and the README describes the reusable library and its Atomic Design boundaries.

## Self-Review

- **Spec coverage:** Tasks 1–2 cover the monorepo, configuration and tokens/contracts; Tasks 3–4 cover Atomic Design; Task 5 covers the app, adapters, states and dashboard; Task 6 covers Storybook; Task 7 covers testing, navigation and delivery. All acceptance criteria and first-increment scope items map to at least one task.
- **Step scan:** Each task has a failing test, implementation step and verification step; no step leaves component names or public signatures implicit.
- **Type consistency:** `SemanticQueryState<T>` and `MetricCardProps` are defined in Task 2, `SemanticAdapter`/`DashboardData` in Task 5, and all consumers reference those exact boundaries.
- **Review Focus coverage:** API independence is tested in Tasks 2/4/5; states in Tasks 4/5/6; accessibility in Tasks 3/4/7; shared exports in Tasks 1/6/7; mock substitution in Task 5.
- **Proportion:** The plan is limited to the first demonstrable increment and explicitly excludes productive authentication, persistence, OLAP, chart-library selection and external publication.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-15-bi-analytics-frontend-plan.md`. Review the plan before implementation. Because the tasks are sequential and share public TypeScript interfaces, the recommended execution method is **Native** with `superpowers:executing-plans`, followed by a final independent review. Confirm that the plan captures the desired scope and choose the execution method.
