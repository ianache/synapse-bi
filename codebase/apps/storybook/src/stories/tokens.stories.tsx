import type { Meta, StoryObj } from '@storybook/react'

const meta = { title: 'Foundations/Tokens', tags: ['autodocs'] } satisfies Meta
export default meta
export const Themes: StoryObj = { render: () => <div><h2>Tokens and themes</h2><p>Use theme-light or theme-dark with the semantic CSS variables from @bi-analytics/tokens.</p><div style={{ display: 'flex', gap: '1rem' }}><div className="theme-light" style={{ padding: '1rem', background: 'var(--bi-color-surface)', color: 'var(--bi-color-text)' }}>Light theme</div><div className="theme-dark" style={{ padding: '1rem', background: 'var(--bi-color-surface)', color: 'var(--bi-color-text)' }}>Dark theme</div></div></div> }
