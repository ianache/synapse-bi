import { describe, expect, it } from 'vitest'
import type { LineageReference, MetricCardProps, SemanticQueryState } from './semantic'
import type {NavigationItem, ShellAction} from '../organisms/navigation/types'

// Compile-time consumer contract: unavailable destinations/actions cannot pretend to work.
// @ts-expect-error unavailable destination cannot carry an operative href
const invalidDestination: NavigationItem = {id: 'x', label: 'X', href: '/x', unavailableReason: 'Unavailable'}
// @ts-expect-error an action must explain why no handler exists
const invalidAction: ShellAction = {id: 'x', label: 'X'}
void invalidDestination
void invalidAction

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
