# Pruebas funcionales con Playwright

Proyecto independiente de automatización para BI-AI-Analytics. Esta primera entrega ejecuta pruebas con la API de desarrollo y datos sintéticos; no prueba el login OIDC ni acredita los casos de permisos por KPI de Keycloak.

## Requisitos

- Node.js y npm.
- Python con las dependencias del backend instaladas, incluido `uvicorn`. El backend se encuentra por defecto en `../../codebase/backend`.
- Dependencias de la aplicación instaladas en `../../codebase` (`npm ci` en ese directorio cuando corresponda).
- Navegador Chromium de Playwright instalado (`npx playwright install chromium`).

## Instalación y ejecución

Desde `testing/functional`:

```powershell
npm ci
npx playwright install chromium
npm test
npm run report
```

Listar los casos sin ejecutarlos: `npm run list`. Para usar la interfaz interactiva: `npm run test:ui`.

El proyecto inicia su propia API y frontend en `127.0.0.1:8067` y `127.0.0.1:5267`, en modo desarrollo, y genera una SQLite de nombre único en la carpeta temporal del sistema. No reutiliza servidores existentes: si el puerto está ocupado, falla para evitar ejecutar pruebas contra otro entorno. La base temporal se conserva y no se borran datos de usuario. Los servicios iniciados por Playwright se detienen al finalizar.

Para probar un worktree específico, definir la ruta absoluta de **su carpeta `codebase`** antes de ejecutar:

```powershell
$env:BI_CODEBASE_DIR = 'C:\ruta\al\worktree\codebase'
$env:BI_TEST_PYTHON = 'C:\ruta\a\python.exe'
npm test
```

Opcionales: `BI_TEST_API_PORT`, `BI_TEST_UI_PORT`, `BI_TEST_PYTHON` y `PLAYWRIGHT_EXECUTABLE_PATH` para un navegador Chromium instalado. Las variables de puertos deben contener puertos libres, y `BI_TEST_PYTHON` una ruta de ejecutable, no una línea de comandos.

## Cobertura actual

| Caso | Prueba | Límite |
|---|---|---|
| R01, parcial | Catálogo con sesión de desarrollo | No verifica Keycloak ni login OIDC. |
| R02 y R15, parcial | Crear dashboard, configurar período, filtrar, limpiar y recargar | Usa ingresos sintéticos del laboratorio; no cubre todos los estados de fecha. |
| Control de API | Denegar lectura de dashboards sin sesión | No sustituye las pruebas de tenant ni autorización por KPI. |
| R16, parcial | Catálogo móvil sin desbordamiento | No evalúa conformidad visual con Stitch ni accesibilidad completa. |

Los casos R03–R14 y R17–R18 del plan de US-006, así como la autenticación real, la accesibilidad completa y la comparación visual, no están automatizados por este proyecto. Véase `../../.worktrees/us-006-keycloak-kpi-access/docs/ux/us-006/plan-pruebas-keycloak.md` cuando ese worktree exista.

Los reportes se generan en `playwright-report/` y `test-results/`, ignorados por Git. Las trazas están desactivadas y no se almacenan credenciales en el proyecto. Las capturas se generan únicamente al fallar y pueden contener datos sintéticos; revísalas antes de compartirlas.

## Pruebas OIDC contra laboratorio existente

`npm run test:oidc` ejecuta una suite separada contra `http://127.0.0.1:5173`, con Keycloak y la API OIDC ya iniciados. Solo admite URL HTTP loopback; no arranca servicios ni crea ni elimina datos. Configura las credenciales de cuentas sintéticas en variables de entorno locales, sin guardarlas en archivos ni incluirlas en reportes:

```powershell
$env:BI_OIDC_OWNER_USER = 'usuario-propietario'
$env:BI_OIDC_OWNER_PASSWORD = Read-Host 'Contraseña de laboratorio del propietario'
$env:BI_OIDC_READER_USER = 'usuario-lector'
$env:BI_OIDC_READER_PASSWORD = Read-Host 'Contraseña de laboratorio del lector'
npm run test:oidc
```

Para R03, configurar además `BI_OIDC_OTHER_USER`, `BI_OIDC_OTHER_PASSWORD` y `BI_OIDC_TEST_DASHBOARD_PATH` con la ruta `/dashboards/{id}` de un dashboard sintético del propietario. Sin ruta, ese caso se omite explícitamente. Las cuentas deben estar configuradas en el realm y los servicios deben estar activos; estas pruebas no inicializan Keycloak ni su base.

Cobertura OIDC actual: R01 para login de propietario y lector, y R03 disponible con ruta de prueba. La ruta de login con `returnTo` se registró como `fixme`: el realm temporal rechazó la URL de redirección durante la ejecución; no se considera aprobada. Las pruebas aún no automatizan concesión, revocación, migración ni R04–R18. Capturas, vídeo y trazas están desactivados para esta suite; revisar los reportes antes de compartirlos, pues los errores pueden contener datos sintéticos de la página.
