import { useState } from 'react'
import {SynapseShell} from '../components/SynapseShell'
import { useDashboardQuery } from '../hooks/useDashboardQuery'
import { ChartCard, DataTable, ExperienceStateMessage, FilterBar, MetricCard, SearchField } from '@bi-analytics/design-system'
import type { SemanticAdapter } from '../domain/semantic'

export function DashboardPage({ adapter }: { adapter: SemanticAdapter }) {
  const { state, retry } = useDashboardQuery(adapter)
  const [filter, setFilter] = useState('')
  const data = state.data
  const rows = data?.rows.filter((row) => row.name.toLowerCase().includes(filter.toLowerCase())) ?? []
  const hasEmptyResult = state.status === 'success' && data && rows.length === 0
  return <SynapseShell active="dashboards" breadcrumb="Dashboard"><section><h2>Executive dashboard</h2><FilterBar><SearchField label="Search dashboard" onSubmit={setFilter} placeholder="Filter metrics" /></FilterBar><ExperienceStateMessage state={state.status} onRetry={retry} />{state.status === 'success' && data && <>{hasEmptyResult ? <p role="status">No results</p> : <><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '1rem', margin: '1rem 0' }}>{data.metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div><ChartCard title="Regional performance" series={rows.map((row) => ({ label: row.name, value: row.value }))} /><DataTable columns={[{ key: 'name', label: 'Region' }, { key: 'value', label: 'Value' }]} rows={rows} /></>}</>}</section></SynapseShell>
}
