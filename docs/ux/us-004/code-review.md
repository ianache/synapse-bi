# US-004 — Revisión independiente y correcciones

2026-10-17. Revisor independiente Russell, read-only, rango282457b..4874ec5.
No subdelegó ni modificó archivos. Evaluó plan, especificación, API-004, DM-004 y
los cinco Review Focus. Sin hallazgos críticos; inicialmente no apto para merge.
El revisor reportó38 pruebas backend y probes adicionales de scopes/atomicidad
aprobados; son evidencia del revisor, distinta de las suites finales del autor.

## Hallazgos y verificación por el autor

1. Important: recuperar un412 descartaba la selección local. Corregido: recuperar
   revisión mantiene selección, descarta comparación/consentimiento y exige preview
   nueva. Si el borrador deja de ser el último, permanece de sólo lectura.
2. Important: PUT confirmado se descartaba al navegar y dependía de otroGET.
   Corregido: mostrar payload confirmado sinGET obligatorio; caché efímera de
   navegación, no almacenamiento persistente ni autoridad adicional. Creación y
   clonación también transmiten la respuesta guardada.
3. Minor del revisor, reclasificado Important por el autor: historial materializaba
   todas las capturas antes de paginar. Con8MiB por captura puede agotar memoria.
   Corregido con count y LIMIT/OFFSET dentro de la misma transacción de lectura.

Tres regresiones de workspace fallaron antes de corregir: recuperación inexistente,
detalle inaccesible siGET posterior falla, respuesta incierta sin reconciliación.
Las tres pasaron después. Una PUT incierta se reconcilia con digest/selección
guardados antes de ofrecer otra escritura; no se repite PUT automáticamente.
Regresión SQLite real: página de2 filas materializaba6 capturas; RED6>2, GREEN≤2.
Suite backend final186passed/1PGskip; navegador modelos4passed41.4s;
frontend final93passed/38archivos191.99s, typecheck/build exit0.
Una sola pasada de correcciones, sin segunda revisión delegada.

## Aspectos no juzgados por el revisor y resolución

- Fidelidad Stitch y móvil: revisados por el autor con capturas; diferencias abiertas
  en [verification.md](verification.md). No aceptación visual implícita.
- Dos ajustes visuales posteriores al rango: prueba de navegador RED→GREEN,
  footer móvil sin superposición y confirmación en columna de matriz.
- Publicación/aprobación/certificación/deprecación/retiro: siguen fuera de la entrega.
- SemVer publicado: diferido; Borrador N y semanticVersion=null, sin simular publicación.
- SQL/fórmulas/US-005/Gold: excluidos; no ejecutados ni expuestos por nuevas rutas.
- Roles reales/IAM: gate productivo, sólo personas/scopes de desarrollo existentes.
- Retención/purga/despliegue: gate productivo, no autoriza operación real.
- PostgreSQL/fuentes en vivo: no verificados en navegador; secretos no trasladados.
- Base visual/documental preexistente: preservada aparte en282457b; no atribuida a
  las nuevas funcionalidades ni re-auditada íntegramente.

No menores de código diferidos tras reclasificar/corregir el historial. En ese
checkpoint quedaban pendientes la aceptación visual y las verificaciones de laboratorio.
Actualización de continuación: laboratorio ya ejecutado con autorización expresa;
suite backend187passed, frontend97passed, navegador modelos5/fuentes2/datasets4.
Ajustes de presentación e historial verificados por el autor con RED→GREEN,
capturas desktop/móvil y tipografías locales. No hubo segunda revisión delegada;
el rango de la revisión independiente original sigue siendo282457b..4874ec5.
La aceptación visual/funcional humana permanece pendiente; detalle en verification.md.
No se declara merge autorizado, conformidad visual exacta ni cierre de US-004 madre.
