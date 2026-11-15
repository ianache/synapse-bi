# US-007 · Diseños Google Stitch

Proyecto existente: [BI Dashboard with AI — Google Stitch](https://stitch.withgoogle.com/projects/4378861557064448535).

Se conservaron el Design System del proyecto (Crimson Slate Minimal) y los shells desktop/mobile de Synapse BI. El usuario aprobó estas diez pantallas el 2026-11-02. Los valores dinámicos deben venir de API; los estados vacíos no se rellenan con datos sintéticos.

## Desktop

| Flujo | Pantalla Stitch |
|---|---|
| Configurar pipeline | [US-007 · Pipelines CDC de ventas · Configuración](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=0d678b67673f446ebc256b7c4d90b5f6) |
| Historial de ejecuciones | [US-007 · Historial de ejecuciones CDC](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=769573828083452d8d11222db8f0b462) |
| Detalle de versión y linaje | [US-007 · Versión preparada · Linaje e historial](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=e95fb3696df54efd9926005ec9274db6) |
| Rechazo por calidad | [US-007 · Ejecución rechazada por calidad](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=eda8497de17940d5891c74b5edae3307) |
| Fallo técnico | [US-007 · Fallo técnico de ejecución CDC](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=5ac96cdc5cbc4520bf2ba2a1e7e5f260) |

## Mobile

| Flujo | Pantalla Stitch |
|---|---|
| Configurar pipeline | [US-007 · Configuración CDC (Móvil)](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=a4063dca30ca42788a99e1af8fd48861) |
| Historial de ejecuciones | [US-007 · Historial CDC (Móvil)](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=ccbf79bf5ae54c9ebafef71da601c20a) |
| Detalle de versión y linaje | [US-007 · Linaje e historial (Móvil)](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=19fe8cbeaee34d0f95d1fe3f3761d79d) |
| Rechazo por calidad | [US-007 · Lote rechazado por calidad (Móvil)](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=4fe799e816384dafafd64b15d11ebbe4) |
| Fallo técnico | [US-007 · Fallo técnico CDC (Móvil)](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=6b35820a538947a78158b44372a72fbb) |

## Aprobación y alcance

- Aprobación de diseño: confirmada por el usuario el 2026-11-02.
- Se implementará en la aplicación existente y dentro de su shell Synapse BI.
- Al implementar, cotejar HTML y capturas desktop/mobile contra estas referencias según `AGENTS.md`; la aprobación del diseño no demuestra conformidad de la implementación.
- Decisión complementaria aprobada por el usuario el 2026-11-02: el reintento de un lote manual incluye un editor JSON en el detalle para volver a enviar los eventos corregidos.

## Implementación y validación

- [Casos de prueba manuales](casos-prueba-manual.md): configuración, CDC, calidad, polling, reintentos, aislamiento, permisos y verificación visual desktop/móvil.
- [Guía de validación del backend](backend-manual-validation.md).
- [Revisión de implementación y evidencia visual](implementation-review.md).
