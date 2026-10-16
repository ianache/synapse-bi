import type { SemanticAdapter } from '../domain/semantic'

export function createMockSemanticAdapter(): SemanticAdapter {
  return { getDashboard: async () => ({ status: 'success', freshness: '2026-10-15T00:00:00Z', data: { metrics: [{ label: 'Revenue', value: 128400, unit: 'USD', trend: { value: 8.4, direction: 'up' }, status: 'positive' }, { label: 'Orders', value: 2450, trend: { value: 2.1, direction: 'up' }, status: 'positive' }], rows: [{ name: 'North region', value: 72000 }, { name: 'South region', value: 56400 }] } }) }
}
