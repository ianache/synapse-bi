# Registro de datasets — Conformidad visual de ambos pasos

## Referencias y confirmación (2026-10-17)

- [Paso 1 — Seleccionar origen](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=ef64675d43b048c0a7ffd9d08a218fd7).
- [Paso 2 — Metadatos](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=7e6873489b214335aa81c7be53720410).

El usuario confirmó reproducir la composición conservando dos pasos,
clasificación libre declarada e identificadores del sistema. No se copia el
encabezado contradictorio «paso 2 de 4», un slug sugerido ni una taxonomía nueva.
Se consultaron las capturas y el HTML de ambas pantallas; aplica el mandato de AGENTS.md.

## Cambios de presentación

- Paso 1: tarjetas de tipo con radios accesibles, selección de fuente/observación/
  esquema, tabla de objetos físicos, búsqueda y tabla de columnas con tipos,
  nullability y restricciones PK/FK/UNIQUE/CHECK tomadas del snapshot.
- Selección individual y total de columnas. El límite existente de API de 500
  se refleja en la UI; para más de 500 no se activa «seleccionar todas» ni se
  truncan columnas silenciosamente. El cambio de origen sigue limpiando selección.
- Paso 2: identificación, gobierno, frescura y linaje en tarjetas separadas;
  preparación y Medallion siguen siendo declaraciones explícitas.
- Resumen técnico lateral en ambos pasos y acciones inferiores. En móvil la
  composición se apila y las tablas se desplazan en sus regiones, no el documento.
- Pasos marcados con aria-current; los números de sección decorativos no alteran
  los nombres accesibles de los encabezados. Se corrigió el contraste del panel azul.

## Contratos y límites preservados

No se cambian endpoints ni esquema de persistencia. Se conservan los manejadores
de guardado/recarga: idempotencia, normalización, bloqueo durante envío y recarga,
If-Match, conservación de cambios locales y descarte de respuestas tras desmontar.
El tipo y origen de un registro existente permanecen inmutables.

Sin lecturas de filas, introspecciones nuevas, ejecución de procesos ni inferencias
de grano. La fecha de observación no se presenta como última carga. Los nombres,
recuentos y flags son datos reales autorizados, no ejemplos insertados por Stitch.
No se inventa validación empresarial, SLA, certificación ni aprobación de taxonomías.
El backend y sus permisos no se modifican.

## Evidencia

La nueva prueba de `DatasetForm.test.tsx` falló antes del cambio por ausencia de
la tabla de objetos. Comprueba selección, flags, contexto, identificador no editable
y paso de metadatos; las pruebas previas conservan borrador, preparados/Medallion,
reintentos y conflictos. Se adaptó la interacción de tipo de select a radio, sin
retirar comprobaciones de inmutabilidad o guardado.

El E2E comprueba geometría de tabla/resumen, ambas etapas, axe y overflow a
1440/390 px, creación, contexto nuevo, edición y conflicto. Capturas generadas en
`codebase/test-results/dataset-screens/01-origin.png`, `02-metadata.png` y sus
variantes `-mobile.png`; copias locales preservadas en el ledger US-002.

Verificación del rediseño: frontend 78 pruebas / 32 archivos, navegador datasets
4 recorridos, typecheck y build aprobados. Revisión independiente sin hallazgos
Critical/Important. Un Minor sobre el pie de edición se corrigió con texto neutral
«Cambios pendientes de guardar», cubierto por una regresión RED→GREEN; las once
pruebas del formulario se repitieron tras ese ajuste de texto. Las capturas
preservadas preceden únicamente a este último ajuste del pie.

Resultados finales en el ledger. Las capturas se comparan con Stitch; pruebas
aprobadas no sustituyen aceptación visual humana ni prueban igualdad píxel a píxel.
