# Biblioteca Atomic Design

La referencia normativa de estilo es [intents/DESIGN.md](../../../intents/DESIGN.md). La composición del catálogo reproduce la biblioteca atómica del [proyecto de Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=5bc81890512745cfa93a1fcadf2bd4a0), revisada el 16 de octubre de 2026.

## Revisar el catálogo

- Storybook: `Stitch / Biblioteca Atómica / Completo` (`stitch-component-kit--completo`).
- Aplicación: `/componentes`. El dashboard existente se mantiene en `/`.
- Export público: `ComponentKitShowcase` desde `@bi-analytics/design-system`.

El paquete importa sus estilos compartidos. El consumidor debe importar también `@bi-analytics/tokens/tokens.css`. Las composiciones usan `.bi-root` para aplicar la tipografía. Las fuentes Hanken Grotesk y Plus Jakarta Sans se cargan desde Google Fonts, con Arial como fallback si no hay conexión.

## Correspondencia visual

| Sección de Stitch | Componentes reutilizables |
| --- | --- |
| Botones e inputs | Button, Input, Icon |
| Interruptores y selección | Switch, Checkbox (incluido indeterminate), Radio |
| Badges y avatares | Badge con tonos semánticos, Avatar |
| Búsqueda, KPIs y filas | ActionSearch, KpiCard, ListItem |
| Tabla avanzada | AdvancedDataTable con renderizadores de columna |
| Perfil y navegación móvil | ProfileCard, BottomNav |
| Biblioteca completa | ComponentKitShowcase |

`DESIGN.md` presenta una paleta de roles en el frontmatter y colores específicos de controles en el cuerpo. El catálogo usa las indicaciones de controles y la referencia visual para primary #991b1b y secondary sólido #374151 de Stitch. No se afirma equivalencia de píxel exacta.

La tabla pagina y ordena datos locales, busca, selecciona filas y exporta CSV. Con `onPageChange`, consume páginas remotas y `total` del proveedor. Los datos del catálogo son demostrativos (8 registros); la creación sólo afecta su estado en memoria. La ficha de detalle usa un diálogo nativo con Escape y gestión de foco.

## Verificación

`npm test`, `npm run typecheck`, `npm run build`, `npm run build-storybook` desde `codebase`. No ejecutar un build mientras un servidor antiguo de Storybook observa su carpeta de salida. La configuración actual excluye `storybook-static` y `dist` del watcher.
