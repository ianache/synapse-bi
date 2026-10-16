# BI Analytics Frontend and Design System - Diseño

**Fecha:** 2026-10-15  
**Estado:** Diseño aprobado conversacionalmente; pendiente de revisión del documento  
**Producto:** BI Analytics Platform v1.1  
**Stack:** React + TypeScript + Vite + Storybook

## 1. Objetivo

Construir una aplicación frontend completa para BI Analytics Platform que incluya una librería reutilizable de componentes basada en Atomic Design y un Storybook que documente y valide sus componentes, estados y composiciones.

El primer incremento debe demostrar un flujo de análisis navegable sin depender todavía de un motor analítico o una API semántica definitiva. La aplicación usará adaptadores mock tipados que respeten los contratos previstos para la capa semántica.

## 2. Estructura del repositorio

```text
codebase/
├─ apps/
│  ├─ bi-analytics/
│  │  ├─ shell de aplicación
│  │  ├─ navegación y rutas
│  │  ├─ páginas de dashboard
│  │  ├─ layouts de análisis
│  │  └─ adaptadores de datos
│  └─ storybook/
│     └─ catálogo y documentación visual
├─ packages/
│  ├─ design-system/
│  │  ├─ atoms
│  │  ├─ molecules
│  │  ├─ organisms
│  │  ├─ templates
│  │  └─ patrones compartidos
│  ├─ tokens/
│  └─ config/
└─ package.json
```

La estructura debe mantenerse como monorepo. La aplicación consumirá el paquete `design-system`; Storybook consumirá el mismo paquete, no copias locales de componentes.

## 3. Arquitectura de responsabilidades

### `apps/bi-analytics`

- Composición del producto y rutas.
- Shell, navegación, layouts y páginas.
- Estado de features y coordinación de adaptadores.
- Datos mock y futuros adaptadores de Semantic API.
- No define componentes visuales reutilizables que deban vivir en la librería.

### `packages/design-system`

- Componentes visuales, eventos y estados de presentación.
- Componentes independientes de tenants, KPI concretos, APIs y motores.
- API pública tipada y estable.
- Stories, documentación y ejemplos de composición.

### `packages/tokens`

- Color, tipografía, spacing, radios, elevación, breakpoints y themes.
- Tokens consumibles por componentes y aplicación.
- Preparación para white-label/multi-brand sin fijar todavía una estrategia comercial.

### `packages/config`

- Configuración compartida de TypeScript, ESLint, testing y herramientas de build.

### `apps/storybook`

- Catálogo ejecutable de `design-system`.
- Stories por componente, estado, variante y composición.
- Documentación de uso, restricciones y accesibilidad.

## 4. Atomic Design

La librería se organiza en niveles progresivos:

- **Tokens:** decisiones visuales y temas.
- **Atoms:** `Button`, `Icon`, `Text`, `Badge`, `Input`, `Spinner`, `Divider`.
- **Molecules:** `SearchField`, `MetricValue`, `FilterField`, `DateRangePicker`, `StatusChip`.
- **Organisms:** `MetricCard`, `FilterBar`, `DataTable`, `ChartCard`, `Sidebar`, `TopBar`.
- **Templates:** `DashboardLayout`, `AnalysisWorkspace`, `DetailPageLayout`.
- **Patterns:** composición de dashboards, filtros, estados de carga/error/vacío y comportamiento responsive.

La taxonomía es estructural, no una obligación de convertir cada nivel en un paquete independiente. Los componentes deben ubicarse en el nivel que corresponda a su responsabilidad y composición.

## 5. Contratos de componentes

Los componentes reciben datos y callbacks mediante props tipadas. No conocen APIs de negocio ni acceden directamente a fuentes.

Ejemplo de contrato inicial:

```ts
type MetricCardProps = {
  label: string
  value: string | number
  unit?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  status?: 'positive' | 'warning' | 'negative' | 'neutral'
  loading?: boolean
  error?: string
}

type SemanticQueryState<T> = {
  data?: T
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  freshness?: string
  lineage?: LineageReference[]
}
```

Los tipos de dominio semántico podrán evolucionar, pero no deben filtrarse como dependencias innecesarias dentro de atoms o molecules.

## 6. Flujo de datos

```text
Mock / Semantic API adapter
        ↓
Feature hook o query adapter
        ↓
Estado de página
        ↓
Componentes de experiencia
        ↓
Atoms y tokens
```

El primer incremento usará mocks tipados. El adaptador futuro de Semantic API debe poder sustituirlos sin cambiar los contratos visuales ni la API pública del Design System.

## 7. Estados de experiencia

Las features y componentes relevantes deben representar explícitamente:

- `idle`: sin consulta iniciada.
- `loading`: carga inicial o refresh.
- `success`: datos disponibles.
- `empty`: consulta correcta sin resultados.
- `error`: fallo recuperable con reintento.
- `stale`: datos disponibles con freshness vencida.
- `unauthorized`: acceso no permitido.
- `disabled`: acción no disponible por estado o permisos.

Los estados se documentan en Storybook y se cubren con pruebas de interacción y accesibilidad.

## 8. Storybook

Storybook debe incluir:

- Stories de uso principal por componente.
- Controls para props.
- Documentación de tokens y themes.
- Ejemplos de composición Atomic Design.
- Variantes responsive.
- Casos de accesibilidad.
- Estados de carga, vacío, error y no autorizado.
- Ejemplos de dashboards y layouts completos.

## 9. Testing y Definition of Done

### Capas de testing

- Unit tests para utilidades y lógica de presentación.
- Component tests para interacción, eventos, estados y accesibilidad.
- Visual regression para componentes y composiciones críticas.
- Accessibility tests para roles, labels, foco, teclado y contraste.
- Contract tests para props públicas y compatibilidad.
- Smoke tests para navegación, dashboard inicial, filtros y estados principales.

### Definition of Done de un componente

1. Está exportado desde `packages/design-system`.
2. Tiene tipos públicos definidos.
3. Tiene story de uso principal.
4. Tiene stories de estados relevantes.
5. Tiene prueba de interacción.
6. Tiene validación de accesibilidad.
7. Tiene documentación de uso y restricciones.

## 10. Alcance del primer incremento

Incluye:

- Monorepo React/TypeScript/Vite.
- Shell navegable de BI Analytics.
- Tokens base y themes iniciales.
- Atoms y molecules fundamentales.
- Organisms iniciales: `MetricCard`, `FilterBar`, `DataTable` y `ChartCard`.
- `DashboardLayout` y una página dashboard de demostración.
- Mocks tipados de consulta semántica.
- Storybook con estados y documentación.
- Testing base y smoke test de navegación.

No incluye todavía:

- Motor OLAP, warehouse o API semántica real.
- Autenticación y autorización productivas.
- Persistencia de dashboards.
- Multi-tenancy operativo.
- Selección de una librería de charts concreta.
- Publicación externa del paquete.
- Implementación completa de ontologías, cubos o agentes IA.

## 11. Riesgos y decisiones abiertas

- Elegir estrategia de estilos y tokens sin bloquear theming futuro.
- Definir framework de charts después de validar los casos de uso iniciales.
- Definir ownership, contribución, versionado y deprecación del Design System.
- Confirmar alcance técnico de Claude Design, exportación de tokens e integración con código.
- Evitar que la app coloque lógica de negocio dentro de componentes reutilizables.
- Acordar métricas de accesibilidad, compatibilidad, cobertura y adopción; no se inventan objetivos numéricos.

## 12. Criterios de aceptación del diseño

- La aplicación arranca con React, TypeScript, Vite y Storybook.
- La aplicación consume componentes desde `packages/design-system`.
- Storybook y la aplicación comparten tokens y componentes.
- Existe una ruta de dashboard navegable con estados de carga, éxito, vacío y error.
- Los componentes no dependen directamente de APIs ni motores analíticos.
- Las stories documentan variantes y estados relevantes.
- Las pruebas cubren interacción, accesibilidad y smoke navigation.
- El mock puede sustituirse por un adaptador semántico sin modificar los componentes base.

## 13. Fuentes y trazabilidad

- [PRD.md](/intents/PRD.md), especialmente secciones 2, 4, 8, 14 y 17.
- [RCP-001](/knowledge-base/requirements/context-packs/RCP-001-bi-analytics-platform-v1-1.md).
- [ADR-017](/knowledge-base/architecture/ADR-017-capas-logicas-de-la-plataforma.md).
- [ADR-019](/knowledge-base/architecture/ADR-019-atomic-design-en-design-system.md).
- [ASR-006](/knowledge-base/architecture/asr/asr-fr-006-design-system-reusable.md).

## Revisión pendiente

Este documento refleja las tres secciones aprobadas conversacionalmente. Antes de iniciar implementación, el usuario debe revisar la especificación escrita y solicitar cambios o aprobarla explícitamente.
