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
- T3: complete — 11 casos RED→GREEN más comprobación de lectura snapshot intercalada (12). Agregado/copia/replay/binding seguro y reinicio.
- T4: complete — 15 casos HTTP RED→GREEN; suite backend completa 146 passed/1 skipped, 49.20 s. Sin concesiones nuevas al analista.
- T5: complete — cliente tipado, hook reutilizado cancelable y selector multipágina; pruebas propias en suite global. Typecheck GREEN.
- T6: implementada — suite frontend global 66 passed, TypeScript y build GREEN; después fix de jerarquía h1 detectado por axe. Navegador nuevo 2 passed (40.1 s), teclado/axe 1440/390 en formularios/copia, segunda KPI intacta, replay y conflicto.
- T7: complete para entrega técnica local — revisión independiente realizada, dos Important corregidos RED→GREEN y suites finales verificadas abajo. Aceptación manual e integración de rama dependen del usuario.

Pruebas UI nuevas detectaron pérdida de espacios al escribir owner y separador de sinónimos: ambas RED→GREEN, sin normalizar destructivamente a cada pulsación. jsdom requiere cleanup explícito (patrón existente) y polyfill nativo dialog sólo en test; Modal real no sustituido. Axe detectó falta de h1, corregida en formularios completos y h2 conservado en diálogo.

Ruling: reutilizar dependencias ya instaladas mediante junctions node_modules y .venv al checkout original — evitar instalación/copia y no cambiar versiones — coste si incorrecto: resolución de librerías del design system puede apuntar al checkout original; no se modifica ese paquete desde el worktree.
Ruling: no trasladar divergencias de Stitch a código (IDs manuales, owner prefijado, edición parcial de protegidos) — API-003/D04/D06 son vinculantes — coste si incorrecto: diferencia visual documentada respecto al mockup.
Stitch: dominio 0a23d5218fb840d89883cd07c9998d6c, componente/copia dc2a2dece93f411abaf8bd7a25bfbfbf generados. Formulario KPI bloqueado por auto-review: límite de uso del servicio. No reintentar ni eludir; se implementa el recorrido funcional ya aprobado, sin afirmar generación visual de KPI.

## Verificación integrada 2026-10-17

- US-003 navegador: 2 passed; segunda KPI intacta tras copia/reasociación, replay, 412, tenant, teclado y axe 1440/390.
- Fuentes PostgreSQL real: 2 passed (30.4 s). Datasets real: 3 passed (45.8 s).
- API analista: 3 passed (30.3 s). Smoke: 7 passed (18.8 s).
- Revisión independiente READ-ONLY solicitada a agente Einstein, rango 6be7993..22d729f. Pendiente de reporte; no declarar aprobada.
- Repetición backend PG opt-in falló por ACL de temp fuera sandbox; en sandbox largo hubo 5 errores de SQLite/WAL y secreto sin permiso. Reproducción aisló PermissionError de pytest-of-ianache, temporal largo cercano a MAX_PATH y lectura de secreto restringida. Repetición en curso fuera sandbox con basetemp nuevo/corto, sin cacheprovider. No se cambian pruebas para esconder errores.
- Repetición frontend concurrente: 65 passed/1 timeout (prueba heredada de Medallion, 5000 ms); primera suite global había dado 66 passed. Repetición con maxWorkers=2/minWorkers=1, sin ampliar timeout ni modificar prueba.
- Temporales generados conservados y excluidos de Git; no se borró ningún dato del usuario.

## Revisión y pasada única de correcciones

Revisor Einstein: 0 Critical, 2 Important, 1 Minor. Reporte y resolución en final-review.md.
Final: fixed I01, edición semántica de vínculo oculto — test_semantic_editor_can_preserve_occluded_binding_but_cannot_remove_it RED (403)→GREEN, test UI omitir binding RED→GREEN; quitar vínculo explícito sin permisos sigue 403.
Final: fixed I02, PUT confirmado seguido de GET fallido — ConfirmedUpdate domain/component/kpi RED→GREEN; se retorna PUT confirmado sin segundo PUT ni GET desde editor; POST/replay conserva lectura actual.
Final: minor (deferred): mostrar sinónimos en detalle de componentes protegidos; no pérdida de datos, disponibles por API.
Final: Ruling: replay POST original se conserva — contrato — coste: cliente debe GET actual.
Final: Ruling: protección permanente se conserva — D06 — coste: cambios requieren copia aun sin consumidores actuales.
Final: Ruling: snapshots históricos se conservan — D06 — coste: advertencias y revisión manual al cambiar datasets.
Final: Ruling: edición anterior al primer lock de referencia es orden serial válido — integridad transaccional — coste: se referencia definición vigente al asociar.
Final: Ruling: publicación/cálculo/certificación/IAM productivo quedan fuera — alcance aprobado — coste: borradores no equivalen a métricas publicadas/calculadas.
Final: Ruling: escala/retención/OIDC navegador productivos no se declaran cubiertos — no hay aprobación de despliegue — coste: hardening previo a producción.
Final: Ruling: no migrar/restaurar bases valiosas del usuario — probar sólo copias y guiar operación — coste: backup y validación antes de rollout real.

Backend PG opt-in con temporal corto y permisos correctos: 147 passed antes de nueva regresión I01. Suite final tras fixes pendiente.
Ruling: ejecutar frontend en esta máquina con 1 worker y testTimeout CLI 15000 — prueba Medallion heredada agotó 5000 ms bajo carga, sin fallar aserciones — coste: una espera rota puede tardar hasta 15 s en fallar; no se cambian aserciones ni archivo de prueba heredado.

## Cierre técnico verificado

- Backend final con BI_TEST_POSTGRES=true, temporal corto/nuevo y sin cacheprovider: **148 passed**, 88.09 s. Una advertencia de deprecación Starlette/httpx preexistente; cero fallos/omisiones.
- Frontend final `npm test -- --reporter=dot --maxWorkers=1 --minWorkers=1 --testTimeout=15000`: **70 passed / 31 files**, 288.92 s. Medallion heredado pasó en 3193 ms. Avisos preexistentes de Vite/localStorage.
- `npm run typecheck` y `npm run build`: exit 0 tras corregir opción de Testing Library del test ConfirmedUpdate; bundle 114 módulos, build 2.22 s.
- Nuevo navegador US-003 tras fixes: **2 passed**, 1.1 min; teclado/axe 1440/390, copia con segundo KPI intacto, replay/tenant/412. Se inspeccionó screenshot real del diálogo de copia.
- Regresiones navegador: fuentes **2**, datasets **3**, API analista **3**, smoke **7**; PostgreSQL laboratorio real sólo lectura. Total navegador **17**.
- Glosario **24 términos/0 errores**; modelo conceptual **4 conceptos/8 relaciones/0 errores/0 avisos**; enlaces API/DM/UX y git diff --check sin errores.
- Minor diferido único: render de sinónimos en ficha protegida. Diseño KPI en Stitch no generado por cuota, pero formulario implementado y verificado funcionalmente.
- Trabajo en feat/us-003-semantic-catalog; no merge/push, no borrado de bases ni servidores del usuario. Guía manual en docs/ux/us-003/README.md. Pendiente elección de integración y aceptación manual, sin certificar producción ni cerrar historia madre completa.

Ruling: no ejecutar scripts Bash de task-start/task-done: sólo está el alias WindowsApps/WSL y no Git Bash — usar ledger/checkpoints y comandos PowerShell equivalentes — coste si incorrecto: briefs no automatizados, plan y spec se leen directamente.
