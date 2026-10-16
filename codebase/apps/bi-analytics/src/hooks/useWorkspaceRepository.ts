import { useCallback, useEffect, useState } from 'react'
import { ApiRepository } from '../adapters/apiRepository'
import { loadDashboards, saveDashboards, type LocalDashboard } from '../adapters/localDashboards'
import { publishedKpis, type PublishedKpi } from '../domain/kpis'

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

export function useWorkspaceRepository() {
  const [api] = useState(() => env.VITE_DATA_SOURCE === 'api' ? new ApiRepository(env.VITE_API_AUTH === 'development') : null)
  const [dashboards, setDashboards] = useState<LocalDashboard[]>(() => api ? [] : loadDashboards())
  const [kpis, setKpis] = useState<PublishedKpi[]>(api ? [] : publishedKpis)
  const [loading, setLoading] = useState(!!api)
  const [error, setError] = useState('')
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!api) return
    setLoading(true); setError('')
    try {
      const data = await api.load(signal)
      if (!signal?.aborted) { setDashboards(data.dashboards); setKpis(data.kpis) }
    } catch (reason) {
      if (!signal?.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo conectar con la API.')
    } finally { if (!signal?.aborted) setLoading(false) }
  }, [api])
  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])

  function failure(reason: unknown) {
    setError(api ? reason instanceof Error ? reason.message : 'No se pudo guardar en la API.' : 'No se pudo guardar en este navegador. Comprueba el almacenamiento disponible y vuelve a intentarlo; tu selección se conserva.')
    return null
  }

  async function createDashboard(name: string): Promise<LocalDashboard | null> {
    try {
      const created = api ? await api.createDashboard(name) : { id: crypto.randomUUID(), name, owner: 'Ana Rivas', updated: 'Ahora', visualizations: 0, shared: false, editable: true, kpiIds: [] }
      const next = [...dashboards, created]
      if (!api) saveDashboards(next)
      setDashboards(next); setError('')
      return created
    } catch (reason) { return failure(reason) }
  }

  async function addKpi(dashboard: LocalDashboard, kpi: PublishedKpi): Promise<LocalDashboard | null> {
    try {
      const updated = api ? await api.addKpi(dashboard, kpi) : { ...dashboard, kpiIds: [...dashboard.kpiIds, kpi.id], visualizations: dashboard.visualizations + 1, updated: 'Ahora' }
      const next = dashboards.map(d => d.id === updated.id ? updated : d)
      if (!api) saveDashboards(next)
      setDashboards(next); setError('')
      return updated
    } catch (reason) { return failure(reason) }
  }

  return { api, dashboards, kpis, loading, error, refresh, createDashboard, addKpi }
}
