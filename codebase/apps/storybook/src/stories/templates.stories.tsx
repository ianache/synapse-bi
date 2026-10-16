import type { Meta, StoryObj } from '@storybook/react'
import { DashboardLayout } from '@bi-analytics/design-system'

const meta = { title: 'Templates/Layout', tags: ['autodocs'] } satisfies Meta
export default meta
export const Dashboard: StoryObj = { render: () => <DashboardLayout navigation={[{ label: 'Overview', href: '/' }]}><h2>Responsive analysis workspace</h2></DashboardLayout> }
export const MobileWorkspace: StoryObj = { render: () => <div style={{ maxWidth: 375 }}><DashboardLayout navigation={[{ label: 'Overview', href: '/' }, { label: 'Trends', href: '/trends' }]}><h2>Mobile analysis workspace</h2></DashboardLayout></div> }
