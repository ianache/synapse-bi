---
title: US-003 — Catálogo semántico configurable, recorrido UX
status: draft
date: 2026-10-16
sources:
  - id: SEM-US003-D06
    resource: /docs/ux/us-003/decisions.md
  - id: API-003
    resource: /knowledge-base/design/api-contracts/API-003-semantic-catalog.md
  - id: US003-DESIGN
    resource: /docs/superpowers/specs/2026-10-16-us-003-semantic-catalog-design.md
---

# US-003 — Recorrido de definición y reutilización

Actualización 2026-10-17: recorrido implementado localmente en el worktree
`.worktrees/us-003-semantic-catalog`, rama `feat/us-003-semantic-catalog`, por D07.
Pruebas nuevas de navegador: 2 passed (40.1 s), teclado/axe y anchos 1440/390 en
formulario de dominio, componente, KPI y copia. Los apartados de propuesta
conservan procedencia del diseño; no equivalen a certificación productiva.

Especificación UX para revisión de T1, no pantallas implementadas ni resultados
de pruebas. Diseño/plan aceptados localmente en SEM-US003-D06; contratos nuevos y
pantallas concretas no reciben aprobación automática. Dominio no es un tenant.

## 1. Navegación y pantallas

Entrada `/catalogo-semantico`, separada de explorar KPI de demostración. Reutilizar
SynapseShell, tokens y componentes actuales; no cambiar login ni inventar permisos.
Sólo mostrar gestión cuando `/me` conceda scopes de API-003; backend valida siempre.

| ID | Ruta propuesta | Contenido / acción |
| --- | --- | --- |
| SC-UI01 | `/catalogo-semantico` | Selector de dominio, búsqueda y filtros por tipo; nombre/estado documental/origen/consumidores. Crear dominio y elemento. No valores calculados. |
| SC-UI02 | `/catalogo-semantico/dominios/nuevo` y `/dominios/{id}/editar` bajo el mismo prefijo | Nombre obligatorio; descripción y owner opcionales. Owner declarado no concede acceso. |
| SC-UI03 | `/catalogo-semantico/componentes/nuevo` y `/componentes/{id}/editar` | Dimensión/medida, dominio, definición/grano/sinónimos; medida añade unidad/agregación. Binding opcional: elegir dataset visible y columna seleccionada, no escribir SQL. |
| SC-UI04 | `/catalogo-semantico/kpi/nuevo` y `/kpi/{id}/editar` | Nombre/dominio; referencias a componentes del mismo dominio; atributos, fórmula textual y pendientes. Sin botones ejecutar/publicar. |
| SC-UI05 | `/catalogo-semantico/{dominios|componentes|kpi}/{id}` | Ficha, pendientes, metadatos y vínculo histórico; consumidor/copia en componente, no confundir copy origin con consumidor. |
| SC-UI06 | Diálogo desde componente | Ver consumidores paginados; nombre para copia. Crear copia abre nueva ficha; no reasigna ningún KPI automáticamente. |

Las rutas abreviadas de edición de la tabla siempre llevan prefijo
`/catalogo-semantico`, no son nuevas rutas globales. Las URLs de UI no sustituyen
las rutas de API-003 (`kpi-definitions` frente a segmento UI `kpi`).

## 2. Recorrido de aceptación manual a implementar

1. Data-admin crea dominio «Logística», claramente ejemplo editable, sin dataset obligatorio.
2. Crea dimensión «Centro» y medida «Tiempo de entrega»; guarda mínimos, recupera fichas con faltantes reales.
3. Declara un binding usando dataset/columna de US-002 cuando exista. Si falta, el borrador se conserva incompleto; no inferir grano.
4. Crea «Entrega puntual» y «Cumplimiento por centro», ambos referencian la misma medida. Lista de componentes vacía también es borrador permitido, no referencia rota.
5. Abre medida usada: bloqueada para edición completa, texto «Protegida desde su primer uso», ver consumidores/crear copia disponibles.
6. Crea «Tiempo de entrega ajustado» como copia; muestra origen, contenido y vínculo histórico conservados, sin consumidores ni protección inicial.
7. Edita sólo primer KPI para seleccionar copia; segundo KPI conserva referencia original. Recarga y verifica persistencia.
8. Si se retira última referencia, original sigue protegido; no ofrecer desbloqueo. Si cambia dataset, mostrar advertencia sin reanclado.

## 3. Contenido y estados

- Banner «Definiciones en borrador. Guardar no publica ni ejecuta fórmulas»; fórmula «Sin ejecutar».
- Estado documental «Completo» sólo significa metadatos presentes; gobierno siempre pendiente, sin color/etiqueta de certificado o aprobado.
- Pendientes propios y de componentes enlazados; validación de existencia/autorización no se disfraza de pendiente opcional.
- Si binding está dataset_changed/column_removed/unavailable, advertir y evitar «documentación completa»; permisos faltantes no revelan nombres físicos del snapshot.
- Carga con región aria-busy; vacío con CTA; 403 sin controles de gestión; 503 permite reintentar conservando formulario; duplicado apunta al nombre sin revelar recursos ajenos.
- If-Match obsoleto: mantener cambios y ofrecer revisar/recargar con confirmación; bloquear edición durante recarga. No sobrescritura automática.
- Evitar doble envío; conservar clave de alta/copia al reintentar el mismo contenido tras resultado incierto. Cambiar contenido implica nuevo intento lógico y resolución de la operación anterior.
- Salvar tras desmontaje no navega ni actualiza otra ficha; cancelar consultas y descartar respuestas viejas. No simular cancelación del alta ya enviada.
- Nombres/definiciones/fórmulas escapados; sin dangerouslySetInnerHTML. Textarea fórmula no es consola ni editor SQL.

## 4. Accesibilidad y responsive

Labels asociados, instrucciones y errores por campo, resumen de errores enfocable,
orden lógico de teclado, foco inicial/retorno y trap del diálogo, escape/cancelar,
sin navegación por color solamente. Tabla con encabezados y alternativa de cards
en móvil sin perder acciones/estado. Pruebas futuras teclado/axe en lista, fichas,
formularios y copia; no prometer certificación completa por un diseño de Stitch.

## 5. Stitch y procedencia visual

Proyecto existente: [Synapse BI](https://stitch.withgoogle.com/projects/4378861557064448535).
Se verificó inventario existente: catálogos de datasets, registro/ficha de datasets,
fuentes, explorar KPI y kit de componentes; no había pantalla de catálogo US-003.
Se generó una nueva propuesta desktop SC-UI01 con ficha/consumidores protegidos,
sin editar pantallas previas. Recurso verificado en la respuesta del generador:
`projects/4378861557064448535/screens/52fd5fb8a6254ff4bf1165579309bc9e`,
título «US-003 · Catálogo semántico configurable — Synapse BI», desktop 2560×3202,
estado COMPLETE. HTML recurso `projects/4378861557064448535/files/2f348d522b4b4e189ba0ee8d0ec2d7ea`;
screenshot `projects/4378861557064448535/files/bd393037458c4aab80c4bbdfe1fcc7be`.
Generación confirmada, no aprobación visual humana ni implementación.

Stitch informa que incorporó shell corporativo, selector Logística como ejemplo,
pestañas, medida compartida por dos KPI, protección/copia, advertencia de vínculo
desactualizado y estado vacío. Es descripción del generador, pendiente de inspección
visual; no prueba funcional. Su ejemplo `fact_envios/dias_transito` es ficticio,
no objeto verificado del laboratorio ni opción para preinsertar en la API. Un
warning real se deriva de edición del dataset registrado, no de introspección nueva.

Sugerencias devueltas por Stitch para el siguiente paso visual: diseñar modal de
«Crear copia», ver pestaña KPI con dependencias y simular dominio vacío. No se
ejecutaron ni se presentan como pantallas ya creadas.

SC-UI02/03/04 y detalle del diálogo requieren revisión de este recorrido y
concreción visual antes de T6. El catálogo desktop no prueba por sí solo todos
los formularios ni la adaptación móvil. No se han exportado assets ni instalado
dependencias. No se enviaron datos de negocio reales ni secretos al generador.

## 6. Gate y siguiente acción

Implementación local autorizada en D07 tras presentar los contratos. Revisiones
corporativas y aceptación manual del usuario siguen pendientes. Pantallas Stitch
adicionales generadas: dominio `0a23d5218fb840d89883cd07c9998d6c` y componente/copia
`dc2a2dece93f411abaf8bd7a25bfbfbf`. Formulario KPI no generado por límite de uso del
servicio/auto-review; no se eludió. Se implementó según diseño funcional aprobado.
Se descartaron divergencias del generador: IDs manuales, owner preasignado,
faltantes inventados en dominio y edición parcial de protegidos. Backend decide
permisos, asigna UUID y bloquea todos los campos de componente protegido.

Rutas implementadas emplean segmentos `domains`, `components`, `kpi-definitions`
bajo `/catalogo-semantico`; alta `/nuevo`, edición `/{id}/editar`, ficha `/{id}`.
No se cambian rutas previas ni se preinsertan ejemplos de Stitch en producción.

### Prueba manual local

Desde el worktree, dos terminales PowerShell. Usar puertos libres propios;
si están ocupados, cambiar puerto, origen CORS y proxy juntos, sin detener servicios ajenos.

Backend, carpeta `codebase/backend`:

```powershell
$env:BI_ENVIRONMENT='development'
$env:BI_AUTH_MODE='development'
$env:BI_SEED_DEMO='true'
$env:BI_DATABASE_PATH="data/semantic-manual-$([guid]::NewGuid().ToString('N')).db"
$env:BI_ALLOWED_ORIGINS='http://127.0.0.1:5186'
.venv\Scripts\python.exe -m uvicorn synapse_api.main:app --host 127.0.0.1 --port 8006
```

Frontend, carpeta `codebase`:

```powershell
$env:VITE_DATA_SOURCE='api'
$env:VITE_API_AUTH='development'
$env:BI_API_PROXY_TARGET='http://127.0.0.1:8006'
npm run dev --workspace @bi-analytics/bi-analytics -- --host 127.0.0.1 --port 5186 --strictPort
```

Abrir `http://127.0.0.1:5186/catalogo-semantico`. Seguir pasos 1–8 de §2. Base nueva
con fixtures explícitos, sin migrar la base manual previa; para verificar reinicio,
conservar exactamente BI_DATABASE_PATH al reiniciar backend. El modo desarrollo
elige persona data-admin sólo en este laboratorio; no es login productivo.
Para probar mapeos reales registrar primero fuente/dataset US-001/002 en esta base,
o usar una copia autorizada y respaldada de un control plane existente, nunca Gold.

Comandos de evidencia en `codebase`: `npm test`, `npm run typecheck`, `npm run build`,
`npm run test:semantic-catalog`; backend `.venv\Scripts\python.exe -m pytest`.
Los datos E2E propios permanecen en `backend/data/semantic-e2e-*.db`; no se borraron
bases ni respaldos. No afirmar revisión independiente concluida hasta su reporte.

### Registro histórico de T1

Revisar conjuntamente [API-003](../../../knowledge-base/design/api-contracts/API-003-semantic-catalog.md),
[DM-003](../../../knowledge-base/design/data-models/DM-003-semantic-catalog.md) y este
recorrido. T1 queda en revisión; no marcarlo completo por existir documentos.
La guía manual anterior define pruebas a implementar, no una ejecución validada.
