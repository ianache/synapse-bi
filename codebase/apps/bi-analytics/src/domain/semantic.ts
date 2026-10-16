import type { SemanticQueryState } from '@bi-analytics/design-system'

export type DashboardMetric = { label: string; value: number; unit?: string; trend?: { value: number; direction: 'up' | 'down' | 'neutral' }; status?: 'positive' | 'warning' | 'negative' | 'neutral' }
export type DashboardRow = { name: string; value: number }
export type DashboardData = { metrics: DashboardMetric[]; rows: DashboardRow[] }
export type SemanticAdapter = { getDashboard: () => Promise<SemanticQueryState<DashboardData>> }
