# US-004 — Pantallas Stitch de primera entrega

Fecha: 2026-10-17. Estado: **prototipos desktop generados; revisión visual pendiente**.
Actualización de ejecución: plan y contratos aprobados por el usuario. Primera
implementación en rama aislada; [resultados, diferencias visuales y prueba manual](verification.md).
Los apartados siguientes conservan el registro histórico previo a la implementación.
El usuario pidió avanzar con pantallas en Stitch. Esto autoriza esta generación,
no demuestra aprobación íntegra de la especificación, contratos, plan o ejecución.

Actualización de decisión UX-US004-D01 (2026-10-17): tras consultar nuevamente el
HTML de Stitch, el usuario respondió «aprobado» a cinco excepciones explícitas de
implementación: retirar Exportar, reemplazar Snapshot inmutable por Captura estable
· actualización explícita, descripción técnica pendiente en vez de umbral inventado,
confirmación inicialmente desmarcada y KPI Ticket promedio consistente entre vistas.
Conservar intacta la composición visual. Esta autorización resuelve la necesidad de
decisión sobre esas discrepancias; no afirma que Stitch haya actualizado su exportación
ni aceptación visual de una aplicación todavía inexistente.

## Referencias

Proyecto existente: [BI Dashboard with AI](https://stitch.withgoogle.com/projects/4378861557064448535).
Sistema reutilizado: Crimson Slate Minimal, `assets/f09737a9c46f4629a3097bc03ec77dc7`.
No se cambió el sistema visual global ni se eliminaron pantallas anteriores.

| Pantalla | Referencia vigente | Alcance |
|---|---|---|
| Listado de modelos | [17a4a68f84b24e7cb8a53809e41d208a](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=17a4a68f84b24e7cb8a53809e41d208a) | Buscar/filtrar por dominio, abrir y crear modelos en borrador. |
| Crear modelo | [a24b9372c98041b7901baddfa9765dfe](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=a24b9372c98041b7901baddfa9765dfe) | Nombre/dominio, selección de KPI, captura y dependencias únicas. |
| Detalle e historial | [1a69f421052544b9b40896e8695a5159](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=1a69f421052544b9b40896e8695a5159) | Contenido capturado, historial y comprobación explícita del catálogo. |
| Comparación y confirmación | [fa8ba6609b984fafba911f2e5d3a6d22](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=fa8ba6609b984fafba911f2e5d3a6d22) | Diferencias captura/catálogo, cancelar o confirmar actualización. |

La creación inicial `027921d4aa2a4725870665696267549a` se conserva como antecedente;
la referencia preferida es la revisión `a24b9372c98041b7901baddfa9765dfe`.

## Reglas de interpretación

- Un dominio por modelo, varios modelos por dominio, sin creación automática.
- Capturas estables, actualización explícita tras comparación, no sincronización.
- Guardar no publica, certifica ni calcula. No implementar acciones de US-005.
- Mockups con datos sintéticos identificados como laboratorio: nombres, conteos,
  identificadores, fórmulas y fechas no son datos ni contratos empresariales reales.
- La revisión de creación elimina el slug sugerido, muestra identificador asignado
  al guardar y permite elegir dominio antes de crear. No inventar identificadores.
- Referencia funcional: [especificación para revisión](/docs/superpowers/specs/2026-10-17-us-004-model-versions-design.md)
  y [BRC-002](/knowledge-base/business/rules/BRC-002-gobierno-publicacion-modelo-semantico.md).

## Revisión efectuada y diferencias pendientes

Consultados proyecto, sistema visual y metadatos de las cuatro pantallas. Capturas
desktop de las cuatro vistas inspeccionadas; HTML consultado para etiquetas y
comportamientos declarados. No son pruebas funcionales de una aplicación.

La corrección de creación sí aparece en captura/HTML descargables. Para listado y
detalle, Stitch informó correcciones mediante operaciones DOM, pero una nueva
lectura del HTML descargable no las refleja todavía. No se declaran verificadas:

| Vista | Diferencia observada en exportación | Tratamiento requerido antes de implementar |
|---|---|---|
| Listado | Exportar y KPI Margen bruto en Ventas comercial | Retirar Exportar de esta entrega y alinear ejemplo a Ticket promedio. |
| Listado/detalle | Snapshot inmutable como etiqueta del borrador actual | Usar captura estable/guardada y actualización explícita; sólo versiones anteriores se preservan intactas. |
| Detalle | Falta descripción de umbral / umbral de alerta | Sustituir por descripción técnica pendiente; no hay requisito de umbral aprobado. |
| Comparación | Checkbox de declaración aparece marcado inicialmente | Revisar interacción con usuario; no interpretar estado del mockup como aprobación humana. La actualización exige acción explícita. |

Volver a consultar captura y HTML exactos al resolver estas diferencias. Si siguen
sin coincidir, solicitar decisión antes de apartarse del diseño, conforme AGENTS.md.
No se autoriza implementación silenciosa de los elementos accidentales del mockup.

Las diferencias de esta tabla quedan autorizadas por UX-US004-D01 para corregirse
en código, sin esperar a que el export de Stitch refleje sus operaciones DOM.

## Cobertura y siguiente paso

Cuatro vistas principales desktop generadas, no aplicación implementada. Variantes
móvil, vacío detallado, error, permisos y conflicto no se han generado individualmente;
la adaptación responsive y accesibilidad deberán diseñarse y verificarse.
La variante Entre versiones guardadas se ofrece como modo, pero aún no tiene una
pantalla propia generada. El resumen textual de Stitch también propone profundizar
esa comparación, la confirmación de guardado y la resolución de conflictos; son
sugerencias, no alcance adicional aprobado ni trabajo ya realizado.

Revisar pantallas, resolver diferencias de exportación y aprobar referencias
visuales antes de implementación. Contratos y plan detallado siguen pendientes.
Sin cambios de código, bases, secretos ni servicios del usuario.

Plan detallado preparado: [primera entrega US-004](/docs/superpowers/plans/2026-10-17-us-004-model-versions-plan.md).
Contratos propuestos [API-004](/knowledge-base/design/api-contracts/API-004-semantic-model-drafts.md)
y [DM-004](/knowledge-base/design/data-models/DM-004-semantic-model-drafts.md),
REQUIRES_REVIEW. El plan y sus decisiones técnicas requieren revisión antes de ejecutar.
