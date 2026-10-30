import { useEffect, useState } from 'react'
import { Button, Icon } from '@bi-analytics/design-system'
import { ApiRequestError, type ApiRepository, type QueryPeriod, type QueryResult } from '../adapters/apiRepository'
import type { PublishedKpi } from '../domain/kpis'

export function LiveKpiValue({ api, kpi, version, period, onAccessLost }: { api: ApiRepository; kpi: PublishedKpi; version: number; period: QueryPeriod; onAccessLost?: () => void }) {
  const [state, setState] = useState<{ loading: boolean; result?: QueryResult; error?: string }>({ loading: true })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState({ loading: true })
    api.query(kpi, version, period, controller.signal).then(result => {
      if (!controller.signal.aborted) setState({ loading: false, result })
    }).catch(reason => { if (!controller.signal.aborted) { if (period.dashboardId && reason instanceof ApiRequestError && reason.status === 404 && reason.code === 'dashboard_not_found') onAccessLost?.(); else setState({ loading: false, error: reason instanceof Error ? reason.message : 'Error al consultar el KPI.' }) } })
    return () => controller.abort()
  }, [api, kpi, version, period.startDate, period.endDate, period.channel, period.dashboardId, onAccessLost, attempt])
  if (state.loading) return <p role="status">Consultando KPI…</p>
  if (state.error) return <div className="kpi-query-state kpi-query-state-error"><span className="kpi-query-state-icon"><Icon name="cloud-off" size={24} /></span><strong>No se pudo cargar</strong><p role="alert" className="kpi-error">{state.error}</p><Button variant="outline" onClick={() => setAttempt(a => a + 1)}>Reintentar consulta</Button></div>
  const result = state.result!
  if (result.status === 'empty') return <div className="kpi-query-state kpi-query-state-empty" role="status"><span className="kpi-query-state-icon"><Icon name="calendar-off" size={24} /></span><strong>Sin datos para este período</strong><p>No hay resultados para el rango y los filtros seleccionados.</p></div>
  const value = result.rows[0]?.value
  const confidence = (status?: string) => status === 'not_evaluated' ? 'sin evaluar' : 'No disponible'
  const lineage = result.metadata.lineageStatus === 'unavailable' ? '' : result.metadata.lineage?.map(node => node.label).filter(label => label.trim()).join(' → ')
  return <div className="kpi-live-value"><strong>{value == null ? 'Sin valor: denominador no definido' : `${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} ${result.unit}`}</strong><p>{result.metadata.dataMode === 'synthetic' ? 'Cálculo sobre registros sintéticos' : 'Consulta del modelo semántico'} · Versión {result.modelVersion}</p><p>Último dato: {result.metadata.sourceUpdatedAt?.trim() || 'No disponible'} · Calidad: {confidence(result.metadata.quality?.status)} · Frescura: {confidence(result.metadata.freshness?.status)}</p><p>Linaje: {lineage || 'No disponible'}</p></div>
}
