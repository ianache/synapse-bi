# US-006 — Plan de implementación del dashboard interactivo

**Objetivo:** completar el dashboard con KPI autorizados, filtro cruzado fecha/canal y compartición individual para lectura.

**Fuentes:** `knowledge-base/requirements/context-packs/RCP-003-us-006-dashboard-semantico.md`, `knowledge-base/requirements/user-stories/US-006-componer-dashboard-semantico.md`, `docs/ux/us-006/README.md`, `docs/ux/us-006/implementation-conflicts.md`. El usuario autorizó corregir los textos y controles contradictorios manteniendo la composición Stitch.

**Base técnica:** `master` en `1883e7e`; worktree `.worktrees/us-006-interactive-dashboard`. El piloto Gold reside en otra rama y su integración no está incluida automáticamente. No extrapolar datos sintéticos a producción.

## Puertas de decisión y compatibilidad

- Decisión del usuario: dashboards legados `shared=1` pasan a privados; el propietario vuelve a compartirlos con personas concretas. Conservar dashboard y widgets, registrar el cambio de acceso y probar que invitados anteriores ya no acceden tras la migración.
- Usuario eligió directorio sintético de laboratorio, limitado a identidades de desarrollo existentes y al tenant autenticado; producción debe fallar cerrado sin fuente real autorizada.
- El usuario aceptó para este laboratorio los permisos existentes del catálogo por tenant y scope. La autorización individual por KPI queda para una entrega posterior y sigue siendo puerta para producción; no debe afirmarse implementada.
- Preservar decisiones de US-005: consulta Gold piloto separada, con pruebas reales pendientes y errores sin fallback.

## Tareas dependientes

1. **Contrato y seguridad.** Definir endpoints y DTO de período inicial, destinatarios y revocación, matriz de autorización y filtros de KPI, política de migración y validaciones. Revisar la compatibilidad de la API actual, versiones/ETag, datos existentes y aislamiento por tenant.
2. **Persistencia y acceso.** Pruebas de migración y rollback con base aislada; propietario, invitado explícito, otro tenant, revocación a la siguiente solicitud y ocultamiento individual de KPI. Implementar cambios aditivos y auditar mutaciones sin exponer datos.
3. **Filtros y consultas.** Persistir rango inicial válido; canal único sincronizado entre control y gráfico, sustitución de selección, limpieza que restaura rango inicial y todos los canales, conservar canal al cambiar fecha; pruebas de fechas inválidas y período sin datos.
4. **Pantallas Stitch aprobadas.** Consultar captura y HTML exactos del dashboard y gestión; respetar excepciones autorizadas de `implementation-conflicts.md`. Implementar tarjetas, barras, filtro visible reversible, estado incompatible, error aislado y reintento, invitado sin KPI y acceso genérico no disponible. Solo datos y estados reales; ningún control no implementado se presenta como activo.
5. **Pruebas integradas y revisión.** Backend completo, frontend, tipos/build, pruebas de navegador con roles y tenant, persistencia y revocación, y comparación visual desktop contra cada referencia Stitch. Documentar diferencias y límites. Variantes móviles de estados de excepción fuera del incremento por decisión humana; mantener accesibilidad y responsive del resto.

Identidad y autorización requieren contrato verificable; si no hay fuente autorizada, declarar la limitación en vez de simular acceso productivo.

## Avance de migración en worktree

- Implementada migración SQLite v6 en el worktree: dashboards previamente compartidos pasan a privados, conservando contenido, y se registra cuáles cambiaron. Inicialización repetida y rollback probado; los dashboards de demostración nuevos también empiezan privados.
- Verificación local: suite backend `200 passed, 1 skipped`; `git diff --check` sin errores. No se migró una base del usuario ni se integraron cambios a master.
- Esta nota refleja únicamente el avance de migración anterior. En la entrega de laboratorio posterior se implementaron la lista de destinatarios sintéticos, revocación, período, API y UX, con evidencia en `docs/ux/us-006/verification.md`. La autorización individual por KPI y la fuente real de usuarios quedan para el siguiente incremento.
