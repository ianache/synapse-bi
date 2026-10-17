import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { CatalogList } from './CatalogList'
import { domain, kpi, measure, repository } from './testFixtures'

it('shows an empty state without fabricated examples or computed KPI values', async () => {
  const repo = repository()
  vi.spyOn(repo, 'list').mockResolvedValue({items: [], total: 0, limit: 25, offset: 0})
  render(<CatalogList repository={repo} canWrite={true} />)
  expect(await screen.findByText('Todavía no hay elementos.')).toBeInTheDocument()
  expect(screen.getByRole('link', {name: 'Crear dominio'})).toBeInTheDocument()
  expect(screen.queryByText('Logística')).not.toBeInTheDocument()
})

it('filters separate measure and dimension tabs and opens the selected record beside the list', async () => {
  const user = userEvent.setup(), repo = repository()
  vi.spyOn(repo, 'all').mockResolvedValue([domain])
  vi.spyOn(repo, 'list').mockImplementation(async (kind, filters) => ({items: kind === 'components' && filters?.kind === 'measure' ? [measure] : [], total: kind === 'components' && filters?.kind === 'measure' ? 1 : 0, limit: 25, offset: 0}) as never)
  vi.spyOn(repo, 'get').mockResolvedValue(measure)
  vi.spyOn(repo, 'consumers').mockResolvedValue({items: [], total: 0, limit: 25, offset: 0})
  render(<CatalogList repository={repo} canWrite={true} />)
  expect(await screen.findByRole('tab', {name: /Medidas/})).toHaveAttribute('aria-selected', 'true')
  expect(await screen.findByRole('button', {name: 'Ver Tiempo'})).toBeInTheDocument()
  const panel = await screen.findByRole('complementary', {name: 'Ficha del elemento'})
  expect(await within(panel).findByRole('heading', {name: 'Tiempo'})).toBeInTheDocument()
  expect(within(panel).queryByRole('link', {name: 'Editar'})).not.toBeInTheDocument()
  expect(screen.getByRole('columnheader', {name: 'Origen dataset / columna física'})).toBeInTheDocument()
  await user.click(screen.getByRole('tab', {name: /Dimensiones/}))
  expect(await screen.findByText('Todavía no hay elementos.')).toBeInTheDocument()
  expect(within(screen.getByRole('complementary', {name: 'Ficha del elemento'})).queryByText('Tiempo')).not.toBeInTheDocument()
})

it('keeps empty and read-only catalogs honest instead of showing mockup records or management actions', async () => {
  const repo = repository()
  vi.spyOn(repo, 'all').mockResolvedValue([])
  vi.spyOn(repo, 'list').mockResolvedValue({items: [], total: 0, limit: 25, offset: 0})
  render(<CatalogList repository={repo} canWrite={false} />)
  expect(await screen.findByText('Todavía no hay elementos.')).toBeInTheDocument()
  expect(screen.getByLabelText('Dominio de negocio')).toBeInTheDocument()
  expect(screen.queryByRole('link', {name: 'Crear dominio'})).not.toBeInTheDocument()
  expect(screen.queryByRole('link', {name: 'Nuevo elemento'})).not.toBeInTheDocument()
  expect(screen.queryByText(/fact_envios/)).not.toBeInTheDocument()
})

it('does not request component consumers for a selected KPI', async () => {
  const repo = repository(), user = userEvent.setup()
  vi.spyOn(repo, 'all').mockResolvedValue([domain])
  vi.spyOn(repo, 'list').mockImplementation(async kind => ({items: kind === 'kpi-definitions' ? [kpi] : [], total: kind === 'kpi-definitions' ? 1 : 0, limit: 25, offset: 0}) as never)
  vi.spyOn(repo, 'get').mockResolvedValue(kpi)
  const consumers = vi.spyOn(repo, 'consumers').mockRejectedValue(new Error('KPI is not a component'))
  render(<CatalogList repository={repo} canWrite={true} />)
  await user.click(screen.getByRole('tab', {name: /^KPI/}))
  const panel = screen.getByRole('complementary', {name: 'Ficha del elemento'})
  expect(await within(panel).findByRole('heading', {name: 'Entrega puntual'})).toBeInTheDocument()
  expect(consumers).not.toHaveBeenCalled()
})
