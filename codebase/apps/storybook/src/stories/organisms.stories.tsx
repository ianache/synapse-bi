import type { Meta, StoryObj } from '@storybook/react'
import { AdvancedDataTable, BottomNav, ChartCard, DataTable, FilterBar, MetricCard, ProfileCard, SearchField } from '@bi-analytics/design-system'

const meta = { title: 'Organisms/Analytics', component: MetricCard, tags: ['autodocs'], argTypes: { status: { control: 'select', options: ['positive', 'warning', 'negative', 'neutral'] }, loading: { control: 'boolean' } } } satisfies Meta<typeof MetricCard>
export default meta
export const MetricCardPrimary: StoryObj = { render: () => <MetricCard label="Revenue" value={128400} unit="USD" status="positive" trend={{ value: 8.4, direction: 'up' }} /> }
export const MetricCardLoading: StoryObj = { render: () => <MetricCard label="Revenue" value="—" loading /> }
export const MetricCardError: StoryObj = { render: () => <MetricCard label="Revenue" value="—" error="Unable to load" /> }
export const DataTableEmpty: StoryObj = { render: () => <DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[]} empty /> }
export const DataTableLoading: StoryObj = { render: () => <DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[]} loading /> }
export const Unauthorized: StoryObj = { render: () => <MetricCard label="Restricted" value="—" error="Unauthorized" /> }
export const Disabled: StoryObj = { render: () => <MetricCard label="Disabled" value="—" status="neutral" /> }
export const ChartStale: StoryObj = { render: () => <ChartCard title="Stale regional performance" series={[{ label: 'North', value: 72 }]} status="stale" /> }
export const ChartUnauthorized: StoryObj = { render: () => <ChartCard title="Restricted performance" series={[]} status="unauthorized" /> }
export const DataTableError: StoryObj = { render: () => <DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[]} error="Unable to load" /> }
export const ResponsiveFilterBar: StoryObj = { render: () => <FilterBar><SearchField label="Responsive filter" onSubmit={() => undefined} /></FilterBar> }
export const AdvancedTable: StoryObj = { render: () => <AdvancedDataTable title="Transactions" total={128} columns={[{ key: 'name', label: 'Customer' }, { key: 'status', label: 'Status' }]} rows={[{ name: 'Ana Rivas', status: 'Paid' }]} /> }
export const Profile: StoryObj = { render: () => <ProfileCard name="Carlos Rodríguez" role="Product Designer • Lead UI/UX" membership="Pro Member" description="Specialist in scalable design systems." /> }
export const MobileBottomNavigation: StoryObj = { render: () => <BottomNav items={[{ label: 'Home', href: '#home', icon: '⌂' }, { label: 'Metrics', href: '#metrics', icon: '◒' }, { label: 'Alerts', href: '#alerts', icon: '◉' }, { label: 'Profile', href: '#profile', icon: '◯' }]} activeHref="#home" /> }
