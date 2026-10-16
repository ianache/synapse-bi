import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'
import { createMockSemanticAdapter } from '../adapters/mockSemanticAdapter'

describe('DashboardPage', () => {
  afterEach(cleanup)
  it('renders dashboard content after loading', async () => {
    render(<DashboardPage adapter={createMockSemanticAdapter()} />)
    await waitFor(() => expect(screen.getAllByRole('heading', { name: 'Executive dashboard' })[0]).toBeInTheDocument())
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })

  it('filters regional results and exposes an empty state', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    render(<DashboardPage adapter={createMockSemanticAdapter()} />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Executive dashboard' })).toBeInTheDocument())
    await user.type(screen.getByRole('textbox', { name: 'Search dashboard' }), 'missing')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
