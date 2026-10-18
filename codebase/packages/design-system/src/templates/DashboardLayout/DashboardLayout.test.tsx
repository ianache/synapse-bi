import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {afterEach, describe, expect, it, vi} from 'vitest'
import { DashboardLayout } from './DashboardLayout'

describe('DashboardLayout', () => {
  afterEach(cleanup)
  it('supports keyboard-accessible navigation', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<DashboardLayout navigation={[{ label: 'Overview', href: '/overview' }]} onNavigate={onNavigate}><h1>Dashboard</h1></DashboardLayout>)
    screen.getByRole('link', {name: 'Overview'}).focus()
    await user.keyboard('{Enter}')
    expect(onNavigate).toHaveBeenCalledWith('/overview')
  })
  it('shares the public organisms and preserves modified link behavior', () => {
    const onNavigate=vi.fn()
    const {container}=render(<DashboardLayout navigation={[{label:'Overview',href:'/overview'}]} onNavigate={onNavigate}><h1>Dashboard</h1></DashboardLayout>)
    expect(container.querySelector('.bi-menubar')).toBeInTheDocument()
    expect(container.querySelector('.bi-mainbar')).toBeInTheDocument()
    let preventedByComponent=true
    document.addEventListener('click', event => {preventedByComponent=event.defaultPrevented; event.preventDefault()}, {once:true})
    fireEvent.click(screen.getByRole('link',{name:'Overview'}),{ctrlKey:true})
    expect(preventedByComponent).toBe(false)
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
