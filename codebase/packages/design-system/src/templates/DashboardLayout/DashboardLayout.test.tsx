import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardLayout } from './DashboardLayout'

describe('DashboardLayout', () => {
  it('supports keyboard-accessible navigation', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<DashboardLayout navigation={[{ label: 'Overview', href: '/overview' }]} onNavigate={onNavigate}><h1>Dashboard</h1></DashboardLayout>)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onNavigate).toHaveBeenCalledWith('/overview')
  })
})
