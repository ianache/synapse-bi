import type { Meta, StoryObj } from '@storybook/react'
import { Avatar, Badge, Button, Checkbox, Input, Radio, Spinner, Switch, Text } from '@bi-analytics/design-system'

const meta = { title: 'Atoms/Core', component: Button, tags: ['autodocs'], argTypes: { variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'outline', 'tonal'] }, disabled: { control: 'boolean' } } } satisfies Meta<typeof Button>
export default meta
export const PrimaryButton: StoryObj<typeof Button> = { args: { children: 'Run analysis', variant: 'primary' } }
export const DisabledButton: StoryObj = { render: () => <Button disabled>Disabled</Button> }
export const Loading: StoryObj = { render: () => <Spinner /> }
export const TextAndBadge: StoryObj = { render: () => <><Text>Semantic result</Text><Badge>success</Badge><Input aria-label="Example input" /></> }
export const SelectionControls: StoryObj = { render: () => <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><label><Checkbox defaultChecked /> Include archived</label><label><Radio name="mode" defaultChecked /> Summary</label><Switch label="Notifications" defaultChecked /><Avatar name="Ana Rivas" /></div> }
