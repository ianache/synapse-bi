# SDD ledger — plan: docs/superpowers/plans/2026-10-18-menubar-mainbar-plan.md

2026-10-18: user approved plan and Native execution. Branch feat/shared-navigation,
isolated worktree .worktrees/shared-navigation, base6a04a1e. Product changes not on master.
No secrets, databases or sibling ledgers copied. No services restarted.

## Pre-flight / todo

- [x] T1 Menubar / contracts / local fonts
- [ ] T2 mobile drawer / focus lifecycle
- [ ] T3 Mainbar / structured breadcrumbs
- [ ] T4 shell / layouts / preserved journeys
- [ ] T5 Storybook / component kit
- [ ] T6 browser / visual / full verification / independent review

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
