# Menubar y Mainbar reutilizables — diseño

Fecha: 2026-10-18. Especificación escrita **aprobada por el usuario** mediante
«conforme» después de su entrega (commit `043010e`). Previamente confirmó Mainbar
de una fila, 64 px en escritorio y sin búsqueda. La aprobación de esta especificación
no se atribuye al futuro plan ni como evidencia de implementación.

## 1. Objetivo y límites

Implementar dos organismos React en `@bi-analytics/design-system` y utilizarlos
como navegación común de las páginas operativas existentes. Preservar sus rutas,
contenido, acciones de negocio, permisos y persistencia. Evitar versiones visuales
distintas del menú y cabecera por módulo.

No se introduce Angular, otro router, otro framework CSS ni MicroUIs independientes.
Tampoco nuevas APIs, autenticación, consultas SQL/US-005, publicación US-004,
notificaciones, filtros globales, cambio de tenant o selector de roles funcionales.
Los componentes visuales no consultan servicios ni almacenan credenciales.

## 2. Fuentes y precedencia visual

- [Referencia Stitch](https://stitch.withgoogle.com/projects/4378861557064448535?node-id=5bc81890512745cfa93a1fcadf2bd4a0):
  «Kit de Componentes - Atomic Design (Completo)», proyecto `4378861557064448535`.
- Exportación actualizada inspeccionada: HTML `14317538571573095280`, captura
  `7272703772481844155`. La exportación previa mostraba Mainbar de dos filas.
- Confirmación humana posterior al ajuste: una fila, 64 px desktop y sin búsqueda.
- Mandato visual de `AGENTS.md`: consultar captura y HTML exactos antes de
  implementar; contrastar capturas reales desktop/móvil; no inventar datos.

Precedencia: decisión humana explícita > organismo actualizado > blueprint para
dimensiones/capas compatibles. El slot de búsqueda residual del blueprint no se
implementa. La altura de 64 px se fija aunque el HTML del organismo sólo use padding.
Para la navegación global esta referencia sustituye las barras de los anteriores
mockups por página; sus formularios, tablas, avisos y acciones internas se conservan.

## 3. Situación existente y alternativa elegida

`SynapseShell.tsx` contiene marca, navegación, tenant, breadcrumbs y perfil con
variantes por módulo. CSS de KPI, datasets, catálogo y modelos redefine esas barras.
En la librería, `Sidebar` y `TopBar` sólo envuelven hijos; `DashboardLayout` los usa
en `/dashboard`. Las demás vistas operativas usan `SynapseShell`.

Alternativas: añadir otras variantes por página mantendría duplicación; modificar
las firmas de `Sidebar`/`TopBar` rompería consumidores. Se elige añadir organismos
con contratos propios, componerlos desde los layouts y conservar los exports y
firmas anteriores. La navegación es infraestructura compartida del frontend,
no un dominio desplegable separado.

## 4. Catálogo y composición

| ID | Componente | Nivel | Responsabilidad |
|---|---|---|---|
| CMP-ORG-MENUBAR-001 | `Menubar` | Organismo | Marca, grupos de enlaces, acción rápida y pie de organización |
| CMP-ORG-MAINBAR-001 | `Mainbar` | Organismo | Breadcrumbs, acciones de utilidad y perfil |

Componen átomos existentes y moléculas internas de navegación/breadcrumb/perfil.
Sólo se extraen moléculas públicas adicionales si hay reutilización demostrable.
Dirección: páginas → shell/layout → organismos → moléculas/átomos. Ningún organismo
importa páginas, repositorios ni entidades de negocio.

### Menubar: contrato propuesto

Exportar `Menubar`, `MenubarProps` y sus tipos desde el entry point existente.

```ts
type NavigationItem = {
  id: string; label: string; icon?: IconName;
} & (
  | { href: string; unavailableReason?: never }
  | { href?: never; unavailableReason: string }
);
type NavigationGroup = { id: string; label: string; items: NavigationItem[] };
type ShellAction = {
  id: string; label: string; icon?: IconName;
} & (
  | { onAction: () => void; unavailableReason?: never }
  | { onAction?: never; unavailableReason: string }
);
type MenubarProps = {
  id: string;
  brand: { label: string; subtitle?: string; badge?: string; href: string };
  groups: NavigationGroup[];
  activeItemId?: string;
  quickAction?: ShellAction;
  utilityActions?: ShellAction[];
  organization?: { name: string; description?: string };
  mobileOpen: boolean;
  onMobileClose: () => void;
  onNavigate?: (href: string) => void;
  className?: string;
};
```

Usar `aside` y `nav` con nombres accesibles, no `role="menubar"`: son enlaces de
navegación de sitio, no un menú de aplicación con teclas de flecha. Los enlaces
conservan `href`, apertura en nueva pestaña y clic modificado; `onNavigate` sólo
intercepta navegación interna ordinaria. El elemento activo usa `aria-current="page"`.
Sin elemento activo no se selecciona uno ficticio. IDs estables y únicos.
Los destinos no implementados no reciben rutas inventadas ni enlaces `#`.

### Mainbar: contrato propuesto

Exportar `Mainbar`, `MainbarProps` y tipos desde el mismo paquete.

```ts
type BreadcrumbItem = { id: string; label: string; href?: string };
type MainbarProps = {
  breadcrumbs: BreadcrumbItem[];
  actions?: ShellAction[];
  profile?: {
    name: string; description?: string; initials?: string;
    onAction?: () => void; unavailableReason?: string;
  };
  menubarId: string;
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  onNavigate?: (href: string) => void;
  className?: string;
};
```

`header` con `nav aria-label="Ruta de navegación"`, lista ordenada y ubicación
actual marcada. No fabricar enlaces para niveles sin ruta. Breadcrumbs suministrados
como elementos, nunca dividir nombres de usuario/entidad por `/`. El toggle móvil
usa `aria-controls` y `aria-expanded`. Sin perfil, mostrar estado neutral «Perfil
no disponible», sin avatar o rol inventados. Sin callbacks, las utilidades y el
perfil no se presentan como desplegables operativos.

## 5. Contrato visual y responsive

- Menubar: 256 px (16 rem), fondo `#111827`, textos neutros claros, activo y CTA
  `#991b1b`, hover `#7f1d1d`. Marca con isotipo, etiqueta Enterprise y subtítulo;
  grupos General y Gobernanza & Semántica; utilidades y organización al pie.
- Mainbar: fondo blanco, borde neutro, sombra sutil; 64 px incluyendo borde/padding
  en escritorio a zoom normal; una fila, breadcrumbs a la izquierda y utilidades/
  separador/perfil a la derecha. Sin búsqueda, atajo de búsqueda ni badges de entorno
  en la cabecera. Los avisos de laboratorio propios de cada página permanecen en
  su contenido, no se transforman en supuestas certificaciones.
- Conservar Hanken Grotesk/Plus Jakarta Sans y los tamaños/espaciados del HTML.
  Reutilizar las fuentes locales existentes y su licencia; evitar dependencia de CDN
  y mover los assets compartidos al paquete si es necesario sin duplicarlos.
- Iconografía equivalente en forma, peso, tamaño y alineación a Stitch. Reutilizar
  o extender el sistema SVG existente; no introducir FontAwesome/CDN sólo por la
  exportación. Documentar cualquier diferencia visible antes del cierre.
- Capas base: Menubar30, Mainbar20, barras de acciones de página10. Drawer y
  backdrop por encima de la cabecera; nunca sobre modales de negocio activos.
- Desde 1024 px: lateral persistente, contenido flexible `min-width:0`, cabecera
  sticky sin cubrir anclas/foco. El menú tiene scroll interno si no cabe en altura.
- Por debajo de 1024 px: Menubar cerrado inicialmente, abre como drawer mediante
  hamburguesa. Cerrar con Escape, botón, backdrop o navegación; atrapar foco,
  bloquear scroll de fondo y devolver foco al activador cuando corresponda.
  El shell/layout mantiene el estado abierto; Menubar gestiona el foco del drawer
  y solicita cierre con su callback. Al pasar a escritorio se libera scroll/foco
  modal y el shell restablece el estado cerrado para la siguiente entrada móvil.
- En móvil ocultar nombre/descripción del perfil, conservar avatar y acciones.
  Breadcrumbs de una línea con scroll interno accesible, sin scroll horizontal
  del documento ni solapamiento con acciones; no inventar un dropdown de breadcrumb.
- Zoom/reflow y textos largos no se recortan de forma inaccesible: permitir
  crecimiento de altura cuando sea necesario por accesibilidad. No imponer 64 px
  a costa de perder contenido con texto ampliado.
- Reducir/eliminar animaciones con `prefers-reduced-motion`. El punto activo es
  decorativo; no mostrar puntos de notificación o salud sin información real.

## 6. Estados, datos y seguridad

La aplicación configura etiquetas, enlaces, estado activo, perfil y organización.
La librería no conoce `window.location` ni infiere roles por la ruta. El shell
compone datos de sesión existentes cuando estén disponibles; si no, declara
explícitamente el contexto de demostración o falta de información. No atribuir
identidad/empresa del mockup a usuarios reales ni ampliar permisos.

Nueva consulta, notificaciones, filtros globales, ayuda, configuración, selector
de tenant/perfil, glosario y lineage sólo son interactivos si tienen implementación
real. En la aplicación actual, los no implementados estarán deshabilitados o
marcados «no disponible», con nombre accesible y explicación asociada. Sin eventos
que aparenten haber guardado, filtrado o cambiado sesión. La API sigue siendo
la autoridad de autorización; ocultar/deshabilitar enlaces no la sustituye.

Los componentes son presentacionales: una falla de carga del contenido no desmonta
la navegación. No necesitan estado remoto loading/error/offline propio; la ausencia
de configuración produce elementos omitidos o fallback neutral, no errores de red.
No cambiar la lógica de reintentos o recuperación de las páginas existentes.

## 7. Integración y compatibilidad

| Consumidor | Aplicación |
|---|---|
| `SynapseShell` | Componer ambos organismos; conservar props `active`, `breadcrumb`, `children` y utilidades `AppLink`/`navigate`; añadir datos estructurados de breadcrumb cuando la ruta lo requiera |
| KPI y dashboards | Inicio, explorar, añadir KPI y dashboards bajo la navegación común |
| Fuentes | Lista, creación y detalle sin alterar conectores ni credenciales |
| Datasets | Lista, registro de dos pasos, edición y detalle |
| Catálogo | Dominios, componentes y KPI existentes |
| Modelos | Lista, creación, detalle, historial y comparación |
| `DashboardLayout` y `/dashboard` | Adoptar organismos preservando `navigation`, `onNavigate`, `children`; configuración adicional opcional |
| Storybook y `/componentes` | Ejemplos aislados de ambos organismos y composición, con datos de demostración identificados |
| `/login` | Mantener layout de autenticación sin barras |

Retirar sólo reglas antiguas de las barras que entren en conflicto: no reestilizar
tablas, formularios, avisos, paneles ni pie de acciones. Estilos propios con prefijo
de librería para impedir que `.synapse-semantic`/`.synapse-models` cambien el organismo.
Mantener `Sidebar`/`TopBar` y sus contratos; no eliminarlos ni imponerles nuevas props.
La composición de `DashboardLayout` cambia visualmente de forma intencional, sin
romper su API. La adición de exports es candidata a minor (0.2.0), sin publicación
NPM ni cambio de versión automático; el paquete sigue siendo workspace privado.

## 8. Verificación y aceptación

1. Pruebas unitarias de contratos/exports, enlaces, activo, callbacks, clics
   modificados, breadcrumbs sin ruta y estados ausentes/no disponibles.
2. Interacción de drawer: abrir/cerrar, Escape, foco, scroll, navegación, cambio
   de breakpoint y desmontaje con limpieza de listeners/estilos.
3. Storybook: Menubar con cada grupo/activo, Mainbar con ruta corta/larga,
   perfil ausente, utilidades deshabilitadas, móvil y composición completa.
4. Regresión de navegación de todas las familias de rutas; una sola cabecera y
   navegación global por vista, enlace activo correcto y login sin barras.
5. Typecheck, suite frontend completa, build de aplicación y Storybook. No
   modificar backend/base de datos para estas verificaciones.
6. Navegador: 1440 px y 390 px, además de frontera1023/1024 y reflow320/texto
   ampliado; axe, teclado, foco visible, ausencia de overflow de documento y
   conservación de formularios/barras de acción. Mínimo WCAG2.2AA aplicable.
7. Contrastar capturas reales de los dos organismos y páginas representativas
   con la referencia exacta actualizada de Stitch. Registrar diferencias y
   decisiones; pruebas funcionales verdes no equivalen a fidelidad visual.

Para cerrar: todos los consumidores previstos utilizan los organismos exportados,
los controles operativos funcionan y los restantes son honestamente no disponibles,
no hay regresiones funcionales/visuales conocidas sin resolver y la evidencia está
registrada. La aprobación humana visual no se atribuye automáticamente.

## 9. Entrega y siguiente autorización

Este documento especifica el cambio; todavía no se ha implementado. Tras revisión
y aprobación escrita, preparar el plan con archivos, TDD, aislamiento y evidencia.
No reiniciar servicios, migrar DB, publicar NPM, integrar ramas, hacer push ni
limpiar worktrees como efecto de aprobar este diseño. Conservar cambios ajenos y
los junctions/evidencias existentes. El usuario elegirá la ejecución del plan.
