import { describe, expect, it } from 'vitest'
import { buildPreparationBreadcrumbs } from './PreparationWorkspace'

describe('CDC workspace breadcrumbs', () => {
  it('shows a history parent and execution detail on run routes', () => {
    const trail = buildPreparationBreadcrumbs('/datasets/preparacion-cdc/ejecuciones/run-1')
    expect(trail.map(item => item.label)).toEqual(['Inicio', 'Datasets', 'Preparaci\u00f3n CDC', 'Historial de ejecuciones', 'Detalle de ejecuci\u00f3n'])
    expect('href' in trail[3] ? trail[3].href : undefined).toBe('/datasets/preparacion-cdc/ejecuciones')
  })

  it('uses the prepared dataset name and version hierarchy', () => {
    const trail = buildPreparationBreadcrumbs('/datasets/preparacion-cdc/datasets/dataset-1/versiones/version-2', 'Ventas preparadas')
    expect(trail.map(item => item.label)).toEqual(['Inicio', 'Datasets', 'Ventas preparadas', 'Versiones', 'Detalle de versi\u00f3n'])
  })
})
