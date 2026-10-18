# SDD ledger — plan: docs/superpowers/plans/2026-10-18-menubar-mainbar-plan.md

2026-10-18: user approved plan and Native execution. Branch feat/shared-navigation,
isolated worktree .worktrees/shared-navigation, base6a04a1e. Product changes not on master.
No secrets, databases or sibling ledgers copied. No services restarted.

## Pre-flight / todo

- [x] T1 Menubar / contracts / local fonts
- [x] T2 mobile drawer / focus lifecycle
- [x] T3 Mainbar / structured breadcrumbs
- [x] T4 shell / layouts / preserved journeys
- [x] T5 Storybook / component kit
- [x] T6 browser / visual / full verification / independent review

|Producer → consumer|Interface|Finding|
|---|---|---|
|T1→T2|MenubarProps controlled open/close|compatible; drawer mobile only|
|T1→T3|NavigationLink, ShellAction, BreadcrumbItem, fonts|shared types defined once|
|T1/T2/T3→T4|Menubar/Mainbar props and controlled drawer|shell owns state, no route logic in library|
|T1/T3→T5|public entrypoint|stories consume exports, no duplicate HTML|
|T4/T5→T6|operational routes and isolated preview|fixtures only, no user DB|

Ruling: PowerShell/apply_patch ledger equivalents replace Bash task helpers on this
Windows host — preserve briefs, BASE, RED/GREEN and task completion lines here —
cost if wrong: manual bookkeeping; no implementation scope change.
Ruling: npm dependencies installed separately, not whole node_modules junction —
workspace package links in root resolve master, invalid for library changes —
cost if wrong: extra disk/cache install time; no root dependencies changed.
Initial npm ci safety refusal audited: worktree/codebase normal directories,
node_modules absent; retry guarded to abort if any linked ancestor/existing target.
Stitch reconsulted: file IDs match approved HTML14317538571573095280/screenshot7272703772481844155.

Baseline: npm ci offline329packages; frontend97passed/40files288.15s; typecheck exit0.
Task1 BASE6a04a1e, brief read. RED missing ./Menubar import (expected planned absence),
55.57s; no product implementation existed. GREEN implementation now in progress.
Task 1: complete (base6a04a1e; Menubar9 + contracts1 =10passed76.28s; typecheck exit0).
Font files moved inside worktree only; old import is a compatibility shim. UI not integrated yet.
Task2: brief read; drawer focus/lifecycle tests next. No legacy Sidebar/TopBar changes.
Task2 BASE513ac0d: RED4failed/1passed20.62s. Strengthened vacuous cleanup case
to require hidden scroll while open; separate RED StrictMode expected hidden, got clip11.87s.
Ruling: native dialog top-layer for drawer — existing business Modal already uses it;
unit shims cover missing jsdom native methods, browser proves native behavior in T6 —
cost if wrong: browser-specific lifecycle needs adjustment, no backend impact.
Task 2: complete (base513ac0d; Menubar/drawer/contracts15passed90.07s; typecheck exit0).
Task3 brief read; Mainbar contracts match shared types; RED next.
Task3 BASE5734bf1: RED missing ./Mainbar (planned absence)15.24s; implementing single-row header.
Task 3: complete (base5734bf1; Mainbar5/contracts1=6passed16.18s; typecheck exit0).
Task4 brief read; application workspace package junction verified points into this
worktree, not master. No application code changed before shell regression tests.
Task4 BASE5cdff39: RED10failed/4passed47.70s (shell/layout absent); extra legacy
DashboardPage navigation RED1failed27.09s before adapting it.
Ruling: /dashboard uses application SynapseShell, generic DashboardLayout remains
backward-compatible and composes organisms — existing demo supplied only Overview,
so generic config alone cannot provide suite navigation — cost if wrong: one
layout wrapper change, existing query/filter behavior covered by its unchanged tests.
Ruling: legacy bar classes retained unused instead of broad CSS deletion —
new prefixed classes isolate bars and shared layout overrides only root grid/focus —
cost if wrong: dead CSS retained; inverse-order browser checks in T6 detect leakage.
Integration first GREEN attempt19passed/1failed: ModelsChrome explicit active=models
with default rootURL lost active marker. Root cause getShellNavigation unconditionally
overrode active with home for '/'; previous shell only did so for explore. Restricted
root exception to explore in nav and breadcrumb. Existing failing regression retained.
Modified-click tests now observe defaultPrevented after React then stop native jsdom
navigation at document bubble; preserves the contract without jsdom's unsupported
page navigation timer. No production workaround for a test-only browser limitation.
Task 4: complete (base5cdff39; pages/templates/shell/Menubar92passed26files450.42s,
typecheck exit0; extra application build140modules12.83s exit0 with4WOFF2).
Task5 brief read; existing Storybook staticDirs already serves app/public licenses.
Task5 BASEd465645: RED2failed suites11.15s, missing stories/NavigationPreview as planned.
Stories exercise public organism exports; shared demo fixtures stay in the existing
library showcase module, not in application/domain code. No extra public component API.
Task 5: complete (based465645; preview/story contracts3passed2files22.99s;
typecheck exit0; build-storybook exit0,165modules,4WOFF2 and license in distribution).
Task6 brief read; isolated Vite5197, fixture-only API interception, no backend or DB.
Task6 BASE7aa88cc: initial acceptance2passed/3failed3.3m. One test label typo
Explorar KPIs corrected to real Explorar KPI. Browser exposed text200% neutral-profile
word overflow and legacy Google Fonts import. Fixed overflow-wrap and local font
import; original public font names alias the same4WOFF2 (no binary duplication).
Dashboard principal heading regression RED1failed/2passed29.39s; h2 changed to h1.
Second acceptance5passed4.1m, including axe desktop/mobile/drawer with0violations,
native focus/scroll/breakpoint/business modal and no unexpected API/external requests.
Ruling: route matrix test budget240s instead120s — one test deliberately traverses
23 direct/SPA entries on this slow Windows host; no assertions removed — cost if
wrong: slower timeout diagnosis, no production behavior change.
Task6 expanded acceptance6passed4.5m; fixture/config/spec explicit TypeScript check
exit0; app/typecheck/Storybook builds exit0,4WOFF2 and OFL confirmed in both outputs.
Dashboard h1 regression GREEN3passed in the complete frontend run (still progressing).
Ruling: retain this plan ledger/worktree/evidence after delivery — explicit plan
prohibits automatic cleanup, overriding generic execution-skill cleanup — cost if
wrong: retained disk usage; no user files are removed.
Task 6: complete (base7aa88cc; full frontend130passed45files941.07s exit0;
browser6passed4.5m; app/types/Storybook and test-specific tsc exit0; diffcheck exit0).
Independent whole-branch review gate follows; no merge or completion handoff yet.
Final review: independent fresh-context reviewer, base6a04a1e..a9f2ce9, read-only.
No critical findings. Important: DashboardLayout relative/fragment callbacks lost.
Regraded sticky-header skip-target obstruction from Minor to Important: keyboard
navigation must reveal its destination, including enlarged header; fix in same pass.
Final: minor (deferred): extra blank EOF lines in navigation config/fixtures/spec;
working-tree diffcheck passed but committed-range diffcheck reports these3lines.
Final: Ruling: exact visual equivalence not certified by reviewer (reference download
failed there) — executor compared the exact reference assets and route captures,
report retains visual/pixel-perfect limitation — cost if wrong: residual visual differences.
Final: Ruling: reviewer did not repeat all runtime suites — executor owns fresh
full/browser/build gates — cost if wrong: those gates have no independent rerun.
Final: Ruling: Safari/Firefox/manual screen reader remain unverified — report limits
evidence to Chrome Windows and axe — cost if wrong: browser/assistive-specific issues.
Final: Ruling: backend/auth persistence/DB not reviewed — no backend changes and
fixture-only navigation accepted scope — cost if wrong: no new backend integration assurance.
Final fix pass: relative callbacks RED5failed/5passed37.68s; skip-link clearance
RED1failed47.4s. Minimal classification and measured scroll-margin fixes applied.
Final full regression uses threads with one worker (same45files/test isolation),
avoiding repeated cold fork startup; prior complete fork run130/130 remains recorded.
Final: fixed relative/fragment callback compatibility — DashboardLayout10cases,
5RED failures to GREEN; complete suite138/138 in45files680.28s exit0.
Final: fixed obscured skip destination — browser skip_link_clearance_tracks_growing_header
RED1failed to GREEN; full browser7/7 in4.4min including enlarged header exit0.
Final gates: app/typecheck/Storybook and explicit browser-fixture tsc exit0 after fixes.
Independent review complete, one fix pass complete, no critical/important left;
one cosmetic minor deferred as above. No second review, merge, push or cleanup.
Delivery commitaf5843c; final working tree clean. Committed-range whitespace check
exit2 confirms exactly the3documented EOF lines (reviewer had reported exit1).
