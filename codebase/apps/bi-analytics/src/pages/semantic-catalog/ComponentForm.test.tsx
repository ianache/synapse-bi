import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ComponentForm } from './ComponentForm'
import { domain, measure, repository } from './testFixtures'

it('saves a minimal dimension without mapping, unit or inferred grain', async () => {
  const repo = repository(), done = vi.fn()
  const create = vi.spyOn(repo, 'createComponent').mockResolvedValue({...measure, kind: 'dimension', protected: false})
  vi.spyOn(repo, 'get').mockResolvedValue({...measure, kind: 'dimension', protected: false})
  render(<ComponentForm repository={repo} domains={[domain]} onSaved={done} />)
  await userEvent.type(screen.getByLabelText('Nombre'), 'Centro')
  await userEvent.selectOptions(screen.getByLabelText('Dominio'), 'd')
  expect(screen.queryByLabelText('Unidad')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(done).toHaveBeenCalled())
  expect(create.mock.calls[0][0]).toMatchObject({name: 'Centro', kind: 'dimension', domainId: 'd', binding: null, grain: null})
})

it('protects all metadata of a used component, not only physical mapping', () => {
  render(<ComponentForm repository={repository()} domains={[domain]} initial={measure} onSaved={() => {}} />)
  expect(screen.getByLabelText('Nombre')).toBeDisabled()
  expect(screen.getByLabelText('Definición')).toBeDisabled()
  expect(screen.queryByRole('button', {name: 'Guardar borrador'})).not.toBeInTheDocument()
  expect(screen.getByText(/Protegida desde su primer uso/)).toBeInTheDocument()
})

it('allows typing multiple synonyms without swallowing the separator', async () => {
  render(<ComponentForm repository={repository()} domains={[domain]} onSaved={() => {}} />)
  const field = screen.getByLabelText('Sinónimos (separados por punto y coma)')
  await userEvent.type(field, 'Zona; Región')
  expect(field).toHaveValue('Zona; Región')
})

it('omits an occluded binding when saving unrelated metadata instead of requesting removal', async () => {
  const repo = repository()
  const hidden = {...measure, protected: false, bindingStatus: 'unavailable' as const}
  const update = vi.spyOn(repo, 'update').mockResolvedValue(hidden)
  vi.spyOn(repo, 'get').mockResolvedValue(hidden)
  render(<ComponentForm repository={repo} domains={[domain]} initial={hidden} onSaved={() => {}} />)
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(update).toHaveBeenCalledOnce())
  expect(Object.hasOwn(update.mock.calls[0][2], 'binding')).toBe(false)
  expect(screen.queryByLabelText('Declarar vínculo a datos (opcional)')).not.toBeInTheDocument()
})
