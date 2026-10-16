import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDashboardQuery } from './useDashboardQuery'
import type { SemanticAdapter } from '../domain/semantic'

describe('useDashboardQuery', () => {
  it('keeps the newest request result when responses resolve out of order', async () => {
    let resolveFirst!: (value: any) => void
    let resolveSecond!: (value: any) => void
    const adapter: SemanticAdapter = { getDashboard: () => new Promise((resolve) => { if (!resolveFirst) resolveFirst = resolve; else resolveSecond = resolve }) }
    const { result, rerender } = renderHook(({ currentAdapter }) => useDashboardQuery(currentAdapter), { initialProps: { currentAdapter: adapter } })
    const newerAdapter: SemanticAdapter = { getDashboard: () => new Promise((resolve) => { resolveSecond = resolve }) }
    rerender({ currentAdapter: newerAdapter })
    resolveSecond({ status: 'success', data: { metrics: [{ label: 'New', value: 2 }], rows: [] } })
    await waitFor(() => expect(result.current.state.data?.metrics[0]?.label).toBe('New'))
    resolveFirst({ status: 'success', data: { metrics: [{ label: 'Old', value: 1 }], rows: [] } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(result.current.state.data?.metrics[0]?.label).toBe('New')
  })
})
