import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
  vi.spyOn(repo, 'list').mockReturnValue(new Promise(r => { resolve = r }))
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
  render(<DatasetList repository={repo} />)
  await screen.findByText('Ventas')
  await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  await waitFor(() => expect(list.mock.lastCall?.[0]?.offset).toBe(20))
  await userEvent.selectOptions(screen.getByLabelText('Completitud'), 'incomplete')
  await waitFor(() => expect(list.mock.lastCall?.[0]).toMatchObject({ completeness: 'incomplete', offset: 0 }))
})
