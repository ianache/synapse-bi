# US-003 — Corrección de conformidad visual

## Referencia y mandato

Decisión SEM-US003-D08 (2026-10-17): el usuario requiere apego fiel al diseño de
Google Stitch al implementar. El mandato permanente está en [AGENTS.md](../../../AGENTS.md).

Pantalla exacta: [Catálogo semántico configurable](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=52fd5fb8a6254ff4bf1165579309bc9e).
Se consultaron su HTML y captura originales, no solo una descripción del generador.

## Cambios de esta corrección

- Encabezado, aviso de gobernanza, barra de dominio/responsable y recuentos reales.
- Pestañas Dimensiones, Medidas y KPI; búsqueda y filtrado en servidor.
- Composición desktop tabla/ficha lateral; selección sin abandonar el listado.
- Tabla con dominio, documentación, origen físico visible, consumidores y acción.
- Ficha con protección, metadatos, origen histórico, consumidores y copia explícita.
- Navegación, densidad, colores, tipografía y tarjetas ajustados a la referencia.
- Creación contextual: tipo y dominio viajan al formulario; se validan contra las
  opciones autorizadas. Un parámetro de URL nunca modifica un registro existente.
- Responsive sin desbordamiento del documento; tabla desplazable en móvil, ficha
  debajo; pestañas con flechas/Home/End y permisos existentes conservados.

## Diferencias de datos y alcance que no deben falsificarse

- Los ejemplos, IDs, owners y cifras de Stitch no son datos reales del usuario.
  Se muestran registros autorizados, faltantes y contadores de la API.
- El ejemplo de dominio vacío solo se muestra cuando el resultado está vacío,
  no simultáneamente como si existieran dos dominios activos.
- Sin vínculo visible no se inventan dataset, columna, tipo lógico ni advertencia
  de desactualización. La protección sigue afectando todos los campos, según D04.
- Nueva consulta se identifica como no disponible; no se simulan notificaciones,
  ayuda/configuración ni consultas SQL que el producto aún no implementa.
- Los iconos usan el sistema SVG existente, no una dependencia de Material Symbols.
  Los detalles visuales compartidos fuera de esta ruta y las demás pantallas Stitch
  no forman parte de esta corrección. La conformidad visual final requiere revisión
  del usuario; no se declara equivalencia píxel a píxel.

## Evidencia y verificación

Pruebas de regresión: `CatalogList.test.tsx`, `CreationContext.test.tsx` y
`tests/semantic-catalog-integration/catalog.spec.ts`. Las pruebas nuevas fallaron
antes de implementar las correcciones (pestañas/barra ausentes, consulta de
consumidores sobre un KPI, pérdida de tipo/dominio) y se repiten con el producto.

El recorrido de navegador genera `codebase/test-results/semantic-screens/05-stitch-catalog.png`
y `05-stitch-catalog-mobile.png` a 1440 y 390 px. Incluye geometría de columnas,
ausencia de overflow del documento, axe, teclado y creación contextual. Son
capturas de registros sintéticos creados únicamente en la base E2E aislada.

Estas comprobaciones complementan, no sustituyen, la comparación visual de las
capturas con la referencia y la aceptación humana. Resultados finales en el ledger
de US-003; no reutilizar la aceptación funcional anterior como aceptación visual.
