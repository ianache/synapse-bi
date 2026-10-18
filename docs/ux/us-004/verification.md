# US-004 — Verificación de la primera entrega

Fecha: 2026-10-17. Rama `feat/us-004-model-versions`, worktree
`.worktrees/us-004-model-versions`. Plan y API-004/DM-004 aprobados por el usuario
en esta sesión. No implica aceptación visual ni cierre de la historia madre.

## Evidencia ejecutada

- Backend: suite completa186passed/1PostgreSQL opt-in omitida (44.25s).
- Frontend: suite final93passed/38archivos (191.99s). Typecheck y build exit0
  después de las correcciones finales; git diff --check sin errores.
- Modelos: cuatro pruebas Playwright en verde (41.4s), API8010/UI5190, SQLite única.
  Respuesta perdida/reintento crea un solo modelo; cambios del catálogo no alteran
  capturas; clonación, cancelación, confirmación e historial; 409/412 y recuperación;
  tenant ajeno404; falta de scopes bloquea lectura; consumidores KPI existentes intactos.
- Catálogo: tres pruebas de navegador en verde (40.5s), API8011/UI5191.
- API/consumidores: tres pruebas de navegador en verde (25.2s), API8012/UI5192.
- Smoke: siete pruebas en verde (27.1s), fixtures/UI5193. El servidor existente4173
  no se reutilizó ni detuvo. API8006/UI5186 y PostgreSQL del usuario intactos.
- Fuentes/datasets navegador y PostgreSQL opt-in: **no ejecutados**; requieren
  secretos de laboratorio no trasladados al worktree. Las pruebas backend/unitarias
  existentes de fuentes y datasets sí forman parte de las suites completas.

Comandos en `codebase`: `npm run test:semantic-models`,
`npm run test:semantic-catalog` (BI_SEMANTIC_API_PORT8011/UI_PORT5191),
`npx playwright test --config playwright.api.config.ts` (BI_API_TEST_API_PORT8012/
UI_PORT5192, CI=true), `npx playwright test --config playwright.us004-smoke.config.ts`.
Chrome local mediante PLAYWRIGHT_EXECUTABLE_PATH; no navegador instalado por esta tarea.

## Revisión visual

Se inspeccionaron las cuatro referencias exactas de [Stitch](README.md) y las
capturas reales de listado, creación, detalle, comparación e historial, a1440/390.
Evidencia local regenerable: `codebase/test-results-models/model-screens/`.
Axe sin violaciones en esas vistas; sin overflow horizontal del documento.
Las tablas tienen scroll interno. Teclado: tabs con flechas/Home/End y foco visible.
El pie móvil ya no tapa el formulario; confirmar cambios conserva la columna
izquierda de la matriz comparativa en desktop.

No se declara fidelidad pixel-perfect ni aceptación visual. Se conservan estructura
de tarjetas, selección con resumen lateral, contenido capturado e historial y
comparación con acción explícita. Además de las cinco excepciones autorizadas,
hay diferencias que deben revisarse antes de aceptar visualmente:

- Shell compartido: agrupación de navegación, perfil y cabecera no son una copia
  exacta de la cabecera compacta de las referencias US-004.
- Densidad/espaciado y aviso de gobernanza ámbar uniforme frente a variantes
  azul/rojo de los prototipos; resumen lateral con listas en lugar de todas las
  fichas técnicas ilustradas en Stitch.
- Comparación expone un desplegable para ajustar KPI del mismo dominio, necesario
  para editar la selección aprobada, pero no dibujado así en la referencia.
- Fixtures de prueba propias, sin copiar nombres, fechas, números o procedencias
  ficticias de Stitch a la base. Los UUID asignados por servidor cambian el largo
  del contenido. Fuentes web externas bloqueadas en E2E: screenshots usan fallback.

Estas diferencias no son nuevas excepciones aprobadas. El mandato de apego fiel
a Stitch sigue vigente y la aceptación visual permanece pendiente.

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
suite completa verde después de la única pasada de correcciones. No se autoriza
merge/push automático. La conformidad visual exacta sigue pendiente.
