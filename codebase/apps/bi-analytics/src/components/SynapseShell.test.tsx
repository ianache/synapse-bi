import {cleanup, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, expect, it, vi} from 'vitest'
import {SynapseShell} from './SynapseShell'
afterEach(() => {cleanup(); vi.unstubAllGlobals()})

it.each([
  ['/', 'explore', 'Inicio'], ['/explorar','explore','Explorar KPI'], ['/dashboards/d1','dashboards','Dashboards'],
  ['/fuentes/nueva','sources','Fuentes de datos'], ['/datasets/nuevo','datasets','Datasets'],
  ['/catalogo-semantico/domains/d1','semantic','Catálogo semántico'],
  ['/modelos-semanticos/m1/borradores/b1/comparar','models','Modelos semánticos'],
] as const)('composes the same organisms and correct active link on %s', (path, active, label) => {
  window.history.pushState({},'',path)
  const {container}=render(<SynapseShell active={active} breadcrumb="Ubicación"><h1>Contenido de prueba</h1></SynapseShell>)
  expect(container.querySelectorAll('.bi-menubar')).toHaveLength(1)
  expect(container.querySelectorAll('.bi-mainbar')).toHaveLength(1)
  const nav=within(screen.getByRole('navigation',{name:'Navegación principal'}))
  expect(nav.getByRole('link',{name:label})).toHaveAttribute('aria-current','page')
  expect(nav.getByRole('link',{name:'Modelos semánticos'})).toHaveAttribute('href','/modelos-semanticos')
  expect(screen.getByRole('heading',{name:'Contenido de prueba'})).toBeVisible()
})
it('does not replace entered content while toggling mobile navigation', async () => {
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>undefined,removeEventListener:()=>undefined}))
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
  const user=userEvent.setup()
  render(<SynapseShell active="datasets" breadcrumb="Datasets"><label>Nombre propio<input/></label></SynapseShell>)
  await user.type(screen.getByRole('textbox',{name:'Nombre propio'}),'Conservar selección')
  await user.click(screen.getByRole('button',{name:'Abrir navegación'}))
  await user.keyboard('{Escape}')
  expect(screen.getByRole('textbox',{name:'Nombre propio'})).toHaveValue('Conservar selección')
})
it('accepts structured breadcrumbs without splitting entity names',()=>{
  render(<SynapseShell active="models" breadcrumb="Fallback" breadcrumbs={[{id:'entity',label:'Modelo / Operaciones'}]}><p>Contenido</p></SynapseShell>)
  const breadcrumb=within(screen.getByRole('navigation',{name:'Ruta de navegación'}))
  expect(breadcrumb.getAllByRole('listitem')).toHaveLength(1)
  expect(breadcrumb.getByText('Modelo / Operaciones')).toHaveAttribute('aria-current','page')
})
