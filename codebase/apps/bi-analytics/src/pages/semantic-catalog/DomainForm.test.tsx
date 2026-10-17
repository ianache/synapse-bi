import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ApiRequestError } from '../../adapters/apiRepository'
import { DomainForm } from './DomainForm'
import { domain, repository } from './testFixtures'

it('saves a minimal custom domain with missing metadata, without inventing an owner', async () => {
  const repo = repository(), done = vi.fn()
  const create = vi.spyOn(repo, 'createDomain').mockResolvedValue(domain)
  vi.spyOn(repo, 'get').mockResolvedValue(domain)
  render(<DomainForm repository={repo} onSaved={done} />)
  await userEvent.type(screen.getByLabelText('Nombre'), 'Logística')
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(done).toHaveBeenCalledWith(domain))
  expect(create.mock.calls[0][0]).toEqual({name: 'Logística', description: '', owner: null})
})

it('retains body and key after uncertain creation, blocks duplicates and retries the same intent', async () => {
  const repo = repository()
  const create = vi.spyOn(repo, 'createDomain').mockRejectedValueOnce(new TypeError('Network lost')).mockResolvedValue(domain)
  vi.spyOn(repo, 'get').mockResolvedValue(domain)
  render(<DomainForm repository={repo} onSaved={() => {}} />)
  await userEvent.type(screen.getByLabelText('Nombre'), 'Logística')
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Nombre')).toBeDisabled()
  await userEvent.click(screen.getByRole('button', {name: 'Reintentar guardado'}))
  await waitFor(() => expect(create).toHaveBeenCalledTimes(2))
  expect(create.mock.calls[0][1]).toBe(create.mock.calls[1][1])
})

it('late save does not navigate after unmount', async () => {
  const repo = repository(), done = vi.fn()
  let resolve!: (value: typeof domain) => void
  vi.spyOn(repo, 'createDomain').mockImplementation(() => new Promise(r => { resolve = r }))
  vi.spyOn(repo, 'get').mockResolvedValue(domain)
  const view = render(<DomainForm repository={repo} onSaved={done} />)
  await userEvent.type(screen.getByLabelText('Nombre'), 'Logística')
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  view.unmount()
  await act(async () => resolve(domain))
  expect(done).not.toHaveBeenCalled()
})

it('preserves word separators while typing a declared owner', async () => {
  render(<DomainForm repository={repository()} onSaved={() => {}} />)
  await userEvent.type(screen.getByLabelText('Responsable declarado'), 'Equipo BI')
  expect(screen.getByLabelText('Responsable declarado')).toHaveValue('Equipo BI')
})

it('conflict reload requires confirmation and blocks editing while reload is pending', async () => {
  const repo = repository()
  vi.spyOn(repo, 'update').mockRejectedValue(new ApiRequestError(412, 'version_conflict', 'Cambió'))
  let resolve!: (value: typeof domain) => void
  vi.spyOn(repo, 'get').mockImplementation(() => new Promise(r => { resolve = r }))
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  render(<DomainForm repository={repo} initial={domain} onSaved={() => {}} />)
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await userEvent.click(await screen.findByRole('button', {name: 'Recargar versión'}))
  expect(confirm).toHaveBeenCalledOnce()
  expect(screen.getByLabelText('Nombre')).toBeDisabled()
  expect(screen.getByRole('button', {name: 'Recargar versión'})).toBeDisabled()
  await act(async () => resolve({...domain, name: 'Actual', version: 2}))
  await waitFor(() => expect(screen.getByLabelText('Nombre')).toHaveValue('Actual'))
  confirm.mockRestore()
})
