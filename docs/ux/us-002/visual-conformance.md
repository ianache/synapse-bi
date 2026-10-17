# US-002 — Conformidad visual del catálogo de datasets

## Referencia y decisión (2026-10-17)

El usuario indicó que `/datasets` no reproducía el diseño y confirmó «aplicar»
la corrección propuesta, conservando separados registro (borrador/registrado)
y completitud (completo/incompleto).

Referencia obligatoria: [Datasets · Catálogo — Google Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=725195c5c57a461d8db992a49f6afc5d).
Se consultaron captura y HTML originales. El [mandato del repositorio](../../../AGENTS.md)
incluye esta ruta; la aceptación funcional previa no sustituye la visual.

## Implementación

- Encabezado, aviso normativo, tres tarjetas de resumen, barra de filtros y tabla.
- Resumen global de la organización: total, directos y preparados consultados por
  la API con `limit=1`; no se cuentan las filas de la página ni se copian cifras de Stitch.
- Columnas de dataset/objeto físico, tipo, responsable, clasificación, metadatos
  y «Ver ficha», enlazada a la ficha existente.
- Responsable/clasificación se obtienen mediante GET de cada dataset visible
  (máximo 20 filas por página), sin extender DTOs, permisos ni endpoints.
  Se distinguen carga, ausencia declarada y error; las consultas se cancelan al
  cambiar de página/filtros o desmontar. No hay transformaciones ni escrituras nuevas.
- Filtros de nombre, tipo, completitud y registro y paginación siguen en servidor.
  Mantener dos filtros de estado es una adaptación expresamente aceptada.
- Navegación agrupada por administración de datos; estilos acotados a datasets
  para no reemplazar el diseño propio del catálogo semántico.

## Límites explícitos

- Las filas, nombres y cifras de laboratorio del mockup no se insertan en la base
  manual. Un catálogo vacío muestra cero únicamente cuando lo confirma la API.
- Los metadatos son declarados, no aprobados. No se afirma unicidad 1:1 entre
  dataset y objeto físico ni certificación del esquema.
- Exportar y Nueva consulta están identificados como no disponibles; no se
  simulan exportaciones, notificaciones ni funciones empresariales inexistentes.
- Iconografía SVG del sistema existente. En móvil las tarjetas se apilan y la
  tabla se desplaza dentro de su región; no debe desbordarse el documento.
- No se cambia el formulario/ficha ni el backend. No se declara equivalencia
  píxel a píxel ni aprobación visual por parte del agente.

## Evidencia

Pruebas de catálogo en `DatasetList.test.tsx`; las dos pruebas nuevas fallaron
primero por falta de resumen y de lectura de metadatos, antes del código nuevo.
El recorrido de navegador comprueba contadores contra API, gobierno declarado,
filtros separados, navegación a ficha, axe y anchuras 1440/390 px.

Capturas generadas en `codebase/test-results/dataset-screens/06-stitch-catalog.png`
y `06-stitch-catalog-mobile.png`. Proceden de la base E2E, no de insertar ejemplos
en la base del usuario. Resultados finales y copia de evidencia en el ledger US-002.

La revisión de capturas complementa las pruebas funcionales. La aceptación visual
humana sigue pendiente hasta que el usuario inspeccione la aplicación.

Verificación final: **77 pruebas frontend**, **4 navegador datasets** y **3 de
regresión del catálogo semántico** aprobadas; tipos y compilación correctos.
Capturas inspeccionadas y preservadas en el ledger US-002, carpeta `screens/`,
prefijo `0ba25bcb`. Revisión independiente sin hallazgos bloqueantes. Cambios locales,
sin commit ni publicación y sin modificaciones del backend.
