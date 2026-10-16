import { useCallback, useEffect, useRef, useState } from 'react'
import type { SemanticQueryState } from '@bi-analytics/design-system'
import type { DashboardData, SemanticAdapter } from '../domain/semantic'

export function useDashboardQuery(adapter: SemanticAdapter) {
  const [state, setState] = useState<SemanticQueryState<DashboardData>>({ status: 'idle' })
  const requestId = useRef(0)
  const load = useCallback(async () => { const currentRequest = ++requestId.current; setState({ status: 'loading' }); try { const next = await adapter.getDashboard(); if (currentRequest === requestId.current) setState(next) } catch (error) { if (currentRequest === requestId.current) setState({ status: 'error', error: error instanceof Error ? error.message : 'Unable to load dashboard' }) } }, [adapter])
  useEffect(() => { void load() }, [load])
  return { state, retry: load }
}
