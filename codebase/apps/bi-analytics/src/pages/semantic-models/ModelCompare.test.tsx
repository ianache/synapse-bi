import {act, cleanup, render, screen, waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {expect, it, vi} from 'vitest'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {ApiRequestError} from '../../adapters/apiRepository'
import {ModelCompare} from './ModelCompare'
import {detail, preview, draft} from './testFixtures'

function setup() {
  const repository = new SemanticModelsRepository(), onSaved = vi.fn()
  vi.spyOn(repository, 'drafts').mockResolvedValue({items: [{...draft, kpiCount: 1, componentCount: 1}], total: 1, limit: 25, offset: 0})
  const read = vi.spyOn(repository, 'preview').mockResolvedValue(preview)
  render(<ModelCompare repository={repository} detail={detail} canWrite onSaved={onSaved} search="" />)
  return {repository, read, onSaved}
}
it('requires explicit preview and unchecked confirmation before applying exactly the reviewed capture', async () => {
  const {repository, read, onSaved} = setup()
  const update = vi.spyOn(repository, 'update').mockResolvedValue({...draft, revision: 2, capture: preview.candidateCapture})
  expect(read).not.toHaveBeenCalled()
  expect(screen.getByRole('button', {name: 'Confirmar actualización de borrador'})).toBeDisabled()
  await userEvent.click(screen.getByRole('button', {name: 'Comprobar cambios del catálogo'}))
  await screen.findByText('Nueva definición')
  expect(screen.getByLabelText('He revisado los cambios de esta captura')).not.toBeChecked()
  await userEvent.click(screen.getByLabelText('He revisado los cambios de esta captura'))
  await userEvent.click(screen.getByRole('button', {name: 'Confirmar actualización de borrador'}))
  await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
  expect(update.mock.calls[0].slice(2)).toEqual([['k'], preview.candidateDigest])
})
it('preserves content on 409 and requires a fresh comparison', async () => {
  const {repository} = setup()
  vi.spyOn(repository, 'update').mockRejectedValue(new ApiRequestError(409, 'capture_changed', 'El catálogo cambió'))
  await userEvent.click(screen.getByRole('button', {name: 'Comprobar cambios del catálogo'}))
  await screen.findByText('Nueva definición')
  await userEvent.click(screen.getByLabelText('He revisado los cambios de esta captura'))
  await userEvent.click(screen.getByRole('button', {name: 'Confirmar actualización de borrador'}))
  await screen.findByText('El catálogo cambió')
  expect(screen.getByRole('button', {name: 'Confirmar actualización de borrador'})).toBeDisabled()
  expect(screen.getByText('Vuelve a comparar antes de confirmar.')).toBeInTheDocument()
})
it('does not save after a departed preview resolves', async () => {
  const {read, onSaved} = setup()
  let resolve!: (value: typeof preview) => void
  read.mockReturnValue(new Promise(r => {resolve = r}))
  await userEvent.click(screen.getByRole('button', {name: 'Comprobar cambios del catálogo'}))
  cleanup()
  await act(async () => resolve(preview))
  expect(onSaved).not.toHaveBeenCalled()
})

it('changes comparison tabs with arrow keys without applying a capture', async () => {
  setup()
  screen.getByRole('tab', {name: 'Borrador vs catálogo actual'}).focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(screen.getByRole('tab', {name: 'Entre versiones guardadas'})).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', {name: 'Entre versiones guardadas'})).toHaveFocus()
})
