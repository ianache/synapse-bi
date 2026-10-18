# US-004 — Verificación de la primera entrega

Fecha: 2026-10-17. Rama `feat/us-004-model-versions`, worktree
`.worktrees/us-004-model-versions`. Plan y API-004/DM-004 aprobados por el usuario
en esta sesión. No implica aceptación visual ni cierre de la historia madre.

## Integración local autorizada

El usuario eligió la opción 1: fusionar localmente con `master`. Se integró por
avance rápido hasta `88bcad2`, sin conflictos, push ni reinicio de servicios.
Los 41 archivos de base coincidían con `282457b`; se incorporaron primero mediante
ese commit existente, sin crear un commit con cambios ajenos. Los nueve archivos
restantes conservaron su contenido, comprobado con hashes antes/después; los
ledgers de US-002/US-003 y los artefactos sin seguimiento siguen sin confirmar.

Verificación nueva desde el directorio principal sobre `master` integrado:

- Backend completo con laboratorio PostgreSQL: **187 aprobadas**, ninguna omitida
  (122.18s); credencial leída desde el archivo original autorizado, sin mostrarla
  ni copiarla. Bases SQLite temporales separadas de la base manual.
- Frontend completo: **97 aprobadas / 40 archivos** (361.74s).
- Typecheck y build: exit0; compilación de 132 módulos (6.11s).
- Navegador US-004: **5 aprobadas** (1.8m), servidores temporales API8015/UI5196
  y SQLite nueva; servidores de prueba detenidos al finalizar.
- `git diff --check`: sin errores. API8006 y UI5186 respondieron HTTP200.

Se conservan rama, worktree, junctions y evidencia visual original. No se reinició
la aplicación principal ni se solicitó migrar su base manual como parte de esta
fusión. La integración no equivale a aceptación visual/funcional humana.

## Evidencia ejecutada

- Backend: suite completa **187passed, ninguna omitida** con PostgreSQL habilitado
  (148.44s). Credencial de laboratorio usada desde su archivo original tras autorización
  explícita del usuario; archivo no copiado ni contenido mostrado.
- Frontend: suite final **97passed/40archivos** (284.77s), incluido historial
  RED→GREEN. Typecheck y build finales exit0; git diff --check sin errores.
  Distribución de cuatro WOFF2 y licencia OFL en `dist/licenses/` comprobada.
- Modelos: cinco pruebas Playwright en verde (1.9m), API8010/UI5190, SQLite única.
  Respuesta perdida/reintento crea un solo modelo; cambios del catálogo no alteran
  capturas; clonación, cancelación, confirmación e historial; 409/412 y recuperación;
  tenant ajeno404; falta de scopes bloquea lectura; consumidores KPI existentes intactos.
- Catálogo: regresión previa tres pruebas en verde (40.5s), API8011/UI5191.
- API/consumidores: regresión previa tres pruebas en verde (25.2s), API8012/UI5192.
- Smoke: regresión previa siete pruebas en verde (27.1s), fixtures/UI5193. El servidor existente4173
  no se reutilizó ni detuvo. API8006/UI5186 y PostgreSQL del usuario intactos.
- Fuentes: dos pruebas de navegador aprobadas (1.0m), API8013/UI5194.
- Datasets: cuatro pruebas de navegador aprobadas (2.9m), API8014/UI5195.
  SQLite con nombre UUID en ambas suites, sin reutilizar servidores. PostgreSQL
  local sólo se observa con el lector de laboratorio; no se modifican tablas Gold.

Comandos en `codebase`: `npm run test:semantic-models`,
`npm run test:semantic-catalog` (BI_SEMANTIC_API_PORT8011/UI_PORT5191),
`npx playwright test --config playwright.api.config.ts` (BI_API_TEST_API_PORT8012/
UI_PORT5192, CI=true), `npx playwright test --config playwright.us004-smoke.config.ts`.
Chrome local mediante PLAYWRIGHT_EXECUTABLE_PATH; no navegador instalado por esta tarea.
Laboratorio: `BI_LAB_READER_PASSWORD_FILE` apunta al archivo existente del directorio
principal; `BI_TEST_POSTGRES=true` para backend. Navegador usa las opciones
`BI_SOURCE_TEST_API_PORT/UI_PORT/DATABASE_PATH` y
`BI_DATASET_TEST_API_PORT/UI_PORT/DATABASE_PATH`. La ruta de archivo se pasa al proceso,
no su contenido. Los defaults anteriores se conservan para ejecución en el checkout principal.

## Revisión visual

Se inspeccionaron las cuatro referencias exactas de [Stitch](README.md) y las
capturas reales de listado, creación, detalle, comparación e historial, a1440/390.
Evidencia local regenerable: `codebase/test-results-models/model-screens/`.
Axe sin violaciones en esas vistas; sin overflow horizontal del documento.
Las tablas tienen scroll interno. Teclado: tabs con flechas/Home/End y foco visible.
El pie móvil ya no tapa el formulario; confirmar cambios conserva la columna
izquierda de la matriz comparativa en desktop.

La continuación reconsultó captura/HTML exactos de las cuatro referencias. Se
corrigieron las diferencias identificadas en la primera entrega:

- Shell sólo en modelos: grupos General/Gobernanza, cabecera/perfil compactos,
  acciones de maqueta no implementadas identificadas como no disponibles.
- Tipografías Hanken Grotesk/Plus Jakarta Sans servidas localmente, con licencia
  distribuida y alias scoped: prueba de carga aprobada con CDN externos bloqueados.
- Paleta, jerarquía y densidad según exportación: aviso neutro/azul en lista,
  ámbar en creación, rojo en detalle; cabecera de detalle en tarjeta blanca.
- Fichas técnicas de medidas/dimensiones y procedencia con IDs/revisiones reales,
  integridad de captura, cuatro tarjetas de resumen de comparación y confirmación
  bajo la matriz, en su misma columna.
- Historial visible debajo del contenido capturado, como la referencia de detalle,
  además del acceso por pestaña. Fallar su carga no oculta la captura confirmada.
- Lista con datos propios y estado vacío fotografiados por separado, desktop/móvil.
- Control compacto de selección aprobado explícitamente como UX-US004-D02.

Se mantienen las cinco excepciones UX-US004-D01. Nombres/UUID/fechas/faltantes,
conteos autorizados y procedencias proceden de API, no del ejemplo Stitch. No se
copian certificaciones, versiones de motor ni claims ISO del mockup a la aplicación.
No se declara igualdad pixel-perfect: los datos propios, el texto obligatorio de
acciones no disponibles, las dos decisiones UX aprobadas y la adaptación móvil
producen diferencias esperables. La comparación visual del autor ya está ejecutada;
**la aceptación visual/funcional por el usuario sigue pendiente**.

## Prueba manual

Usar este worktree, no master: aún no se ha fusionado. No reiniciar ni migrar la
base manual del usuario para esta verificación. Desde dos terminales PowerShell:

Backend, en `codebase/backend`:

```powershell
$env:BI_ENVIRONMENT='development'
$env:BI_AUTH_MODE='development'
$env:BI_SEED_DEMO='true'
$env:BI_DATABASE_PATH='data/us004-manual.db'
$env:BI_ALLOWED_ORIGINS='http://127.0.0.1:5190'
& .venv/Scripts/python.exe -m uvicorn synapse_api.main:app --host 127.0.0.1 --port 8010
```

Frontend, en `codebase`:

```powershell
$env:VITE_DATA_SOURCE='api'
$env:VITE_API_AUTH='development'
$env:BI_API_PROXY_TARGET='http://127.0.0.1:8010'
npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port 5190 --strictPort
```

Abrir `http://127.0.0.1:5190/catalogo-semantico`: crear dominio, medidas/dimensiones
y KPI propios. Después `/modelos-semanticos`: crear modelo de ese dominio,
seleccionar KPI y guardar. Reabrir y preparar Borrador2. Cambiar una definición en
catálogo: el borrador conserva el texto anterior. Comprobar cambios, cancelar y
verificar que permanece intacto; repetir, marcar declaración y confirmar. Consultar
historial y comparar Borrador1/Borrador2: Borrador1 debe conservar su captura.
También guardar selección vacía y comprobar faltantes sin ninguna publicación.

Detener sólo estas dos terminales con Ctrl+C al terminar. Los puertos deben estar
libres antes de iniciar; no detener un proceso desconocido si están ocupados.
Junctions de dependencias/venv compartidas: no borrar recursivamente el worktree.

## Límites conservados

Guardar no aprueba, publica, certifica ni calcula. No hay motor US-005, ejecución
de fórmulas/SQL, lectura de filas de negocio ni escritura Gold. Roles reales por
tenant/dominio y retención aprobada siguen siendo gates productivos.
Revisión independiente finalizada: [hallazgos y correcciones verificadas](code-review.md).
Tres regresiones de recuperación RED→GREEN y paginación SQLite RED→GREEN;
suite completa verde después de la única pasada de correcciones. Integración local
realizada tras autorización explícita (opción 1); push no autorizado. Implementación,
verificación técnica e integración de la primera entrega completadas; la aceptación
visual/funcional humana sigue pendiente.
