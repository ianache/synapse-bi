# Mandato de implementación de interfaces

- Apego fiel al diseño de Google Stitch: las pantallas indicadas o aprobadas por el usuario son la referencia visual obligatoria, no una inspiración opcional.
- Antes de implementar, consultar la captura y el HTML de la pantalla exacta. Conservar composición, jerarquía, navegación, tipografía, colores, espaciados, densidad, iconografía y estados. No sustituir el diseño por tablas o formularios genéricos.
- Reutilizar los componentes existentes sin perder fidelidad visual. Adaptar responsive y accesibilidad sin alterar arbitrariamente la composición desktop.
- No copiar datos sintéticos del mockup a los datos reales ni inventar contadores, permisos, estados o funciones. Los controles deben tener comportamiento real; los no implementados deben identificarse como no disponibles.
- Ante una incompatibilidad entre el mockup y las reglas aprobadas, seguridad o contratos, documentarla y solicitar decisión antes de desviarse. No cambiar silenciosamente ninguna de las dos referencias.
- El cierre requiere pruebas funcionales y comparación visual de capturas reales con Stitch, en desktop y móvil, documentando diferencias pendientes. Pruebas funcionales aprobadas no demuestran conformidad visual. No declarar fidelidad exacta sin evidencia.
- Referencia de `/catalogo-semantico`: https://stitch.withgoogle.com/projects/4378861557064448535?node-id=52fd5fb8a6254ff4bf1165579309bc9e
- Referencia de `/datasets`: https://stitch.withgoogle.com/projects/4378861557064448535?node-id=725195c5c57a461d8db992a49f6afc5d. Conservar la separación aprobada entre registro (borrador/registrado) y completitud (completo/incompleto).
- Referencias de `/datasets/nuevo`: origen `ef64675d43b048c0a7ffd9d08a218fd7` y metadatos `7e6873489b214335aa81c7be53720410` del mismo proyecto. El usuario confirmó dos pasos, clasificación libre declarada e identificadores asignados por el sistema; no copiar el texto contradictorio «paso 2 de 4» ni inventar taxonomías.

## CodeGraph

Si existe `.codegraph/`, usar CodeGraph antes de buscar o leer código para comprenderlo. Si no existe, no indexar automáticamente. `/graphify` requiere la habilidad graphify.
