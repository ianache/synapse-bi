---
title: US-003 — Decisiones de alcance del editor semántico
status: draft
date: 2026-10-16
sources:
  - id: US-003
    resource: /knowledge-base/requirements/user-stories/US-003-definir-elementos-semanticos.md
---

# US-003 — Decisiones de alcance

## SEM-US003-D01 — Editor configurable, ejemplos separados

Confirmada por el usuario el 2026-10-16 en esta conversación.

Evidencia: el usuario preguntó «Dominios como Ventas o los KPI entiendo son solo
ejemplos y luego puedo definir mis propios dominios y KPI?». Se aclaró que el
alcance sería un editor configurable y el usuario respondió «conforme. Proceguir».

Alcance confirmado:

- El usuario puede crear sus propios dominios y KPI; agregar una definición no
  requiere modificar código del producto.
- Ventas e Ingresos netos son ejemplos de laboratorio, no dominios/KPI fijos ni
  definiciones empresariales impuestas.
- El recorrido contempla asociar datasets y definir dimensiones, medidas y
  atributos de KPI (nombre, definición, fórmula, unidad, grano, filtros, responsables).
- US-003 documenta y conserva definiciones. Publicación y cálculo corresponden a
  US-004/005 y a las operaciones que posteriormente soporte el motor; una fórmula
  declarada no implica ejecución de SQL o código arbitrario.
- Los ejemplos se distinguen de las definiciones creadas por el usuario y no las
  reemplazan ni sobrescriben automáticamente.

La conformidad confirma ese alcance funcional, no aprueba un diseño técnico,
especificación escrita, plan inexistente, políticas de publicación, identidad
nominal de owners/aprobadores ni permisos productivos.

## SEM-US003-D02 — Borrador de KPI con metadatos incompletos

Confirmada por el usuario el 2026-10-16 en esta conversación. Evidencia:
respuesta «si» a permitir guardar un KPI con nombre y dominio aunque falten
fórmula, unidad, grano o responsable, mostrando pendientes y validando las
referencias declaradas.

- Nombre y dominio son requisitos mínimos de guardado del borrador de KPI.
- Fórmula, unidad, grano y responsable pueden faltar; la interfaz debe señalar
  esos pendientes sin inventar valores para completarlos.
- Una referencia declarada debe existir y estar autorizada, también en borrador.
  Esta decisión no obliga a declarar un dataset o componente aún ausente.
- Guardar no valida significado ni publica, certifica o ejecuta la definición.
- Esta decisión se refiere a borradores de KPI. No aprueba automáticamente las
  reglas de creación de dominios, dimensiones, medidas, entidades o relaciones.

No cierra la política de publicación de US-004 ni designa aprobadores.

## SEM-US003-D03 — Catálogo de elementos reutilizables

Confirmada por el usuario el 2026-10-16 en esta conversación. Evidencia:
respuesta «si» a aprobar un catálogo de dominios, dimensiones, medidas y KPI
reutilizables como base del diseño de US-003.

- Dominios creados por el usuario agrupan sus definiciones.
- Dimensiones y medidas se administran como componentes independientes.
- Varios KPI pueden referenciar componentes compartidos, sin duplicarlos por
  defecto dentro de cada definición.
- Los KPI conservan su significado de negocio y referencias explícitas.
- Los cambios de componentes compartidos deben controlarse para no alterar
  otras definiciones silenciosamente.

La decisión elige la organización funcional. No aprueba todavía la política
concreta de edición/copia, permisos, persistencia, endpoints ni una especificación
o plan de implementación aún no revisados.

## SEM-US003-D04 — Integridad de borradores y edición segura

Confirmada por el usuario el 2026-10-16 en esta conversación: respuesta «si» a
las reglas presentadas sobre requisitos mínimos, referencias y protección de
dimensiones/medidas utilizadas por KPI.

- Un dominio requiere nombre; una dimensión o medida requiere nombre y dominio.
  El mapeo a datos puede quedar pendiente como borrador.
- Las referencias declaradas deben existir y estar autorizadas. El KPI muestra
  también los pendientes de sus componentes.
- Una dimensión o medida utilizada por algún KPI no admite modificación directa.
  Para cambiarla se crea una copia y se elige explícitamente qué KPI actualizar;
  los otros KPI conservan su definición anterior.
- La copia no se propaga ni sobrescribe la definición original. Esta protección
  no adelanta el ciclo de publicación/versionado de modelos de US-004.

La aprobación alcanza estas reglas funcionales, no una matriz de permisos,
contrato API o plan todavía no revisados.

## SEM-US003-D05 — Relaciones aceptadas e incorporación de Dominio

Confirmada por el usuario el 2026-10-16 en esta conversación. Evidencia literal:
«IM2-Q1: si, incorporar. R-01: si, R-02: si, R-03: si, R-04: si,
R-05: si, R-06: si, R-07: si, R-08: si».

- Incorporar Dominio al glosario (IM2-Q1). La definición que se redacte permanece
  en borrador hasta su revisión; esta respuesta no aprueba un texto aún no presentado.
- Aceptar R-01 y R-02 de IMD-002: cada dimensión/medida pertenece a un dominio;
  un dominio puede agrupar cero o varios componentes de cada tipo (1 : 0..N).
- Aceptar R-03 y R-04: cada dimensión/medida puede declarar cero o un dataset;
  un dataset puede ser procedencia de varios componentes (0..N : 0..1).
- Aceptar R-05 y R-06: un componente puede originar cero o varias copias; cada
  copia tiene como máximo un origen (0..1 : 0..N).
- Aceptar R-07 y R-08: las definiciones de KPI y los componentes reutilizables
  admiten referencias muchos a muchos, opcionales en borrador (0..N : 0..N).

Se aceptan existencia y cardinalidad de las ocho relaciones para el incremento
local. Las anteriores inferencias de cardinalidad quedan resueltas (IM2-Q2);
no se impone esta simplificación como modelo empresarial universal. La respuesta
no aprueba el diseño escrito completo, permisos, contrato API, persistencia,
criterios adicionales de completitud ni un plan de implementación.

## SEM-US003-D06 — Conformidad con diseño/plan y ejecución nativa

El 2026-10-16, tras presentar el estado, los pendientes de aprobación del diseño
y plan y recomendar ejecución nativa con revisión independiente final, el usuario
respondió «conforme». Se registra conformidad local con ese recorrido y método.

El diseño escrito enlazado y el plan son la base de T1: primer corte sin entidades
generales/jerarquías, completitud documental, fórmula textual sin ejecutar,
componentes del mismo dominio, mapeo dataset/columna, protección tras primer uso
incluso al retirar referencias, copia sin propagación, vínculo histórico y sin
borrado. Gestión local propuesta para data-admin/other-data-admin; no se concede
por ello autorización productiva ni un owner nominal.

Esta conformidad no aprueba contratos API-003/DM-003 ni pantallas que todavía no
se habían preparado. Se elaboran en T1 para revisión antes de T2. No se declara
validación formal del glosario ni se inventa identidad de verificador.

## SEM-US003-D07 — Ejecutar incremento local y usar worktree aislado

El usuario pidió «continuar con la implementacion», después de presentar API-003,
DM-003 y UX. Autoriza su desarrollo local como base del incremento, con revisión
independiente al cierre; no se declara aprobación empresarial o verificación nominal.
Ante consulta explícita sobre aislamiento eligió «Crear un worktree aislado».

Rama feat/us-003-semantic-catalog, directorio .worktrees/us-003-semantic-catalog.
Los formularios visuales pendientes se completan en paralelo antes del desarrollo
UI; no se interpreta la orden como evidencia de que ya existen o están probados.

## Pendientes restantes tras D06

Contratos técnicos y pantallas de T1 requieren revisión. Definición/responsable de
Dominio (GQ-05), entidades generales (GQ-03) y autoridad productiva siguen abiertos.
La lista siguiente conserva el contexto de descubrimiento previo: las propuestas
funcionales del diseño quedan aceptadas localmente por D06, no se reabren.

## Decisiones del descubrimiento previo (antes de D06)

- Detalle de completitud y atributos adicionales de cada elemento; los mínimos
  de creación ya están aprobados en SEM-US003-D02/D04.
- Alcance de entidades/relaciones en el primer corte y criterio de entidad (GQ-03).
- Roles, validación de significado, representación de fórmulas y referencias.
- Mecánica de copia, concurrencia y presentación de dependencias para aplicar D04.
- Diseño UX, contrato API, persistencia y plan de implementación.

Alternativas de organización comparadas en brainstorming:

1. Catálogo reutilizable de dominios, dimensiones, medidas y KPI — recomendado:
   componentes independientes y referencias explícitas; requiere gestionar sus
   dependencias y evitar que una edición cambie el significado sin advertencia.
2. Dimensiones/medidas embebidas en cada KPI — menor gestión inicial; facilita
   duplicados y futuras divergencias de significado entre KPI.
3. Editor gráfico general con entidades, relaciones y jerarquías — mayor alcance
   de modelado; añade complejidad y depende de resolver GQ-03.

El usuario eligió la opción 1 en SEM-US003-D03. Las opciones 2 y 3 no son el
enfoque seleccionado para el primer incremento. No se ha iniciado implementación.

## Registro de la propuesta de integridad

Las reglas presentadas y aceptadas se resumen en SEM-US003-D04. El detalle
adicional de implementación sigue sujeto a revisión del diseño escrito:

- Dominios: nombre obligatorio; dimensiones/medidas: nombre y dominio, con
  descripción y mapeo físico opcionales mientras estén en borrador. No inferir
  significado ni grano de claves técnicas.
- Toda referencia declarada debe existir, pertenecer al alcance autorizado y ser
  compatible con el tipo de elemento. Una ausencia permitida no es una referencia rota.
- Mostrar dependencias y faltantes de componentes junto al KPI que los utiliza;
  un KPI no se presenta como listo si depende de un componente incompleto.
- Regla aceptada de edición segura: una dimensión o medida referenciada no se
  modifica directamente; se crea una copia y el usuario elige explícitamente
  qué KPI editar para apuntar a ella. No propagar cambios automáticamente ni
  sobrescribir la definición anterior. La publicación/versionado del modelo
  sigue fuera de este incremento (US-004).
- Preservar aislamiento por tenant y separar responsable declarado de permiso
  para editar. El mapeo de roles/scopes requiere diseño y aprobación posteriores.

## Diseño escrito para revisión

[US-003 — Catálogo semántico configurable](../../superpowers/specs/2026-10-16-us-003-semantic-catalog-design.md)
consolida el diseño. Su conformidad local posterior y la del plan se registran en
D06; no aprobar por ese hecho contratos o pantallas creados después.
