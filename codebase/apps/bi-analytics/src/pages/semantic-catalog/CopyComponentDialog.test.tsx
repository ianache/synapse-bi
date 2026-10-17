import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { CopyComponentDialog } from './CopyComponentDialog'
import { measure, repository } from './testFixtures'

// jsdom omits the native dialog API. Keep the real Modal; polyfill browser methods only.
const show = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal')
const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close')
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {configurable: true, value: function(this: HTMLDialogElement) { this.setAttribute('open', '') }})
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {configurable: true, value: function(this: HTMLDialogElement) { this.removeAttribute('open') }})
})
afterAll(() => {
  if (show) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', show)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close)
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

it('copy requires explicit KPI reassignment and creates no consumer mutations', async () => {
  const repo = repository(), done = vi.fn()
  const copy = vi.spyOn(repo, 'copyComponent').mockResolvedValue({...measure, id: 'copy', protected: false, consumerCount: 0, copyOriginId: 'm'})
  const update = vi.spyOn(repo, 'update')
  vi.spyOn(repo, 'get').mockResolvedValue({...measure, id: 'copy', protected: false, consumerCount: 0})
  render(<CopyComponentDialog repository={repo} component={measure} onClose={() => {}} onSaved={done} />)
  expect(screen.getByRole('dialog', {name: 'Crear copia'})).toBeInTheDocument()
  expect(screen.getByText(/No reasigna ningún KPI/)).toBeInTheDocument()
  await userEvent.type(screen.getByLabelText('Nombre de la copia'), 'Ajustada')
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(copy).toHaveBeenCalledOnce())
  expect(update).not.toHaveBeenCalled()
})
