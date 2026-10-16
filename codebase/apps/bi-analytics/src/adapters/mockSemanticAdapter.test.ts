import { describe, expect, it } from 'vitest'
import { createMockSemanticAdapter } from './mockSemanticAdapter'

describe('mock semantic adapter', () => {
  it('returns typed dashboard data', async () => {
    const result = await createMockSemanticAdapter().getDashboard()
    expect(result.status).toBe('success')
    expect(result.data?.metrics.length).toBeGreaterThan(0)
  })
})
