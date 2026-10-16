import type { Meta, StoryObj } from '@storybook/react'
import { ActionSearch, KpiCard, ListItem, SearchField, StatusChip } from '@bi-analytics/design-system'

const meta = { title: 'Molecules/Core', tags: ['autodocs'] } satisfies Meta
export default meta
export const Search: StoryObj = { render: () => <SearchField label="Search" onSubmit={() => undefined} /> }
export const Status: StoryObj = { render: () => <StatusChip status="positive" /> }
export const SearchWithAction: StoryObj = { render: () => <ActionSearch onSubmit={() => undefined} /> }
export const Kpi: StoryObj = { render: () => <KpiCard label="Revenue" value="$14,250" trend="+12%" detail="Active" icon="$" /> }
export const NavigationCell: StoryObj = { render: () => <ListItem title="Invoice #4029" subtitle="Today, 14:32" meta="$340.00" leading="▱" onClick={() => undefined} /> }
