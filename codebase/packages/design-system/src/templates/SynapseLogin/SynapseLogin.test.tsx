import {cleanup,render,screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach,describe,it,expect,vi} from 'vitest'
import {SynapseLogin} from './SynapseLogin'
afterEach(cleanup)
describe('Synapse Login',()=>{
 it('renders the original welcome and shows a failed SSO handoff without success feedback',async()=>{
  const user=userEvent.setup(),login=vi.fn().mockRejectedValue(new Error('SSO no configurado'))
  render(<SynapseLogin onLogin={login}/>)
  expect(screen.getByRole('heading',{name:'Bienvenido al portal analítico'})).toBeInTheDocument()
  await user.click(screen.getByRole('button',{name:/Iniciar sesión con Red Hat Keycloak/}))
  expect(login).toHaveBeenCalledTimes(1)
  expect(await screen.findByRole('alert')).toHaveTextContent('SSO no configurado')
  expect(screen.queryByText('Conexión SSO Establecida')).not.toBeInTheDocument()
 })
 it('exposes six service states and closes the popup with Escape',async()=>{
  const user=userEvent.setup()
  render(<SynapseLogin onLogin={()=>undefined}/>)
  const trigger=screen.getByRole('button',{name:'Estado de servicios'})
  await user.click(trigger)
  expect(trigger).toHaveAttribute('aria-expanded','true')
  expect(screen.getByRole('region',{name:'Estado de servicios'})).toBeInTheDocument()
  expect(screen.getAllByRole('img',{name:/Sin verificar/})).toHaveLength(6)
  await user.keyboard('{Escape}')
  expect(trigger).toHaveAttribute('aria-expanded','false')
  expect(trigger).toHaveFocus()
 })
})
