import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, it, expect, afterEach } from 'vitest'
import { ApiRequestError, type ApiRepository } from '../adapters/apiRepository'
import { publishedKpis } from '../domain/kpis'
import { DashboardInteractive } from './DashboardInteractive'

afterEach(cleanup)

it('shows decorative icons on the dashboard actions without changing their accessible names', () => {
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 0, shared: false, editable: true, kpiIds: [], version: 1, initialPeriod: null }
  render(<DashboardInteractive dashboard={dashboard} kpis={[]} api={{} as ApiRepository} onUpdate={() => {}} onDetail={() => {}} />)
  for (const element of [screen.getByRole('link', { name: 'Añadir KPI' }), screen.getByRole('button', { name: 'Editar dashboard' }), screen.getByRole('button', { name: 'Compartir' })]) {
    expect(element.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  }
})

it('allows retrying and removing a pinned KPI whose definition failed to load', async () => {
  const kpi = { ...publishedKpis[0], modelVersion: 2 }
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 1, shared: false, editable: true, kpiIds: [kpi.id], modelVersions: { [kpi.id]: 1 }, version: 1, initialPeriod: null }
  const request = vi.fn().mockRejectedValue(new Error('offline'))
  const removeKpi = vi.fn().mockResolvedValue({ ...dashboard, kpiIds: [] })
  render(<DashboardInteractive dashboard={dashboard} kpis={[kpi]} api={{ request, removeKpi } as unknown as ApiRepository} onUpdate={() => {}} onDetail={() => {}} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar')
  await userEvent.click(screen.getByRole('button', { name: 'Editar dashboard' }))
  expect(screen.getByRole('heading', { name: /Gestionar y compartir/ })).toHaveFocus()
  await userEvent.click(screen.getByRole('button', { name: 'Reintentar carga de KPI' }))
  expect(request).toHaveBeenCalledTimes(2)
  await userEvent.click(screen.getByRole('button', { name: `Retirar ${kpi.id}` }))
  expect(removeKpi).toHaveBeenCalledWith(dashboard, kpi.id)
})

it('keeps the period and channel synchronized with the selected chart bar', async () => {
  const request = vi.fn().mockResolvedValue({ status: 'success', rows: [{ dimension: 'Digital', value: '1400.00' }, { dimension: 'Tienda', value: '1700.00' }], unit: 'PEN', metadata: {} })
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 1, shared: false, editable: true, kpiIds: [publishedKpis[0].id], modelVersions: { [publishedKpis[0].id]: 1 }, version: 1, initialPeriod: { startDate: '2026-10-01', endDate: '2026-10-03' } }
  const query = vi.fn().mockResolvedValue({ status: 'empty', rows: [], metadata: { dataMode: 'synthetic', lineageStatus: 'unavailable' } })
  render(<DashboardInteractive dashboard={dashboard} kpis={[{ ...publishedKpis[0], modelVersion: 1, dimensions: ['channel'] }]} api={{ request, query } as unknown as ApiRepository} onUpdate={() => {}} onDetail={() => {}} />)
  await userEvent.click(await screen.findByRole('button', { name: /Digital.*1400/ }))
  expect(screen.getByLabelText('Canal')).toHaveValue('Digital')
  expect(screen.getByRole('button', { name: 'Quitar filtro Canal: Digital' })).toBeInTheDocument()
  expect(screen.getByText('Filtro por canal activo: Digital')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
  expect(screen.getByLabelText('Canal')).toHaveValue('')
  expect(screen.getByLabelText('Desde')).toHaveValue('2026-10-01')
})

it('does not invent dates for a legacy dashboard', () => {
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 0, shared: false, editable: true, kpiIds: [], version: 1, initialPeriod: null }
  render(<DashboardInteractive dashboard={dashboard} kpis={[]} api={{} as ApiRepository} onUpdate={() => {}} onDetail={() => {}} />)
  expect(screen.getByText(/Configura el período inicial/)).toBeInTheDocument()
})

it('shows a guest with no visible KPIs an accessible empty state and return link', () => {
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 0, shared: true, editable: false, kpiIds: [], version: 1, initialPeriod: { startDate: '2026-10-01', endDate: '2026-10-03' } }
  render(<DashboardInteractive dashboard={dashboard} kpis={[]} api={{} as ApiRepository} onUpdate={() => {}} onDetail={() => {}} />)
  expect(screen.getByRole('heading', { name: 'No hay indicadores disponibles' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver a dashboards' })).toHaveAttribute('href', '/dashboards')
})

it('keeps KPI management available before the initial period is configured', () => {
  const kpi = { ...publishedKpis[0], modelVersion: 1 }
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 1, shared: false, editable: true, kpiIds: [kpi.id], modelVersions: { [kpi.id]: 1 }, version: 1, initialPeriod: null }
  render(<DashboardInteractive dashboard={dashboard} kpis={[kpi]} api={{} as ApiRepository} onUpdate={() => {}} onDetail={() => {}} />)
  expect(screen.getByRole('button', { name: `Retirar ${kpi.name}` })).toBeInTheDocument()
})

it('lets an owner remove a KPI using the current dashboard version', async () => {
  const kpi = { ...publishedKpis[0], modelVersion: 1, dimensions: ['channel'] }
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 1, shared: false, editable: true, kpiIds: [kpi.id], modelVersions: { [kpi.id]: 1 }, version: 3, initialPeriod: { startDate: '2026-10-01', endDate: '2026-10-03' } }
  const removeKpi = vi.fn().mockResolvedValue({ ...dashboard, version: 4, kpiIds: [] })
  const update = vi.fn()
  const api = { removeKpi, query: vi.fn().mockResolvedValue({ status: 'empty', rows: [], metadata: { dataMode: 'synthetic' } }), request: vi.fn().mockResolvedValue({ status: 'empty', rows: [], unit: 'PEN' }) } as unknown as ApiRepository
  render(<DashboardInteractive dashboard={dashboard} kpis={[kpi]} api={api} onUpdate={update} onDetail={() => {}} />)
  await userEvent.click(screen.getByRole('button', { name: `Retirar ${kpi.name}` }))
  expect(removeKpi).toHaveBeenCalledWith(dashboard, kpi.id)
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ version: 4, kpiIds: [] }))
})

it('hides dashboard content if access is revoked on a query', async () => {
  const kpi = { ...publishedKpis[0], modelVersion: 1, dimensions: ['channel'] }
  const dashboard = { id: 'd', name: 'Confidencial', owner: 'Ana', updated: '', visualizations: 1, shared: true, editable: false, kpiIds: [kpi.id], modelVersions: { [kpi.id]: 1 }, version: 1, initialPeriod: { startDate: '2026-10-01', endDate: '2026-10-03' } }
  const api = { query: vi.fn().mockRejectedValue(new ApiRequestError(404, 'dashboard_not_found', 'Dashboard no disponible.')), request: vi.fn().mockResolvedValue({ status: 'empty', rows: [], unit: 'PEN' }) } as unknown as ApiRepository
  render(<DashboardInteractive dashboard={dashboard} kpis={[kpi]} api={api} onUpdate={() => {}} onDetail={() => {}} />)
  expect(await screen.findByText('No se puede acceder a este dashboard')).toBeInTheDocument()
  expect(screen.queryByText('Confidencial')).not.toBeInTheDocument()
  expect(screen.queryByText(kpi.name)).not.toBeInTheDocument()
})

it('uses the dashboard-pinned KPI version instead of a newer catalog definition', async () => {
  const newer = { ...publishedKpis[0], name: 'Definición nueva', modelVersion: 2, dimensions: ['product'] }
  const pinned = { ...publishedKpis[0], name: 'Definición fijada', modelVersion: 1, dimensions: ['channel'] }
  const dashboard = { id: 'd', name: 'Ventas', owner: 'Ana', updated: '', visualizations: 1, shared: false, editable: true, kpiIds: [pinned.id], modelVersions: { [pinned.id]: 1 }, version: 1, initialPeriod: { startDate: '2026-10-01', endDate: '2026-10-03' } }
  const request = vi.fn().mockImplementation(async (path: string) => path.startsWith('/kpis/') ? pinned : { status: 'empty', rows: [], unit: 'PEN' })
  const api = { request, query: vi.fn().mockResolvedValue({ status: 'empty', rows: [], metadata: { dataMode: 'synthetic' } }) } as unknown as ApiRepository
  render(<DashboardInteractive dashboard={dashboard} kpis={[newer]} api={api} onUpdate={() => {}} onDetail={() => {}} />)
  expect(await screen.findByRole('heading', { name: 'Definición fijada' })).toBeInTheDocument()
  expect(screen.queryByText('Definición nueva')).not.toBeInTheDocument()
})
