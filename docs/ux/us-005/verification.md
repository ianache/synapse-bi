# US-005 — Consulta sintética y metadatos ausentes

Fecha: 2026-10-18. Rama: `feat/us-005-lab-metadata`, worktree
`.worktrees/us-005-lab-metadata`. Alcance: decisión humana US-005-Q1 de laboratorio.
La aceptación manual por el usuario sigue pendiente.

## Cambios y límites

- La consulta conserva su resultado si faltan metadatos de confianza.
- Catálogo: calidad/frescura omitidas, null o vacías pasan a «No disponible»;
  linaje omitido o null pasa a lista vacía. No se inventan dimensiones ni linaje.
- Consulta: controles no evaluados se mantienen como `not_evaluated`,
  score/política null; linaje conserva sus nodos y añade `lineageStatus`
  `available|unavailable`. Una lista vacía no equivale a procedencia certificada.
- Identidad inválida: 401. KPI visible sin `queries:execute`: 403.
  KPI oculto, fuera del tenant o inexistente: 404 genérico, incluso sin ese scope.
  Una solicitud denegada no llega a consultar hechos ni auditar una ejecución exitosa.
- El motor sigue cerrado a los KPI sintéticos existentes. Esta entrega no conecta
  las definiciones en borrador de US-003/004 con consultas de datos reales.
  Workload real, umbrales, objetivos de servicio y política por clase siguen
  pendientes en US-005-Q2.

## Referencia visual

Se consultaron HTML y capturas de las pantallas existentes:

- [Explorar KPI — Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=780d7b8cb45a4534830f9ca8cad34be6):
  HTML `15dd58a86be3422e905bad9d38285905`, captura `73adeb5aec1744b4a51999702ca6e693`.
- [Añadir KPI — Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=93bbb7eb7e0c4f9c86a1baff653ad528):
  HTML `ac2f4d8d3dfa4bb3ab953dfb9e476a78`, captura `cf9a8ea4b6414333ac0c9894df302774`.

Se conserva la composición y el shell previamente implementados. Los porcentajes,
fuentes ERP y estados certificados del mockup no se trasladan al laboratorio.
Se sustituyen respaldos ficticios de texto por disponibilidad explícita.
Las pantallas de referencia no incluyen el estado exacto del resultado consultado
sin metadatos; no se declara equivalencia pixel a pixel.

Capturas revisadas del incremento:

- [Consulta con metadatos disponibles](assets/query-metadata-available-desktop.png).
- [Consulta con metadatos ausentes — escritorio](assets/query-metadata-missing-desktop.png).
- [Consulta con metadatos ausentes — móvil](assets/query-metadata-missing-mobile.png).
- [Detalle sin linaje en el fixture manual](assets/manual-lab-missing-lineage-detail.png).

Observación visual: el valor y sus avisos son legibles, el contenido se ajusta
a 390 px sin desbordamiento horizontal. La Mainbar y Menubar corresponden al
incremento de navegación compartida ya aprobado; no se rediseñan aquí.
Los indicadores de éxito (check de calidad y punto de frescura) se omiten
para datos sintéticos y estados no evaluados/no disponibles.

## Prueba manual de esta instancia

Aplicación: `http://127.0.0.1:5195`; API: `http://127.0.0.1:8025`.
Se preparó una SQLite nueva y sintética dentro del worktree, sin credenciales
PostgreSQL ni modificaciones a las bases manuales del directorio principal.

Abrir [dashboard preparado](http://127.0.0.1:5195/dashboards/0900a444-b02d-422c-9387-e1e3b2fc2792).
Este fixture contiene dos KPI: Ingresos netos sin linaje/calidad/frescura declarados
en su documento de catálogo, y Margen bruto con el linaje sintético original.
El ejecutor no evalúa controles de calidad o frescura en ninguno de los dos.

| Caso | Acción | Resultado esperado |
|---|---|---|
| MAN-01 | Consultar del 1 al 3 de octubre de 2026, canal Todos. | Ingresos netos: 3,100.00 PEN; Margen bruto: 43.55 %. Ambos indican cálculo sintético y calidad/frescura sin evaluar. |
| MAN-02 | Revisar Ingresos netos y abrir «Ver definición». | Resultado conservado y «Linaje: No disponible». En la definición, «Linaje no disponible» y calidad/frescura de catálogo «No disponible». No aparece una ruta ERP/Gold inventada. |
| MAN-03 | Revisar Margen bruto y su definición. | Conserva «Registros de ventas sintéticos → Modelo de ventas de ejemplo v1». La presencia de linaje no cambia calidad/frescura a aprobadas. |
| MAN-04 | Seleccionar canal Digital. | Ingresos netos cambia a 1,400.00 PEN y sigue mostrando linaje no disponible. |
| MAN-05 | Consultar del 1 al 2 de enero de 2020. | «Sin datos en este período» y último dato no disponible; no muestra un cero inventado. |
| MAN-06 | Recargar y reducir la ventana a móvil. | Recupera el dashboard de la API; valor/avisos legibles, navegación móvil disponible y sin desplazamiento horizontal. |

Las ausencias de metadatos de la respuesta de consulta, y los casos 401/403/404,
se reproducen mediante las pruebas automatizadas de contrato indicadas abajo.
No se añade un selector de permisos ni un modo de falla a la aplicación.

## Verificación automatizada

| Comprobación | Resultado |
|---|---|
| Suite frontend completa | 145 pruebas aprobadas en 46 archivos. |
| Suite backend completa | 197 aprobadas; 1 omitida: integración PostgreSQL opt-in. 198 pruebas recolectadas. |
| Navegador contra API Python aislada | 4 casos aprobados; incluye omisión de metadatos, persistencia y accesibilidad automática del alcance comprobado. |
| TypeScript | Aprobado. |
| Build aplicación | Aprobado, 142 módulos. |
| Revisión de código independiente | Sin defectos reportados. |
| Formato Git | `git diff --check` aprobado. |

Advertencias existentes: API CJS de Vite obsoleta, adaptador httpx de TestClient
obsoleto, localStorage experimental de Node y NO_COLOR/FORCE_COLOR en navegador.
No se ejecutó integración con PostgreSQL ni se leyó la credencial del laboratorio.

Las regresiones se escribieron antes de corregir el código. Se observaron fallos
por 500 ante campos ausentes, linaje/dimensiones de ejemplo, metadata no presentada
y 403 para un identificador oculto sin scope. Luego pasaron las pruebas focalizadas.

Comandos desde `codebase` del worktree:

```powershell
npm test -- --maxWorkers=1 --minWorkers=1 --testTimeout=15000
npm run typecheck
npm run build
$env:CI='1'
$env:BI_API_TEST_API_PORT='8025'
$env:BI_API_TEST_UI_PORT='5195'
$env:PLAYWRIGHT_EXECUTABLE_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run test:api-integration
```

La instancia manual debe detenerse antes de repetir E2E con esos mismos puertos,
o deben elegirse otros puertos libres. La suite crea su propia base de navegador;
la prueba de metadata ausente conserva el cálculo real de la API y omite
intencionalmente campos en la frontera HTTP para verificar la UI.

Backend, desde `codebase/backend`:

```powershell
$env:BI_TEST_POSTGRES='false'
.venv/Scripts/python.exe -m pytest -o addopts= -q --tb=short -p no:cacheprovider
```

Revisión independiente de código: sin defectos Critical, Important o Minor
reportados. No equivale a aceptación del usuario ni a verificación de producción.
Después de esa revisión se neutralizaron los indicadores de éxito en el
laboratorio; se repitieron 12 pruebas focalizadas, tipos/build, los 2 casos de
navegador afectados y la comprobación visual de ese estado. Este ajuste menor
final fue revisado por el implementador.
