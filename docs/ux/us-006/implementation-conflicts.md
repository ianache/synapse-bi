# US-006 — Conflictos previos a implementación

Estado: decisión humana registrada. Fuente visual: pantallas Stitch aprobadas en `README.md`; reglas: RCP-003 §10. El usuario respondió «autorizado» a implementar la composición aprobada y corregir únicamente los textos y controles contradictorios enumerados. No autoriza funciones adicionales ni altera las reglas de acceso.

1. La pantalla de sin datos/error muestra Exportar, crecimiento `+3.2%` y diagnóstico técnico/linaje ficticio. Exportación no está aprobada y datos o estados no evaluados no deben inventarse.
2. La pantalla de invitado sin KPI muestra «Últimos 30 días», filtro Segmento y acción «Contactar al propietario», aunque se acordaron rango explícito, fecha/canal y no se aprobó esa acción.
3. La pantalla de acceso no disponible afirma revocación inmediata; se acordó verificar en la siguiente solicitud o recarga. Además, un mensaje específico de revocación puede revelar información sobre el recurso.
4. Stitch informó correcciones para estas tres pantallas, pero los HTML recuperados siguen conteniendo los textos anteriores. No se dispone de una referencia exportada corregida verificada.
5. La pantalla de gestión corregida muestra controles recortados en la captura; la composición y los textos que no contradicen reglas permanecen sujetos a fidelidad visual.

Decisión solicitada: autorizar expresamente implementar la composición aprobada de Stitch, pero sustituir/omitir únicamente los contenidos y controles enumerados que contradicen las reglas, utilizando los comportamientos acordados en RCP-003. Alternativamente, corregir y aprobar nuevos exportes Stitch antes de implementar. La elección no autoriza funciones adicionales ni cambia las reglas de acceso.

Hallazgo de implementación que debe abordarse en el diseño: el backend actual usa `shared=1` como visibilidad para todo el tenant y devuelve todos los identificadores de widgets. Esto no implementa la compartición con personas concretas ni el filtrado de KPI por consumidor. Requiere diseño y pruebas de permisos, migración compatible y revocación; no se debe presentar el comportamiento existente como conforme.
