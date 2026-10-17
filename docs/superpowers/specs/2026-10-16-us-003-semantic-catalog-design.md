# US-003 — Catálogo semántico configurable: diseño para revisión

Fecha: 2026-10-16 (America/Lima). Estado: **conformidad local registrada en D06**.
Originalmente propuesto para revisión. Actualización SEM-US003-D06: conformidad local
del usuario con este diseño, el plan y ejecución nativa con revisión independiente
final. Las secciones tituladas propuesta documentan la procedencia original;
API-003/DM-003 y pantallas nuevas siguen sujetos a revisión propia. No hay producto implementado.

## 1. Intención y criterio de éxito

Actualización 2026-10-17: incremento local implementado por D07 en rama aislada;
la mención inicial «no hay producto implementado» describe el momento de D06.
Pruebas finales y revisión resuelta en docs/ux/us-003/README.md. No se declara
completa la historia madre ni se añaden publicación/cálculo o gobierno productivo.

Permitir crear dominios y definiciones semánticas propias sin cambiar código,
reutilizando dimensiones/medidas y conservando procedencia técnica. El usuario
puede guardar una idea incompleta, recuperarla y completarla; la interfaz distingue
presencia de documentación, validación de significado y disponibilidad para cálculo.

El incremento termina cuando un usuario autorizado crea un dominio personalizado,
una dimensión y una medida, los referencia desde dos KPI, recupera sus borradores
y cambia un KPI a una copia sin alterar al otro. Ventas no es requisito ni valor fijo.

## 2. Fuentes y decisiones confirmadas

- [US-003](../../../knowledge-base/requirements/user-stories/US-003-definir-elementos-semanticos.md), historia madre, aún CONDITIONAL.
- [RCP-002](../../../knowledge-base/requirements/context-packs/RCP-002-us-003-definicion-semantica.md), evidencia y vacíos.
- [SEM-US003-D01–D05](../../ux/us-003/decisions.md): editor configurable, borradores
  incompletos, catálogo reutilizable, integridad/copia y relaciones/cardinalidades aceptadas.
- [IMD-002](../../../knowledge-base/business/information-model/IMD-002-catalogo-semantico.md), modelo conceptual con R-01 a R-08 aceptadas para el incremento local.
- [Dominio — TRM-0024](../../../knowledge-base/business/glossary/terms/TRM-0024-dominio.md), incorporación autorizada; definición en borrador.
- [Caso de estudio](../../../codebase/case-study/README.md), sólo ejemplos sintéticos.

Las decisiones aceptadas son: nombre de dominio obligatorio; dimensión/medida con
nombre y dominio y mapeo opcional; KPI con nombre y dominio y otros campos faltantes
visibles; referencias existentes/autorizadas; componente usado no editable directamente,
copia y actualización explícita de cada KPI. Guardar no publica ni calcula.

## 3. Alcance del primer corte propuesto

Incluye catálogos de dominios, dimensiones, medidas y KPI; crear, listar, abrir y
editar los elementos permitidos; copiar dimensiones/medidas; ver dependencias y
faltantes; declarar procedencia desde datasets/columnas de US-002. No requiere
conexiones nuevas ni lee filas de negocio al guardar.

Propuesta: todos los elementos semánticos de este corte permanecen como borradores,
incluso completos. No se añade una acción que los convierta en «aprobados» o «publicados».
La completitud se calcula por separado y nunca se presenta como validación matemática.

No incluye entidades/relaciones genéricas, jerarquías arbitrarias, editor gráfico,
publicación, aprobación, cálculo/SQL, IA, cambios en Gold, ni sustitución del catálogo
KPI sintético existente. Es un corte de US-003, no su cumplimiento íntegro: GQ-03
y las partes restantes de la historia madre siguen abiertas.

## 4. Organización y documentación propuesta

| Elemento | Mínimo confirmado | Información propuesta que puede quedar pendiente |
| --- | --- | --- |
| Dominio | Nombre | Descripción, owner declarado |
| Dimensión | Nombre y dominio | Definición, grano, dataset/columna y sinónimos |
| Medida | Nombre y dominio | Definición, grano, unidad, agregación declarada, dataset/columna y sinónimos |
| KPI | Nombre y dominio | Definición/propósito, fórmula, unidad/moneda, grano, dimensiones/medidas, filtros, nulos/devoluciones/datos tardíos, owner/steward, clasificación/acceso, vigencia y expectativas de frescura/calidad |

Confirmado en D05: cada dimensión/medida pertenece a un dominio; puede declarar
como máximo un dataset de procedencia y admite copias con un solo origen; las
referencias de KPI a dimensiones/medidas son muchos a muchos y pueden faltar.
Propuestas adicionales para limitar ambigüedad: un KPI referencia componentes de
su mismo dominio; el mapeo se restringe a un par dataset/columna en este corte.
El mapeo puede faltar, pero si se declara se
envían ambos y, al crear o modificar el mapeo, la columna debe pertenecer a la
selección vigente del dataset. Las vinculaciones históricas se tratan como indica §7.
No se asume que un dataset registrado o completo tenga significado validado.

Nombres de dominio únicos dentro de la organización; nombres de componentes/KPI
únicos por dominio y tipo, normalizados como en US-002. Identidad independiente
del nombre, asignada por servidor. Los límites cuantitativos y DTO definitivos se
fijarán en el contrato antes de implementar, sin copiar límites empresariales no aprobados.

## 5. Borradores, completitud y fórmulas

Propuesta de completitud para este corte:

- Dominio: descripción y owner declarados.
- Dimensión: definición, grano y mapeo a datos declarado.
- Medida: definición, grano, unidad, agregación y mapeo declarados.
- KPI: los atributos de PRD §11.3; ausencia de medidas o dimensiones explícitas
  se muestra como pendiente en este primer corte. Sus componentes referenciados
  también deben estar completos para mostrar documentación completa.
- Una política explícita como «no aplica» es una declaración del usuario, no un
  placeholder insertado por el sistema ni una aprobación corporativa.

Una lista de componentes puede estar vacía en borrador. Si contiene referencias,
se valida existencia/tipo/alcance; no se acepta una referencia rota como faltante.
No se permiten KPI que referencien otros KPI ni medidas recursivas en este corte;
así no se introduce un grafo de dependencias cíclico.

La fórmula es **texto documentado**, no SQL, Python ni una expresión ejecutable.
Los componentes se seleccionan mediante referencias explícitas; escribir sus
nombres en el texto no crea lineage automáticamente. Se muestra «sin ejecutar»
y no se afirma comprobar sintaxis, unidad o corrección matemática. La futura
representación ejecutable corresponde al trabajo de US-005 y puede exigir evolución.

## 6. Copia y protección de consumidores

Una dimensión/medida nunca utilizada por un KPI puede editarse. Como detalle
propuesto para aplicar D04 sin ambigüedad, la primera referencia guardada la deja
protegida; retirar luego esa referencia no habilita modificar la definición anterior.
Se bloquea su actualización completa y se ofrecen ver consumidores y crear copia.
Esta protección también comprende metadatos y mapeos, sin excepciones implícitas.

Copiar crea un elemento independiente con nombre nuevo, mismo dominio por defecto,
procedencia de copia visible y sin consumidores. No cambia el original ni actualiza
KPI automáticamente. El usuario abre cada KPI que quiera cambiar y selecciona la
copia. Los KPI que no se editen conservan sus referencias anteriores.

La comprobación de consumidores y la escritura deben ser atómicas frente a la
creación/edición concurrente de un KPI. La UI no es el control de seguridad.
Propuesta: sin borrado de dominios/componentes/KPI en este primer corte; no se
inventan cascadas ni políticas de retención. El origen de copia no bloquea editar
una copia sin consumidores; es procedencia, no consumo semántico.

## 7. Datos externos y cambios posteriores

Los enlaces a datasets son del catálogo US-002, nunca parámetros de conexión.
Propuesta: conservar una copia técnica de la vinculación al guardarla e informar
si el dataset fue editado después. No reasociar automáticamente columnas.

Si una edición de dataset retira una columna seleccionada por un componente,
mostrar «vinculación desactualizada» y excluir esa dependencia de documentación
completa. Conservar la definición histórica para lectura; no simular que la columna
sigue seleccionada ni modificar el dataset de US-002. Para cambiar un componente
ya usado se sigue la regla de copia. Una operación que declare una vinculación nueva
o modificada debe validarla contra el dataset vigente.

Editar un KPI sin cambiar sus referencias no debe reemplazar silenciosamente sus
vinculaciones históricas; los avisos de cambio permanecen visibles. La política
de consumo de datos desactualizados se decide al abordar US-004/005, no aquí.

## 8. Integración técnica propuesta

Ampliación modular del backend Python y frontend existentes. Separar el catálogo
semántico del registro de datasets y del catálogo de KPI de demostración. Reutilizar
identidad, aislamiento por tenant, errores seguros, auditoría y patrones de persistencia.

No cambiar el ejecutor semántico actual ni introducir un servicio, dependencia,
motor o conector nuevo sin necesidad. Las credenciales y parámetros de fuentes
no forman parte de los objetos semánticos.

El contrato API y el modelo de persistencia se derivan de este diseño y de IMD-002:
deben fijar DTO, límites, operaciones, migración aditiva y backup/restore antes del
código. Las creaciones/copias requieren reintento idempotente; las ediciones,
control optimista de versión. Las lecturas de agregado/consumidores requieren
una vista consistente y las escrituras, transacción conjunta con auditoría.
La versión técnica evita sobrescrituras; no es publicación de modelo de US-004.

## 9. Autorización propuesta y datos sensibles

Separar permiso de lectura y gestión semántica; mantener tenant desde identidad
verificada, nunca desde formulario. En el laboratorio se propone habilitar gestión
únicamente para las personas locales data-admin/other-data-admin. No ampliar al
analista por defecto ni afirmar que esas personas representen a un aprobador empresarial.

Leer definiciones no revela credenciales ni filas. Vincular datasets requiere además
acceso a los metadatos correspondientes. Referencias ajenas se tratan como no visibles,
sin revelar nombres ni consumidores de otra organización. Owner/steward son datos
declarados, no una ACL. Scopes y matriz productiva requieren revisión del contrato.

## 10. Recorrido UX propuesto

1. Abrir catálogo semántico, crear un dominio propio y consultar sus elementos.
2. Crear una dimensión/medida por nombre; completar definición/mapeo cuando se conozcan.
3. Crear KPI, seleccionar dominio y componentes existentes; documentar fórmula y atributos.
4. Guardar borrador y recuperar ficha con faltantes propios/de dependencias.
5. Ver consumidores de una dimensión/medida. Si está usada, crear copia y cambiar
   explícitamente un KPI; comprobar que otro sigue referenciando el componente original.

Pantallas: catálogo por dominio/tipo, ficha/formulario de dominio, ficha/formulario
de componente, ficha/formulario de KPI y diálogo de copia/consumidores. Reutilizar
shell y sistema visual vigentes; los ejemplos no sustituyen respuestas de API.
Las pantallas concretas de Stitch se preparan después de revisión, no se consideran
generadas ni aprobadas aquí.

Carga, vacío, permiso denegado, almacenamiento no disponible, duplicado, conflicto de
versión, componente protegido y vinculación desactualizada son estados explícitos.
Errores conservan los cambios del formulario; un guardado que termina después de
abandonarlo no navega ni sobrescribe otra edición. Recarga tras conflicto requiere
confirmación y bloquea edición hasta terminar. Una acción pendiente no se duplica.

## 11. Verificación y entrega propuestas

- Crear dominios/KPI con nombres ajenos al laboratorio y recuperarlos tras reinicio.
- Guardar cada borrador mínimo permitido; mostrar faltantes sin falsos valores.
- Rechazar nombres vacíos, referencias inexistentes/ajenas o del tipo/dominio incorrectos.
- Reutilizar una medida en dos KPI; bloquear actualización directa; copiar y cambiar
  sólo uno; comprobar original y segundo KPI sin cambios.
- Retirar la última referencia de un componente ya utilizado y comprobar que su
  definición anterior sigue protegida; una copia nunca usada sí puede editarse.
- Intercalar edición de componente y alta de referencia para demostrar protección
  transaccional; verificar lectores consistentes y ediciones con versión obsoleta.
- Cambiar selección de dataset y verificar aviso de vinculación histórica sin reanclado.
- Perder respuesta de una creación/copia y reintentar sin duplicados; no perder cambios
  por navegación tardía, recarga concurrente o respuestas fuera de orden.
- Probar permisos/tenant en todas las operaciones, sin payloads/secretos en errores o logs.
- Probar migración aditiva y restore antes de usar una base valiosa; no borrar datos.
- Navegador en escritorio/móvil, teclado y axe; regresión de US-001/002 y KPI/dashboard
  sintéticos. No afirmar cálculos Gold ni certificación de accesibilidad completa.

Estas son pruebas a implementar/ejecutar, no resultados de una suite actual.

## 12. Revisión requerida y siguiente paso

El [plan de trabajo](../plans/2026-10-16-us-003-semantic-catalog-plan.md) y el diseño
recibieron conformidad local en D06. T1 exige revisión propia de API-003/DM-003/UX;
la conformidad anterior no aprueba contratos ni pantallas creados después.

Propuestas de §§3–9 aceptadas como base local en D06: primer corte sin entidades generales,
restricción de dominio/mapeo, criterios de completitud, fórmula textual, copia sin
propagación y protección tras el primer uso incluso retirando referencias,
ausencia de borrado, vinculación histórica y permisos locales.
D01–D05 no se vuelven a someter a decisión como si no estuvieran confirmadas;
la revisión restante no incluye volver a aprobar las cardinalidades R-01 a R-08.

Siguiente paso: revisar contratos API-003/DM-003 y UX preparados en T1 antes de
tocar producto. Método nativo con revisión independiente final confirmado en D06.
No se inventa owner, SLA ni aprobación productiva.

Revisión de consistencia del agente: se separaron decisiones/propuestas, se eliminó
la dependencia de nombres de ejemplo y se concretaron copias, referencias incompletas
y cambios de dataset. Las cardinalidades del modelo conceptual están aceptadas
en D05 para este incremento, sin generalización empresarial. Quedan revisión de
definición/responsable de Dominio (GQ-05) y detalle funcional de SEM-Q05.
