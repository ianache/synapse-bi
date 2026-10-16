import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { initialDashboards, loadDashboards, saveDashboards } from '../adapters/localDashboards'

beforeEach(() => {
  // Node's experimental localStorage can shadow jsdom's implementation.
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
    clear: () => values.clear(),
  })
  window.history.replaceState({}, '', '/explorar')
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('KPI analyst journey', () => {
  it('finds KPI by accented synonym and recovers from an empty result', async () => {
    const user = userEvent.setup()
    render(<App />)
    const search = screen.getByRole('searchbox', { name: 'Buscar KPI' })
    await user.clear(search)
    await user.type(search, 'facturacion')
    expect(screen.getByRole('heading', { name: 'Ingresos netos' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Margen bruto' })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'missing')
    expect(screen.getByText('No encontramos KPI con esos filtros')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda y filtros' }))
    expect(screen.getByRole('heading', { name: 'Margen bruto' })).toBeInTheDocument()
  })

  it('adds a KPI to the selected dashboard, persists it, and prevents duplicates', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Añadir al dashboard: Ingresos netos' }))
    await user.click(screen.getByRole('radio', { name: /Resumen financiero mensual/ }))
    await user.click(screen.getByRole('button', { name: 'Añadir KPI' }))
    expect(screen.getByRole('heading', { name: 'Resumen financiero mensual' })).toBeInTheDocument()
    expect(loadDashboards().find(d => d.id === 'finanzas')?.kpiIds).toEqual(['kpi_fin_net_revenue'])
    await user.click(screen.getByRole('link', { name: 'Explorar y añadir KPI' }))
    await user.click(screen.getByRole('button', { name: 'Añadir al dashboard: Ingresos netos' }))
    expect(screen.getByRole('radio', { name: /Resumen financiero mensual/ })).toBeDisabled()
  })

  it('creates a personal destination then adds the KPI to it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Añadir al dashboard: Ingresos netos' }))
    await user.click(screen.getByRole('button', { name: 'Crear dashboard' }))
    await user.type(screen.getByRole('textbox', { name: 'Nombre del dashboard' }), 'Ventas por canal')
    await user.click(screen.getByRole('button', { name: 'Crear y seleccionar' }))
    expect(screen.getByRole('radio', { name: /Ventas por canal/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Añadir KPI' }))
    expect(screen.getByRole('heading', { name: 'Ventas por canal' })).toBeInTheDocument()
    expect(loadDashboards().find(d => d.name === 'Ventas por canal')?.kpiIds).toEqual(['kpi_fin_net_revenue'])
  })

  it('keeps selection and permits retry when storage fails', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Añadir al dashboard: Ingresos netos' }))
    const spy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('quota') })
    await user.click(screen.getByRole('button', { name: 'Añadir KPI' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.getByRole('radio', { name: /Ventas Q3 Ejecutivo/ })).toBeChecked()
    spy.mockRestore()
    await user.click(screen.getByRole('button', { name: 'Añadir KPI' }))
    expect(screen.getByRole('heading', { name: 'Ventas Q3 Ejecutivo' })).toBeInTheDocument()
  })

  it('does not permit adding to a read-only destination', async () => {
    saveDashboards(initialDashboards.map(d => ({ ...d, editable: false })))
    window.history.replaceState({}, '', '/kpi/kpi_fin_net_revenue/agregar')
    render(<App />)
    expect(screen.getByRole('button', { name: 'Añadir KPI' })).toBeDisabled()
    screen.getAllByRole('radio').forEach(radio => expect(radio).toBeDisabled())
  })
})
