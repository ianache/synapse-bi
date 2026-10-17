# SDD ledger — plan: docs/superpowers/plans/2026-10-16-us-003-semantic-catalog-plan.md

Workspace: .worktrees/us-003-semantic-catalog; branch feat/us-003-semantic-catalog.
Base: 6be7993. Método nativo, revisión independiente final.

## Autoridad y preflight

- Usuario «continuar con la implementacion»: habilita ejecución local de los contratos/API-003, DM-003 y recorrido T1 presentados; no aprobación corporativa ni de US-004/005.
- Usuario eligió explícitamente worktree aislado. Master conserva documentos y cambios previos; sólo commit de .gitignore para excluir worktrees.
- Baseline checkout original: backend 83 passed/1 skipped (PG opt-in), frontend 50 passed fuera del sandbox. Vitest dentro del sandbox falla por lectura de ancestros; no fallo funcional.
- T0→T1: decisiones D01–D06 recibidas; formalización de solicitud actual en D07.
- T1→T2/T4: usar DTO/límites API-003; esquema v4 DM-003. Completar pantallas adicionales antes de UI, no declarar catálogo como formularios completos.
- T2→T3: Database.connect usa BEGIN IMMEDIATE en write; repositorio recibe conexión de servicio.
- T3→T4/T5: rutas separadas domains/components/kpi-definitions, ETag técnico y replay original.
- T5→T6: ningún dato físico visible sin scopes datasets/sources, incluyendo binding.column y no sólo snapshot.
- T6→T7: no publicar/calcular ni alterar fixtures previos.

Ruling: al ocultar snapshot por permisos, ocultar también binding (contiene columna física) — cerrar exposición implícita del DTO de API-003 — coste si incorrecto: cliente debe solicitar permisos para mostrar origen.
Ruling: pruebas heredadas de initialize que esperan MAX(version)=3 se actualizan a 4 manteniendo aserciones de datos y rollback — migración aditiva deliberada — coste si incorrecto: proteger con pruebas propias v3→v4 y foreign_key_check.

## Tareas

- T0: conformidad local registrada, sin owner nominal inventado.
- T1: contratos recibidos para ejecución local; completar visuales y comprobación documental.
- T2: complete — 36 pruebas nuevas RED→GREEN; suite backend 119 passed/1 skipped, 29.21 s. DTO estrictos, completitud y migración v4 aditiva; test legado de max version actualizado a 4, datos intactos.
- T3: en curso — 11 casos RED por servicio aún ausente; implementación siguiente.
- T4–T7: no iniciadas.

Ruling: no ejecutar scripts Bash de task-start/task-done: sólo está el alias WindowsApps/WSL y no Git Bash — usar ledger/checkpoints y comandos PowerShell equivalentes — coste si incorrecto: briefs no automatizados, plan y spec se leen directamente.
