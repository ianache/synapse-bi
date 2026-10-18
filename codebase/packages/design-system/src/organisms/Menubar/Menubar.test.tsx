import {cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {Menubar} from './Menubar'
import type {MenubarProps} from '../navigation/types'

afterEach(cleanup)
const props: MenubarProps = {
  id: 'navigation', brand: {label: 'Synapse BI', subtitle: 'Semantic Intelligence', badge: 'Enterprise', href: '/'},
  groups: [
    {id: 'general', label: 'General', items: [{id: 'home', label: 'Inicio', href: '/', icon: 'home'}]},
    {id: 'governance', label: 'Gobernanza & Semántica', items: [
      {id: 'models', label: 'Modelos semánticos', href: '/modelos-semanticos', icon: 'layers'},
      {id: 'glossary', label: 'Glosario', unavailableReason: 'No implementado'},
    ]},
  ], activeItemId: 'models', mobileOpen: false, onMobileClose: () => undefined,
}
describe('Menubar', () => {
  it('renders groups and exactly the configured active destination', () => {
    render(<Menubar {...props}/>)
    const nav = within(screen.getByRole('navigation', {name: 'Navegación principal'}))
    expect(nav.getByText('General')).toBeVisible()
    expect(nav.getByText('Gobernanza & Semántica')).toBeVisible()
    expect(nav.getByRole('link', {name: 'Modelos semánticos'})).toHaveAttribute('aria-current', 'page')
    expect(nav.getByRole('link', {name: 'Inicio'})).not.toHaveAttribute('aria-current')
  })
  it('does not turn unavailable destinations into fake links or capabilities', () => {
    render(<Menubar {...props} quickAction={{id: 'query', label: 'Nueva consulta SQL/BI', unavailableReason: 'Motor no disponible'}}/>)
    expect(screen.queryByRole('link', {name: /Glosario/})).not.toBeInTheDocument()
    expect(screen.getByText(/Glosario.*no disponible/)).toBeVisible()
    expect(screen.getByRole('button', {name: /Nueva consulta SQL\/BI.*no disponible/})).toBeDisabled()
  })
  it('navigates ordinary links and the brand through the supplied callback', async () => {
    const onNavigate = vi.fn(), user = userEvent.setup()
    render(<Menubar {...props} onNavigate={onNavigate}/>)
    await user.click(screen.getByRole('link', {name: 'Modelos semánticos'}))
    expect(onNavigate).toHaveBeenLastCalledWith('/modelos-semanticos')
    await user.click(screen.getByRole('link', {name: /Synapse BI/}))
    expect(onNavigate).toHaveBeenLastCalledWith('/')
  })
  it.each([{ctrlKey: true}, {metaKey: true}, {shiftKey: true}, {altKey: true}, {button: 1}])('preserves native modified navigation %j', modifiers => {
    const onNavigate = vi.fn()
    render(<Menubar {...props} onNavigate={onNavigate}/>)
    let preventedByComponent = true
    document.addEventListener('click', event => {preventedByComponent = event.defaultPrevented; event.preventDefault()}, {once: true})
    fireEvent.click(screen.getByRole('link', {name: 'Inicio'}), modifiers)
    expect(preventedByComponent).toBe(false)
    expect(onNavigate).not.toHaveBeenCalled()
  })
  it('does not fabricate a selection or organization when absent', () => {
    render(<Menubar {...props} activeItemId={undefined}/>)
    expect(screen.getAllByRole('link').some(link => link.hasAttribute('aria-current'))).toBe(false)
    expect(screen.queryByText('Corporación Global S.A.')).not.toBeInTheDocument()
  })
})
