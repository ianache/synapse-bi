import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

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
  it('opens the CDC preparation workspace under the datasets shell', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(min-width: 1024px)', media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }))
    window.history.pushState({}, '', '/datasets/preparacion-cdc')
    const { container } = render(<App />)
    const menubar = container.querySelector('.bi-menubar')
    expect(menubar).not.toBeNull()
    expect(within(menubar as HTMLElement).getByRole('link', { name: 'Datasets' })).toHaveAttribute('aria-current', 'page')
    expect(await screen.findByRole('status')).toHaveTextContent('Cargando pipelines CDC')
    expect(container.querySelector('.bi-mainbar')).toBeInTheDocument()
  })
})
