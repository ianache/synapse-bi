import {cleanup, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, expect, it, vi} from 'vitest'
import {Mainbar} from './Mainbar'
import type {MainbarProps} from '../navigation/types'

afterEach(cleanup)
const props: MainbarProps = {breadcrumbs: [{id:'home',label:'Inicio',href:'/'},{id:'entity',label:'Ventas / Canal'}],
  menubarId:'main-nav',mobileMenuOpen:false,onMobileMenuToggle:()=>undefined}
it('keeps structured labels intact and marks the current location without a fake link', () => {
  render(<Mainbar {...props}/>)
  const nav=within(screen.getByRole('navigation',{name:'Ruta de navegación'}))
  expect(nav.getAllByRole('listitem')).toHaveLength(2)
  expect(nav.getByText('Ventas / Canal')).toHaveAttribute('aria-current','page')
  expect(nav.queryByRole('link',{name:'Ventas / Canal'})).not.toBeInTheDocument()
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
})
it('connects the mobile toggle to its controlled Menubar', async () => {
  const user=userEvent.setup(),onMobileMenuToggle=vi.fn()
  const view=render(<Mainbar {...props} onMobileMenuToggle={onMobileMenuToggle}/>)
  const toggle=screen.getByRole('button',{name:'Abrir navegación'})
  expect(toggle).toHaveAttribute('aria-controls','main-nav')
  expect(toggle).toHaveAttribute('aria-expanded','false')
  await user.click(toggle)
  expect(onMobileMenuToggle).toHaveBeenCalledOnce()
  view.rerender(<Mainbar {...props} mobileMenuOpen/>)
  expect(screen.getByRole('button',{name:'Cerrar navegación'})).toHaveAttribute('aria-expanded','true')
})
it('does not invent utility handlers or a role selector', () => {
  render(<Mainbar {...props} actions={[{id:'bell',label:'Notificaciones',icon:'bell',unavailableReason:'Servicio no implementado'}]}
    profile={{name:'Persona de prueba',description:'Perfil proporcionado',initials:'PP'}}/>)
  expect(screen.getByRole('button',{name:'Notificaciones · no disponible'})).toBeDisabled()
  expect(screen.getByText('Persona de prueba')).toBeInTheDocument()
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.queryByRole('button',{name:/Persona de prueba/})).not.toBeInTheDocument()
  expect(screen.queryByText('Administrador de datos')).not.toBeInTheDocument()
})
it('executes only supplied actions and navigation', async () => {
  const user=userEvent.setup(),onAction=vi.fn(),onNavigate=vi.fn()
  render(<Mainbar {...props} onNavigate={onNavigate} actions={[{id:'help',label:'Ayuda',onAction}]}/>)
  await user.click(screen.getByRole('button',{name:'Ayuda'}))
  expect(onAction).toHaveBeenCalledOnce()
  await user.click(screen.getByRole('link',{name:'Inicio'}))
  expect(onNavigate).toHaveBeenCalledWith('/')
})
it('shows a neutral state when no identity is available', () => {
  render(<Mainbar {...props}/>)
  expect(screen.getByText('Perfil no disponible')).toBeInTheDocument()
  expect(screen.queryByText('AD')).not.toBeInTheDocument()
})
