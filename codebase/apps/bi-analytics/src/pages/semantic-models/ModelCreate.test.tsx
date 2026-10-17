import {act, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, it, vi} from 'vitest'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {ModelCreate} from './ModelCreate'
import {catalogRepository, domain, measure, kpi, detail} from './testFixtures'

function setup() {
  const repository = new SemanticModelsRepository(), catalog = catalogRepository(), onSaved = vi.fn()
  vi.spyOn(catalog, 'all').mockImplementation(async kind => ({domains: [domain], components: [measure], 'kpi-definitions': [kpi]}[kind]) as never)
  render(<ModelCreate repository={repository} catalogRepository={catalog} onSaved={onSaved} />)
  return {repository, onSaved}
}
async function fill() {
  await userEvent.type(screen.getByLabelText('Nombre del modelo'), 'Modelo propio')
  await userEvent.selectOptions(await screen.findByLabelText('Dominio de negocio'), 'd')
  await screen.findByLabelText('Incluir KPI Entrega puntual')
}
it('saves an empty declared draft without publishing and assigns the ID only on save', async () => {
  const {repository, onSaved} = setup()
  const create = vi.spyOn(repository, 'create').mockResolvedValue(detail)
  await fill()
  expect(screen.getByLabelText('Identificador del sistema')).toHaveValue('Se asignará al guardar')
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(detail))
  expect(create.mock.calls[0][0]).toMatchObject({domainId: 'd', kpiIds: []})
  expect(screen.queryByRole('button', {name: 'Publicar'})).not.toBeInTheDocument()
})
it('keeps retry key and ignores departed creation responses', async () => {
  const {repository, onSaved} = setup()
  const create = vi.spyOn(repository, 'create').mockRejectedValue(new Error('Resultado incierto'))
  await fill()
  await userEvent.click(screen.getByLabelText('Incluir KPI Entrega puntual'))
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await screen.findByText('Resultado incierto')
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(create).toHaveBeenCalledTimes(2))
  expect(create.mock.calls[0][1]).toBe(create.mock.calls[1][1])
  let resolve!: (value: typeof detail) => void
  create.mockReturnValue(new Promise(r => {resolve = r}))
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  const {cleanup} = await import('@testing-library/react')
  cleanup()
  await act(async () => resolve(detail))
  expect(onSaved).not.toHaveBeenCalled()
})
