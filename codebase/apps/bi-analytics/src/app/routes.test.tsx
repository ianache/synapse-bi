import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './App'

afterEach(() => cleanup())

describe('application routes', () => {
  it('keeps login separate from operational navigation', () => {
    window.history.pushState({}, '', '/login')
    const {container}=render(<App/>)
    expect(container.querySelector('.bi-menubar')).not.toBeInTheDocument()
    expect(container.querySelector('.bi-mainbar')).not.toBeInTheDocument()
  })
  it('opens the model workspace and marks its own navigation without replacing the catalog', () => {
    window.history.pushState({}, '', '/modelos-semanticos')
    render(<App />)
    expect(screen.getByRole('link', {name: 'Modelos semánticos'})).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', {name: 'Catálogo semántico'})).toHaveAttribute('href', '/catalogo-semantico')
  })
  it('renders the KPI discovery route as the starting experience', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Encuentra un KPI confiable' })).toBeInTheDocument()
  })
})
