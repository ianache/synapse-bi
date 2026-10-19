import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, expect, it, vi} from 'vitest'
import {ApiRepository} from '../adapters/apiRepository'
import {publishedKpis} from '../domain/kpis'
import {LiveKpiValue} from './LiveKpiValue'
import userEvent from '@testing-library/user-event'

afterEach(() => {cleanup(); vi.unstubAllGlobals()})

const period = {startDate: '2026-10-01', endDate: '2026-10-03'}
function show(metadata: Record<string, unknown>) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    kpiId: 'kpi_fin_net_revenue', modelId: 'sales-demo', modelVersion: 1, unit: 'PEN',
    status: 'success', rows: [{dimension: null, value: '3100.00'}], metadata,
  }), {status: 200})))
  render(<LiveKpiValue api={new ApiRepository(false, async () => 'test-session')} kpi={publishedKpis[0]} version={1} period={period} />)
}

it('displays the query confidence metadata without claiming certification', async () => {
  show({dataMode: 'synthetic', sourceUpdatedAt: '2026-10-03', queriedAt: '2026-10-18T21:00:00Z',
    quality: {status: 'not_evaluated', score: null}, freshness: {status: 'not_evaluated', policy: null},
    lineage: [{id: 'source', label: 'Registros sintéticos', kind: 'source'}, {id: 'model', label: 'Modelo de ejemplo', kind: 'model'}],
    lineageStatus: 'available'})
  expect(await screen.findByText('3,100.00 PEN')).toBeInTheDocument()
  expect(screen.getByText(/Calidad: sin evaluar/i)).toBeInTheDocument()
  expect(screen.getByText(/Frescura: sin evaluar/i)).toBeInTheDocument()
  expect(screen.getByText(/Registros sintéticos → Modelo de ejemplo/)).toBeInTheDocument()
})

it.each([{}, {sourceUpdatedAt: null, quality: null, freshness: null, lineage: null},
  {sourceUpdatedAt: '', quality: {status: 'unknown'}, freshness: {status: ''}, lineage: []}])(
  'keeps the numerical result when confidence metadata is unavailable: %j', async metadata => {
    show({dataMode: 'synthetic', queriedAt: '2026-10-18T21:00:00Z', ...metadata})
    expect(await screen.findByText('3,100.00 PEN')).toBeInTheDocument()
    expect(screen.getByText(/Último dato: No disponible/)).toBeInTheDocument()
    expect(screen.getByText(/Calidad: No disponible/)).toBeInTheDocument()
    expect(screen.getByText(/Frescura: No disponible/)).toBeInTheDocument()
    expect(screen.getByText('Linaje: No disponible')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

it.each([403, 404])('clears the previous result when authorization changes to %s', async status => {
  let permitted = true
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(permitted ? {
    kpiId: 'kpi_fin_net_revenue', modelId: 'sales-demo', modelVersion: 1, unit: 'PEN',
    status: 'success', rows: [{dimension: null, value: '3100.00'}],
    metadata: {dataMode: 'synthetic', sourceUpdatedAt: '2026-10-03', queriedAt: '2026-10-18T21:00:00Z',
      quality: {status: 'not_evaluated', score: null}, freshness: {status: 'not_evaluated', policy: null},
      lineage: [], lineageStatus: 'unavailable'},
  } : {error: {code: status === 403 ? 'permission_denied' : 'kpi_not_found',
    message: status === 403 ? 'No tienes permiso.' : 'KPI o versión no disponible.', requestId: 'test-request'}}),
  {status: permitted ? 200 : status})))
  const api = new ApiRepository(false, async () => 'test-session')
  const {rerender} = render(<LiveKpiValue api={api} kpi={publishedKpis[0]} version={1} period={period} />)
  expect(await screen.findByText('3,100.00 PEN')).toBeInTheDocument()
  permitted = false
  rerender(<LiveKpiValue api={api} kpi={publishedKpis[0]} version={1} period={{...period, channel: 'Digital'}} />)
  expect(await screen.findByRole('alert')).toHaveTextContent(status === 403 ? 'No tienes permiso.' : 'KPI o versión no disponible.')
  expect(screen.queryByText('3,100.00 PEN')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', {name: 'Reintentar consulta'}))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  expect(screen.queryByText('3,100.00 PEN')).not.toBeInTheDocument()
})
