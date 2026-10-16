import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

describe('SearchField', () => {
  it('submits a labelled search value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<SearchField label="Search" onSubmit={onSubmit} />)
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'sales')
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('sales')
  })
})
