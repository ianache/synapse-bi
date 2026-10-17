import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { ApiRequestError } from '../../adapters/apiRepository'
import { DatasetList } from './DatasetList'
import { dataset } from './testFixtures'
afterEach(cleanup)

it('shows loading and empty state from the actual server result', async () => {
  const repo = new DatasetsRepository()
  vi.spyOn(repo, 'me').mockResolvedValue({ scopes: ['datasets:read', 'datasets:write', 'sources:read'] })
  let resolve!: (value: { items: never[]; total: number; limit: number; offset: number }) => void
  vi.spyOn(repo, 'list').mockImplementation(filters => filters?.limit === 1 ? Promise.resolve({items: [], total: 0, limit: 1, offset: 0}) : new Promise(r => { resolve = r }))
  render(<DatasetList repository={repo} />)
  expect(screen.getByRole('status')).toHaveTextContent('Cargando')
  resolve({ items: [], total: 0, limit: 20, offset: 0 })
  expect(await screen.findByText('Aún no hay datasets')).toBeInTheDocument()
})
it.each([403, 503])('shows %s without fictional fallback and allows retry', async status => {
  const repo = new DatasetsRepository()
  vi.spyOn(repo, 'me').mockResolvedValue({ scopes: [] })
  vi.spyOn(repo, 'list').mockRejectedValue(new ApiRequestError(status, 'unavailable', `Error ${status}`))
  render(<DatasetList repository={repo} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(`Error ${status}`)
  expect(screen.queryByText('Ventas')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
})
it('requests pagination and completeness filters from the server', async () => {
  const repo = new DatasetsRepository()
  vi.spyOn(repo, 'me').mockResolvedValue({ scopes: [] })
  const list = vi.spyOn(repo, 'list').mockResolvedValue({ items: [dataset], total: 45, limit: 20, offset: 0 })
  vi.spyOn(repo, 'get').mockResolvedValue(dataset)
  render(<DatasetList repository={repo} />)
  await screen.findByText('Ventas')
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  await waitFor(() => expect(list.mock.calls.filter(call => call[0]?.limit === 20).at(-1)?.[0]?.offset).toBe(20))
  await userEvent.selectOptions(screen.getByLabelText('Completitud'), 'incomplete')
  await waitFor(() => expect(list.mock.calls.filter(call => call[0]?.limit === 20).at(-1)?.[0]).toMatchObject({ completeness: 'incomplete', offset: 0 }))
})

it('shows global API totals instead of counting the current page and reads declared governance for each row', async () => {
  const repo = new DatasetsRepository()
  vi.spyOn(repo, 'me').mockResolvedValue({scopes: ['datasets:read']})
  vi.spyOn(repo, 'list').mockImplementation(async filters => ({items: filters?.limit === 1 ? [] : [dataset], total: filters?.kind === 'direct' ? 21 : filters?.kind === 'prepared' ? 4 : 25, limit: filters?.limit ?? 20, offset: filters?.offset ?? 0}))
  vi.spyOn(repo, 'get').mockResolvedValue({...dataset, governance: {...dataset.governance, owner: 'Operaciones', classification: 'Interno'}})
  render(<DatasetList repository={repo} />)
  const summary = await screen.findByRole('region', {name: 'Resumen de datasets'})
  await waitFor(() => expect(within(summary).getByLabelText('Total de datasets')).toHaveTextContent('25'))
  expect(within(summary).getByLabelText('Datasets directos')).toHaveTextContent('21')
  expect(within(summary).getByLabelText('Datasets preparados')).toHaveTextContent('4')
  expect(await screen.findByText('Operaciones')).toBeInTheDocument()
  expect(screen.getByText('Interno (declarado)')).toBeInTheDocument()
  expect(screen.getByRole('link', {name: 'Ver ficha de Ventas'})).toHaveAttribute('href', '/datasets/d1')
  expect(screen.queryByRole('link', {name: /Registrar dataset/})).not.toBeInTheDocument()
  expect(screen.getByLabelText('Registro')).toBeInTheDocument()
  expect(screen.getByLabelText('Completitud')).toBeInTheDocument()
})

it('does not turn unavailable governance into a declared owner or classification', async () => {
  const repo = new DatasetsRepository()
  vi.spyOn(repo, 'me').mockResolvedValue({scopes: []})
  vi.spyOn(repo, 'list').mockResolvedValue({items: [dataset], total: 1, limit: 20, offset: 0})
  vi.spyOn(repo, 'get').mockRejectedValue(new ApiRequestError(503, 'unavailable', 'No disponible'))
  render(<DatasetList repository={repo} />)
  expect(await screen.findByRole('button', {name: 'Reintentar metadatos de Ventas'})).toBeInTheDocument()
  expect(screen.queryByText('Interno (declarado)')).not.toBeInTheDocument()
  expect(screen.queryByText('Equipo de datos')).not.toBeInTheDocument()
})
