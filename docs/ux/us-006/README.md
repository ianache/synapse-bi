# US-006 — Propuestas visuales en Google Stitch

Fecha: 2026-10-28. Proyecto Stitch `4378861557064448535`; sistema visual `Crimson Slate Minimal` (`assets/f09737a9c46f4629a3097bc03ec77dc7`). El usuario aprobó los diseños generados y excluyó las variantes móviles de los estados de excepción de este incremento. La aprobación no resuelve las contradicciones de contenido documentadas abajo ni implica implementación o verificación funcional.

| Pantalla | Referencia | HTML / captura |
|---|---|---|
| Dashboard escritorio, filtro activo | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=aca9ae8b293442c98ba8502c15f0850f) | `cdf148d088be412b9b2df0812dd7d73c` / `64bcb0fb4ea84f9caed48d243fa4a6ef` |
| Gestión y compartición escritorio | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=b352ec98de3848b2a4fca12a4f2b1042) | `d52d2842c3f44d5ca9112469dd6e900b` / `2a22867a2b19483da5fd009bf4ffe6a9` |
| Gestión y compartición, variante corregida reportada por Stitch | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=4ef768272bbf47b2a57ec49ec038850d) | `097af4547d4a405ba42dc9714f98141c` / `bec713ee45194af494f283622feba7a8` |
| Dashboard móvil, filtro activo | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=86b5f55b99c2416bb514825d4c5cca68) | `1c3497385b814f6f9e125af412718d1a` / `fdf8b0329b224053925931ca28aa5e7d` |
| Sin datos y fallo parcial | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=3f22538b08c545e885ea839c2b8e2d64) | `b95ada935b5644eeb0effb63813102e5` / `0ee0ca3720eb45219d9016e86285ba6e` |
| Invitado sin KPI autorizados | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=a3709db32a2b4c458c0267c881677afb) | `978ce0acbbc94ebea122af494d71e037` / `15524b4e45364370a8803980bdad10a7` |
| Acceso no disponible | [Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=06e64e8a955649ecb2893dabb4ccd8c3) | `9cc5a8c1de52488dbf8b127323736fbc` / `11e865996a114a33b4c3b4943d2b6798` |

## Revisión y discrepancias pendientes

- Estas pantallas incluyen cifras, nombres, identificadores, empresas y personas generados para la maqueta. No son datos, permisos, definiciones ni linaje verificados; no deben copiarse a la aplicación como datos reales.
- La salida inicial de Stitch para gestión menciona canal inicial Digital y revocación al sincronizar token. En la variante `4ef768272bbf47b2a57ec49ec038850d` se inspeccionaron HTML y captura: muestran «todos los canales» y revocación en la siguiente solicitud o recarga. La captura presenta controles recortados y textos/afirmaciones de gobierno ilustrativos que necesitan corrección.
- Las descripciones generadas incluyen estados y aseveraciones de gobierno, métricas y trazabilidad no acordados. Deben reemplazarse por información real o indicarse como no disponible, y no establecen reglas nuevas.
- Las capturas y HTML originales de los tres estados excepcionales se inspeccionaron: sin datos/fallo parcial contiene Exportar, crecimiento inventado y diagnósticos técnicos; invitado sin KPI incorpora contacto no acordado, rango relativo y filtro Segmento; acceso no disponible afirma revocación inmediata. Se solicitaron correcciones; Stitch las reporta, pero `get_screen` sigue apuntando a los archivos originales, por lo que las correcciones no se consideran verificadas. La interacción y accesibilidad no quedan demostradas por las imágenes.
- Los estados excepcionales se generaron en escritorio. Por decisión del usuario, sus variantes móviles quedan fuera de este incremento. El directorio real de personas sigue por verificar; no copiar textos contradictorios de las maquetas.

Al implementar, consultar captura y HTML exactos de cada pantalla aprobada, conservar el shell y comparar capturas reales desktop/móvil conforme a `AGENTS.md`. Las decisiones funcionales están en RCP-003 §10 y prevalecen sobre contenido contradictorio de la maqueta.
