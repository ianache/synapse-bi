import { describe, expect, it } from 'vitest'
import type { LineageReference, MetricCardProps, SemanticQueryState } from './semantic'

describe('public contracts', () => {
  it('accepts presentational metric and semantic query values', () => {
    const metric: MetricCardProps = {
      label: 'Revenue', value: 120, trend: { value: 4, direction: 'up' }, status: 'positive',
    }
    const lineage: LineageReference = { source: 'mock', reference: 'dashboard.revenue' }
    const state: SemanticQueryState<number> = { data: metric.value as number, status: 'success', lineage: [lineage] }
    expect(state.data).toBe(120)
  })
})
