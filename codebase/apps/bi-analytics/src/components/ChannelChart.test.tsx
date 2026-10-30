import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, it, expect } from 'vitest'
import { ChannelChart } from './ChannelChart'
import { publishedKpis } from '../domain/kpis'
import type { ApiRepository } from '../adapters/apiRepository'

it('loads channel bars and selects a channel without filtering its own comparison', async () => {
  const request = vi.fn().mockResolvedValue({ status: 'success', rows: [{ dimension: 'Digital', value: '1400.00' }, { dimension: 'Tienda', value: '1700.00' }], unit: 'PEN' })
  const select = vi.fn()
  render(<ChannelChart api={{ request } as unknown as ApiRepository} kpi={publishedKpis[0]} version={1} period={{ startDate: '2026-10-01', endDate: '2026-10-03', channel: 'Digital' }} onSelect={select} />)
  const digital = await screen.findByRole('button', { name: /Digital/ })
  expect(digital).toHaveAttribute('aria-pressed', 'true')
  const body = JSON.parse(request.mock.calls[0][1].body)
  expect(body.groupBy).toBe('channel')
  expect(body.channel).toBeUndefined()
  await userEvent.click(screen.getByRole('button', { name: /Tienda/ }))
  expect(select).toHaveBeenCalledWith('Tienda')
  await userEvent.click(digital)
  expect(select).toHaveBeenCalledWith('')
})

it('shows a recoverable error and retries only the chart', async () => {
  const request = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ status: 'empty', rows: [], unit: 'PEN' })
  render(<ChannelChart api={{ request } as unknown as ApiRepository} kpi={publishedKpis[0]} version={1} period={{ startDate: '2026-10-01', endDate: '2026-10-03' }} onSelect={() => {}} />)
  await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
  await waitFor(() => expect(screen.getByText('Sin datos para este período')).toBeInTheDocument())
})
