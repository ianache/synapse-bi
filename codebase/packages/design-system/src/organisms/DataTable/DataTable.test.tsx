import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable } from './DataTable'

describe('DataTable', () => {
  it('renders an accessible empty state', () => {
    render(<DataTable columns={[{ key: 'name', label: 'Name' }]} rows={[]} empty />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
