import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('application routes', () => {
  it('renders the KPI discovery route as the starting experience', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Encuentra un KPI confiable' })).toBeInTheDocument()
  })
})
