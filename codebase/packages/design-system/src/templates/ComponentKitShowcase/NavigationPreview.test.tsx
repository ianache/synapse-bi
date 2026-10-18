import {cleanup, render, screen, within} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, expect, it} from 'vitest'
import {NavigationPreview} from './NavigationPreview'
afterEach(cleanup)
it('demonstrates the same public organisms with local selection and honest unavailable actions', async () => {
  const user=userEvent.setup()
  const {container}=render(<NavigationPreview/>)
  expect(screen.getByText('Demostración de navegación')).toBeVisible()
  expect(container.querySelector('.bi-menubar')).toBeInTheDocument()
  expect(container.querySelector('.bi-mainbar')).toBeInTheDocument()
  const nav=within(screen.getByRole('navigation',{name:'Navegación principal'}))
  await user.click(nav.getByRole('link',{name:'Catálogo semántico'}))
  expect(nav.getByRole('link',{name:'Catálogo semántico'})).toHaveAttribute('aria-current','page')
  const notification=screen.getByRole('button',{name:'Notificaciones · no disponible'})
  expect(notification).toBeDisabled()
  await user.click(notification)
  expect(nav.getByRole('link',{name:'Catálogo semántico'})).toHaveAttribute('aria-current','page')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
