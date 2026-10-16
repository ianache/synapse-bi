import type { Meta, StoryObj } from '@storybook/react'
import { ChartCard, DashboardLayout, MetricCard } from '@bi-analytics/design-system'

const meta = { title: 'Compositions/Dashboard', tags: ['autodocs'] } satisfies Meta
export default meta
export const ExecutiveDashboard: StoryObj = { render: () => <DashboardLayout navigation={[{ label: 'Overview', href: '/' }]}><h2>Executive dashboard</h2><div style={{ display: 'flex', gap: '1rem' }}><MetricCard label="Revenue" value={128400} /><ChartCard title="Regions" series={[{ label: 'North', value: 72 }, { label: 'South', value: 56 }]} /></div></DashboardLayout> }
