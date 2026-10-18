import {StrictMode, useState} from 'react'
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, beforeEach, expect, it, vi} from 'vitest'
import {Menubar} from './Menubar'

let desktop = false
const listeners = new Set<(event: {matches: boolean}) => void>()
beforeEach(() => {
  desktop = false
  vi.stubGlobal('matchMedia', () => ({get matches() {return desktop}, addEventListener: (_: string, fn: (e: {matches:boolean})=>void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: {matches:boolean})=>void) => listeners.delete(fn)}))
  // jsdom lacks native dialog top-layer methods; tests assert DOM/focus, not mock calls.
  HTMLDialogElement.prototype.showModal = function() {this.setAttribute('open', '')}
  HTMLDialogElement.prototype.close = function() {this.removeAttribute('open')}
})
afterEach(() => {cleanup(); document.querySelectorAll('dialog[data-business]').forEach(el => el.remove()); listeners.clear(); vi.unstubAllGlobals(); document.body.style.overflow = ''})
function Harness() {
  const [open, setOpen] = useState(false)
  return <><button onClick={() => setOpen(true)}>Abrir menú</button>
    <Menubar id="drawer" brand={{label: 'Synapse BI', href: '/'}} groups={[{id: 'g', label: 'General', items:[{id: 'home', label: 'Inicio', href: '/'}]}]}
      mobileOpen={open} onMobileClose={() => setOpen(false)} onNavigate={() => undefined}/>
    <button>Fuera</button></>
}
it('opens and traps focus then restores the trigger on Escape', async () => {
  const user = userEvent.setup()
  render(<Harness/>)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', {name: 'Abrir menú'}))
  const dialog = screen.getByRole('dialog', {name: 'Navegación principal'})
  expect(dialog).toHaveAttribute('aria-modal', 'true')
  expect(document.body.style.overflow).toBe('hidden')
  const home = within(dialog).getByRole('link', {name: 'Inicio'})
  home.focus()
  await user.tab()
  expect(within(dialog).getByRole('button', {name: 'Cerrar navegación'})).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', {name: 'Abrir menú'})).toHaveFocus()
})
it('backdrop and ordinary navigation close, modified navigation does not', async () => {
  const user = userEvent.setup()
  render(<Harness/>)
  const open = () => user.click(screen.getByRole('button', {name:'Abrir menú'}))
  await open()
  fireEvent.click(screen.getByRole('link', {name: 'Inicio'}), {ctrlKey: true})
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  await user.click(screen.getByRole('link', {name:'Inicio'}))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await open()
  fireEvent.click(screen.getByRole('dialog'), {clientX: 500, clientY: 100})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('desktop transition releases modal effects and returns to mobile closed', async () => {
  const user = userEvent.setup()
  render(<Harness/>)
  await user.click(screen.getByRole('button', {name:'Abrir menú'}))
  act(() => {desktop=true; listeners.forEach(fn => fn({matches:true}))})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(document.body.style.overflow).toBe('')
  expect(screen.getByRole('navigation', {name:'Navegación principal'})).toBeVisible()
  act(() => {desktop=false; listeners.forEach(fn => fn({matches:false}))})
  expect(screen.queryByRole('link', {name:'Inicio'})).not.toBeInTheDocument()
})
it('StrictMode unmount restores prior scroll and removes listeners', async () => {
  document.body.style.overflow = 'clip'
  const user = userEvent.setup(), view = render(<StrictMode><Harness/></StrictMode>)
  await user.click(screen.getByRole('button', {name:'Abrir menú'}))
  expect(document.body.style.overflow).toBe('hidden')
  view.unmount()
  expect(document.body.style.overflow).toBe('clip')
  expect(listeners.size).toBe(0)
})
it('does not steal keyboard or focus from a business dialog above the drawer', async () => {
  const user = userEvent.setup()
  render(<Harness/>)
  await user.click(screen.getByRole('button', {name:'Abrir menú'}))
  const business = document.createElement('dialog')
  business.dataset.business = 'true'
  business.setAttribute('open','')
  const input = document.createElement('input')
  business.append(input)
  document.body.append(business)
  input.focus()
  fireEvent.keyDown(input, {key:'Escape'})
  expect(screen.getByRole('dialog', {name:'Navegación principal'})).toBeInTheDocument()
  expect(input).toHaveFocus()
  business.remove()
})
