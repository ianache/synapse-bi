# US-003 — Revisión independiente y resolución

Revisor independiente: agente Einstein (01a14867-4922-73e1-bd72-9ec12cd1834c),
contexto fresco, READ-ONLY, sin subagentes. Rango 6be7993..22d729f.
No encontró Critical. Dictamen original: no fusionar hasta corregir dos Important.
Los cambios de resolución no recibieron una segunda revisión; se verifican mediante
pruebas RED→GREEN y suites, tal como prescribe la ejecución nativa elegida.

## Important 1 — Binding oculto bloqueaba edición semántica

Reproducción independiente y test propio confirmaron 403 al renombrar componente
no protegido, con semantic:read/write pero sin permisos físicos. GET enmascara
binding=null; enviarlo por PUT era una solicitud involuntaria de quitarlo.

Resolución: binding omitido en PUT conserva el vínculo, null explícito lo quita
sólo con permisos de metadata. Formulario omite campo/control cuando está oculto.
Contrato API-003 documenta excepción; no se revela snapshot ni columna.
Test backend `test_semantic_editor_can_preserve_occluded_binding_but_cannot_remove_it`
RED→GREEN, y test UI de omisión RED→GREEN. Sigue rechazándose quitar binding sin permisos.

## Important 2 — Refresh fallido después de PUT confirmado

Reproducción: PUT confirma v2, GET posterior falla; reintentar PUT con If-Match v1
generaba 412 artificial. Afectaba dominio, componente y KPI.

Resolución: PUT utiliza respuesta confirmada y navega a ficha, cuya lectura se
reintenta independientemente; no se repite mutación confirmada. POST/copia conservan
GET posterior para resolver replay histórico. Tres casos ConfirmedUpdate (dominio,
componente y KPI) RED→GREEN; update una vez, GET no invocado por editor de PUT.

## Minor diferido

Detalle de componentes protegidos no muestra sinónimos guardados: datos conservados
y disponibles por API, falta render específico en ficha. No corregido en esta pasada
para mantener el alcance de resolución de Important; documentado para priorización.

## Consideraciones que el revisor dejó fuera y decisión del ejecutor

1. Replay POST original con versión antigua: mantener, exigido por contrato; coste: GET actual necesario.
2. Protección tras retirar último consumidor: mantener, D06; coste: cambios exigen copia.
3. Binding/copias con snapshots históricos: mantener, D06; coste: advertencias/revisión manual ante cambios.
4. Edición que obtiene lock antes de primera referencia: aceptar orden serial válido; coste: definición referenciada es la confirmada al asociar, no una lectura anterior.
5. Publicación/cálculo/certificación/IAM productivo: fuera del incremento acordado; coste: borradores no consumibles como KPI calculados/publicados.
6. Escala/retención/OIDC navegador productivos: no declarar cubiertos; coste: hardening antes de producción.
7. Migración/restore de bases valiosas no ejecutados: mantener sólo pruebas sobre copias; coste: backup y verificación operativa antes de aplicarlo a datos valiosos.

Estado de cierre técnico: dos Important corregidos con pruebas RED→GREEN, backend
148 passed con PostgreSQL, frontend 70 passed, tipos/build y E2E US-003 2 passed;
regresiones navegador previas 15 passed. Comandos/duración en progress.md. Revisión no
equivale a aprobación humana empresarial ni a merge/push autorizados.
