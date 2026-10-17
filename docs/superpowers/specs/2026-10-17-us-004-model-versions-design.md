# US-004 — Primera entrega: modelos y borradores versionados

Fecha: 2026-10-17 (America/Lima). Estado: **especificación para revisión**.
La agrupación y captura explícita fueron aprobadas; este documento es nuevo y
requiere revisión antes del plan detallado. No hay implementación de esta entrega.

## 1. Intención y éxito

Permitir a un usuario autorizado preparar un contrato semántico identificable,
con KPI de un único dominio y dependencias capturadas. Debe poder recuperar lo
guardado, distinguirlo del catálogo actual y actualizarlo conscientemente.

Éxito: crear un modelo propio, seleccionar KPI, guardar y recuperar su borrador,
cambiar después una definición del catálogo y comprobar que el borrador no cambia;
comparar y aceptar explícitamente una actualización sin alterar otras versiones.
Guardar no aprueba, publica, certifica ni calcula.

## 2. Fuentes y autoridad

- [BRC-002](/knowledge-base/business/rules/BRC-002-gobierno-publicacion-modelo-semantico.md): GOV004-01–13; EVD-2026-0016/17 respaldan agrupación y captura explícita.
- [US-004](/knowledge-base/requirements/user-stories/US-004-versionar-y-publicar-modelo-semantico.md): historia madre y criterios del ciclo completo; esta entrega no los satisface todos.
- [IMD-002](/knowledge-base/business/information-model/IMD-002-catalogo-semantico.md): R-09 modelo/dominio, sin sustituir las relaciones US-003.
- [API-003](/knowledge-base/design/api-contracts/API-003-semantic-catalog.md): catálogo existente, referencias autorizadas y revisión técnica; no es una API de publicación.
- [AGENTS.md](/AGENTS.md): Stitch obligatorio y comparación visual desktop/móvil.

Las elecciones de interacción y límites de la sección 5 son propuestas de este
documento; no se atribuyen retroactivamente a la aprobación funcional.

## 3. Alcance y entregas posteriores

Primera entrega: modelos, selección de KPI, captura de definiciones/dependencias,
recuperación de borradores, comparación y actualización explícita.

Después: revisión/publicación; deprecación/retiro; operaciones excepcionales.
Estos bloques mantienen reglas aprobadas, pero requieren sus propios diseños y
planes. No se habilitan controles que aparenten operaciones todavía inexistentes.

Fuera: motor US-005, SQL, lectura de filas de negocio, escritura en Gold, sustitución
de KPI sintéticos existentes, sincronización automática, modelos multidominio,
aprobaciones reales, publicación y despliegue productivo.

## 4. Límites del modelo

- Exactamente un dominio por modelo; varios modelos posibles por dominio.
- No crear modelos al registrar dominios ni convertir cada dominio en un modelo.
- Selección sólo de KPI existentes/autorizados de ese dominio; incluir sus
  dimensiones/medidas declaradas y procedencia técnica necesaria para explicar linaje.
- Capturar contenido y referencias, no sólo una lista que lea siempre valores actuales.
- Cambios del catálogo no modifican silenciosamente capturas guardadas.
- Las definiciones históricas capturadas son metadatos, no resultados de consultas.
- Autorización vigente sigue aplicando a lecturas históricas: una captura no otorga
  acceso a metadatos o fuentes antes ocultos ni amplía permisos del dataset.

## 5. Flujo propuesto para revisión

1. Listar modelos autorizados por dominio y abrir detalle con historial de versiones.
2. Crear modelo con nombre y dominio; seleccionar KPI y revisar dependencias.
3. Guardar borrador y mostrar faltantes documentales por separado de su estado draft.
4. Reabrir contenido capturado, con fecha y referencias de origen identificables.
5. Comprobar cambios del catálogo mediante acción explícita; mostrar diferencias
   de KPI/componentes/referencias: agregados, retirados y modificados.
6. Cancelar comparación conserva borrador; aceptar actualización aplica el conjunto
   revisado de forma íntegra, no una mezcla de lecturas de distintos momentos.
7. Preparar una nueva versión a partir de una anterior sin modificar la anterior;
   comparar versiones mediante selección explícita de origen/destino.

Propuestas de límites: dominio no editable tras crear el modelo; se permite guardar
un borrador aún sin KPI, mostrando faltantes; no equivale a publicable. No se asigna
una versión publicada ni se afirma disponibilidad para consumo por guardar borrador.
La revisión técnica de edición permanece distinta de MAJOR.MINOR.PATCH funcional;
el contrato detallado especificará la representación antes de implementación.

## 6. Integración y responsabilidades

El catálogo US-003 sigue manteniendo definiciones editables según sus protecciones.
El módulo de modelos conserva capturas y comparaciones; no modifica el catálogo
cuando actualiza un borrador ni cambia consumidores de demostración existentes.
El frontend presenta selección, contexto histórico, diferencias y errores; el
backend debe imponer tenant, dominio, autorización y coherencia de capturas.

Diseño aditivo: no cambiar contratos actuales de catálogo/queries/dashboards para
simular publicación. Contratos de modelos y persistencia requieren documentos
propios revisados antes de codificar; este diseño no prescribe tablas ni endpoints.

## 7. Fallos y recuperación propuestos

- Referencia de otro dominio o no autorizada: rechazar sin revelar contenido oculto.
- Catálogo cambiado entre comparación y confirmación: no aceptar silenciosamente
  contenido distinto del mostrado; conservar edición y exigir nueva comparación.
- Conflicto de edición: preservar cambios locales y ofrecer recuperación explícita.
- Resultado de guardado incierto: reintento seguro sin duplicar modelo/versión.
- Dependencia no disponible: no capturar parcialmente ni reutilizar permisos pasados;
  informar lo permitido y conservar la captura anterior sin ampliación de acceso.
- Respuesta tardía después de abandonar el editor: no navegar ni sobrescribir otra edición.

## 8. UX y Stitch

Actualización: por solicitud explícita del usuario se generaron las cuatro vistas
desktop antes de cerrar esta revisión escrita. Referencias y diferencias pendientes
en [UX US-004](/docs/ux/us-004/README.md). Generación no implica aprobación visual
ni aceptación íntegra de esta especificación.

Inventario propuesto: listado de modelos; creación/selección de KPI y dependencias;
detalle de borrador e historial; comparación y confirmación de actualización.
Estados vacío, carga, error, sin permiso, conflicto y cambios pendientes explícitos.
Captura histórica y catálogo actual deben diferenciarse, sin badges de certificación.

Continuar el proyecto Stitch 4378861557064448535 y su lenguaje visual existente.
No existen pantallas nuevas aprobadas de esta entrega en esta especificación.
Generarlas tras revisión de este documento, registrar sus referencias y consultar
HTML/capturas exactos antes de implementar. Comparación final real a 1440/390 px,
teclado, contraste y ausencia de overflow documental; no copiar datos del mockup.

## 9. Verificación de la futura implementación

- Unidad: selección por dominio, dependencias compartidas, diferencias, cancelación,
  captura estable y actualización explícita.
- Servicio/contrato: aislamiento tenant, permiso revocado, referencia oculta,
  atomicidad, concurrencia, reintento y contenido confirmado igual al revisado.
- Navegador: dominio propio → KPI → modelo → borrador recuperado → cambio de
  catálogo → comparación → cancelar/aceptar → versión anterior intacta.
- Regresión: fuentes/datasets/catálogo y consumidores actuales conservados; no
  consultar ni modificar filas Gold por crear/actualizar el modelo.
- Accesibilidad y comparación con Stitch desktop/móvil como evidencias separadas
  de funcionalidad. Estas pruebas se especifican aquí, no se declaran ejecutadas.

## 10. Revisión y siguiente gate

Revisar especialmente sección 5: dominio fijo, borradores vacíos permitidos y
comprobación explícita del catálogo. Son propuestas nuevas, no decisiones previas.
Tras aprobación escrita: preparar pantallas Stitch y contratos/modelo de datos
necesarios; redactar plan detallado, revisarlo y elegir método de ejecución antes
de implementar. No se presupone aprobación de código ni de despliegue.

Condiciones de operación conservadas: nombramientos reales por tenant/dominio
antes de datos reales; política de retención aprobada antes de producción.
