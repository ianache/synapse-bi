import { useEffect, useState } from 'react'
import { ApiRequestError, type ApiRepository, type QueryPeriod, type QueryResult } from '../adapters/apiRepository'
import type { PublishedKpi } from '../domain/kpis'

export function ChannelChart({ api, kpi, version, period, onSelect, onAccessLost }: { api: ApiRepository; kpi: PublishedKpi; version: number; period: QueryPeriod; onSelect: (channel: string) => void; onAccessLost?: () => void }) {
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setResult(null); setError(false)
    api.request<QueryResult>('/queries', { method: 'POST', signal: controller.signal, body: JSON.stringify({ kpiId: kpi.id, modelVersion: version, startDate: period.startDate, endDate: period.endDate, dashboardId: period.dashboardId, groupBy: 'channel' }) })
      .then(data => { if (!controller.signal.aborted) setResult(data) })
      .catch(reason => { if (!controller.signal.aborted) { if (period.dashboardId && reason instanceof ApiRequestError && reason.status === 404 && reason.code === 'dashboard_not_found') onAccessLost?.(); else setError(true) } })
    return () => controller.abort()
  }, [api, kpi.id, version, period.startDate, period.endDate, period.dashboardId, onAccessLost, attempt])
  const rows = result?.rows.filter(row => row.dimension === 'Digital' || row.dimension === 'Tienda') ?? []
  const max = Math.max(0, ...rows.map(row => row.value === null ? 0 : Number(row.value)).filter(Number.isFinite))
  return <section className="channel-chart" aria-label={`Distribución de ${kpi.name} por canal`}><h2>Distribución de {kpi.name} por canal</h2>
    {error ? <div role="alert"><p>No se pudo cargar</p><button type="button" onClick={() => setAttempt(n => n + 1)}>Reintentar</button></div> : !result ? <p role="status">Cargando…</p> : result.status === 'empty' || !rows.length ? <p>Sin datos para este período</p> : <div className="channel-chart-bars">{rows.map(row => <button type="button" key={row.dimension} aria-pressed={period.channel === row.dimension} onClick={() => onSelect(period.channel === row.dimension ? '' : row.dimension ?? '')}><span className="channel-chart-label"><span>{row.dimension}</span><strong>{row.value ?? 'No disponible'} {result.unit}</strong></span><span aria-hidden="true" className="channel-chart-track"><span className="channel-chart-fill" style={{ width: `${max && row.value !== null && Number.isFinite(Number(row.value)) ? Math.max(0, Number(row.value)) / max * 100 : 0}%` }} /></span></button>)}</div>}
  </section>
}
