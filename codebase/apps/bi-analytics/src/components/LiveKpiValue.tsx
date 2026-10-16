import { useEffect, useState } from 'react'
import { Button } from '@bi-analytics/design-system'
import type { ApiRepository, QueryPeriod, QueryResult } from '../adapters/apiRepository'
import type { PublishedKpi } from '../domain/kpis'

export function LiveKpiValue({ api, kpi, version, period }: { api: ApiRepository; kpi: PublishedKpi; version: number; period: QueryPeriod }) {
  const [state, setState] = useState<{ loading: boolean; result?: QueryResult; error?: string }>({ loading: true })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState({ loading: true })
    api.query(kpi, version, period, controller.signal).then(result => {
      if (!controller.signal.aborted) setState({ loading: false, result })
    }).catch(reason => { if (!controller.signal.aborted) setState({ loading: false, error: reason instanceof Error ? reason.message : 'Error al consultar el KPI.' }) })
    return () => controller.abort()
  }, [api, kpi, version, period.startDate, period.endDate, period.channel, attempt])
  if (state.loading) return <p role="status">Consultando KPI…</p>
  if (state.error) return <div><p role="alert" className="kpi-error">{state.error}</p><Button variant="outline" onClick={() => setAttempt(a => a + 1)}>Reintentar consulta</Button></div>
  const result = state.result!
  const value = result.rows[0]?.value
  return <div className="kpi-live-value"><strong>{result.status === 'empty' ? 'Sin datos en este período' : value == null ? 'Sin valor: denominador no definido' : `${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} ${result.unit}`}</strong><p>{result.metadata.dataMode === 'synthetic' ? 'Cálculo sobre registros sintéticos' : 'Consulta del modelo semántico'} · Versión {result.modelVersion}</p><p>Último dato: {result.metadata.sourceUpdatedAt ?? 'No disponible'} · Calidad: sin evaluar</p></div>
}
