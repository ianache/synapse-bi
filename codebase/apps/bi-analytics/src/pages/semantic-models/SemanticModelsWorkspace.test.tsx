import {useEffect, useState} from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, it, vi} from 'vitest'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {ApiRequestError} from '../../adapters/apiRepository'
import {SemanticModelsWorkspace} from './SemanticModelsWorkspace'
import {catalogRepository, detail, draft, kpi, preview} from './testFixtures'

function setup() {
  const repository = new SemanticModelsRepository(), catalog = catalogRepository()
  vi.spyOn(repository, 'me').mockResolvedValue({scopes: ['models:read', 'models:write', 'semantic:read', 'semantic:write', 'datasets:read', 'sources:read']} as Awaited<ReturnType<typeof repository.me>>)
  const get = vi.spyOn(repository, 'get').mockResolvedValue(detail)
  vi.spyOn(repository, 'drafts').mockResolvedValue({items: [{...draft, kpiCount: 1, componentCount: 1}], total: 1, offset: 0, limit: 25})
  vi.spyOn(catalog, 'all').mockResolvedValue([kpi, {...kpi, id: 'k2', name: 'Segundo KPI'}])
  const inspect = vi.spyOn(repository, 'preview').mockResolvedValue(preview)
  const update = vi.spyOn(repository, 'update')
  window.history.replaceState({}, '', '/modelos-semanticos/model/borradores/draft/comparar')
  function Harness() {
    const [path, setPath] = useState(window.location.pathname)
    useEffect(() => {const listener = () => setPath(window.location.pathname); window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener)}, [])
    return <SemanticModelsWorkspace path={path} repository={repository} catalogRepository={catalog} />
  }
  render(<Harness />)
  return {get, inspect, update}
}
async function confirm() {
  await userEvent.click(await screen.findByRole('button', {name: 'Comprobar cambios del catálogo'}))
  await userEvent.click(await screen.findByLabelText('He revisado los cambios de esta captura'))
  await userEvent.click(screen.getByRole('button', {name: 'Confirmar actualización de borrador'}))
}
it('preserves the local selection while recovering a stale revision and requires a fresh comparison', async () => {
  const {get, inspect, update} = setup()
  update.mockRejectedValue(new ApiRequestError(412, 'version_conflict', 'La versión cambió'))
  await userEvent.click(await screen.findByText('Ajustar selección de KPI del mismo dominio'))
  await userEvent.click(await screen.findByLabelText('Incluir KPI Segundo KPI'))
  await confirm()
  await screen.findByRole('alert')
  get.mockResolvedValue({...detail, model: {...detail.model, revision: 2}, draft: {...draft, revision: 2}})
  await userEvent.click(screen.getByRole('button', {name: 'Recuperar revisión y conservar selección'}))
  await waitFor(() => expect(screen.getByLabelText('Incluir KPI Segundo KPI')).toBeChecked())
  expect(screen.getByLabelText('He revisado los cambios de esta captura')).not.toBeChecked()
  await userEvent.click(screen.getByRole('button', {name: 'Comprobar cambios del catálogo'}))
  await waitFor(() => expect(inspect.mock.calls.at(-1)?.[1].revision).toBe(2))
  expect(inspect.mock.calls.at(-1)?.[2]).toEqual(['k', 'k2'])
})
it('renders the confirmed PUT response without requiring a subsequent GET', async () => {
  const {get, update} = setup()
  await screen.findByRole('heading', {name: 'Comparar captura con catálogo'})
  get.mockRejectedValue(new Error('Lectura posterior no disponible'))
  update.mockResolvedValue({...draft, revision: 2, capture: preview.candidateCapture, captureDigest: preview.candidateDigest})
  await confirm()
  await screen.findByRole('heading', {name: 'Modelo propio'})
  expect(screen.getByText('Nueva definición', {exact: true})).toBeInTheDocument()
  expect(screen.queryByText('Lectura posterior no disponible')).not.toBeInTheDocument()
  expect(get).toHaveBeenCalledTimes(1)
})
it('reconciles a committed PUT with a lost response before offering another write', async () => {
  const {get, update} = setup()
  update.mockRejectedValue(new TypeError('Respuesta perdida'))
  await confirm()
  await screen.findByText('Respuesta perdida')
  get.mockResolvedValue({...detail, model: {...detail.model, revision: 2}, draft: {...draft, revision: 2, capture: preview.candidateCapture, captureDigest: preview.candidateDigest}})
  await userEvent.click(screen.getByRole('button', {name: 'Recuperar revisión y conservar selección'}))
  await screen.findByRole('heading', {name: 'Modelo propio'})
  expect(screen.getByText('Nueva definición', {exact: true})).toBeInTheDocument()
  expect(update).toHaveBeenCalledTimes(1)
})
