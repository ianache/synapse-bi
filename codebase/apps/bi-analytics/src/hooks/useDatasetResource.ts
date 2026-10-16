import { useCallback, useEffect, useState } from 'react'

export function useDatasetResource<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const [state, setState] = useState<{ key: string; data?: T; error?: Error; loading: boolean }>({ key, loading: true })
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    setState({ key, loading: true })
    load(controller.signal).then(data => { if (!controller.signal.aborted) setState({ key, data, loading: false }) })
      .catch(error => { if (!controller.signal.aborted) setState({ key, loading: false, error: error instanceof Error ? error : new Error('No se pudo completar la operación.') }) })
    return () => controller.abort()
  }, [key, load, revision])
  return { ...(state.key === key ? state : { loading: true, data: undefined, error: undefined }), refresh }
}
