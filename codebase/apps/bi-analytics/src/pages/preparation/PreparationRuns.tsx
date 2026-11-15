import { useCallback, useState } from 'react'
import type { PreparationPipeline, PreparationRepository, PreparationRun } from '../../adapters/preparationRepository'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import { AppLink } from '../../components/SynapseShell'

const statusLabels: Record<PreparationRun['status'], string> = {
  received: 'Recibida', processing: 'Procesando', published: 'Publicada', quality_rejected: 'Rechazada por calidad', technical_failure: 'Fallo técnico',
}
const fmtDate = (date: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date))

export function PreparationRuns({ repository, loadPipelines, initialPipelineId = '' }: { repository: PreparationRepository; loadPipelines: (signal: AbortSignal) => Promise<{ items: PreparationPipeline[] }>; initialPipelineId?: string }) {
  const [pipelineId, setPipelineId] = useState(initialPipelineId)
  const load = useCallback((signal: AbortSignal) => repository.runs(pipelineId || undefined, signal), [pipelineId, repository])
  const pipelines = useDatasetResource(loadPipelines, 'pipelines')
  const runs = useDatasetResource(load, `runs/${pipelineId}`)
  const selected = pipelines.data?.items.find(item => item.id === pipelineId)
  const rows = runs.data?.items ?? []
  return <>
    <header className="prep-page-header"><div><AppLink to="/datasets/preparacion-cdc" className="prep-back">← Volver a pipelines</AppLink><span className="prep-eyebrow">US-007 · PREPARACIÓN CDC · EJECUCIONES</span><h1>Ejecuciones CDC</h1><p>Los lotes manuales y las consultas automáticas de polling comparten el mismo proceso de validación y materialización en el catálogo analítico.</p></div></header>
    <div className="prep-state-legend"><h2>Estados normativos CDC</h2><div><span className="is-published">✓ Publicada</span><span className="is-quality">⚠ Rechazada por calidad</span><span className="is-failed">! Fallo técnico</span></div></div>
    <section className="prep-filter"><label>Pipeline<select value={pipelineId} onChange={event => setPipelineId(event.target.value)}><option value="">Todos los pipelines</option>{(pipelines.data?.items ?? []).map(p => <option key={p.id} value={p.id}>{p.preparedDatasetId}</option>)}</select></label><button className="prep-secondary" onClick={() => runs.refresh()}>↻ Actualizar</button></section>
    {pipelines.error && <p role="alert" className="prep-error">{pipelines.error.message}</p>}
    {runs.loading ? <p role="status" className="prep-loading">Cargando ejecuciones…</p> : runs.error ? <div role="alert" className="prep-error">{runs.error.message}<button onClick={runs.refresh}>Reintentar carga</button></div> : rows.length === 0 ? <section className="prep-empty prep-runs-empty"><span className="prep-empty-icon">◷</span><h2>Aún no hay ejecuciones para {selected ? 'este pipeline' : 'este tenant'}</h2><p>Las ejecuciones registradas aparecerán aquí tras procesar un lote CDC o al activarse una consulta de polling con eventos.</p><span className="prep-awaiting">↻ Esperando eventos de datos para sincronizar</span></section>
      : <><div className="prep-run-table-wrap"><table className="prep-run-table"><thead><tr><th>Pipeline</th><th>Origen</th><th>Inicio</th><th>Estado</th><th>Eventos</th><th>Rechazados</th><th>Versión publicada</th></tr></thead><tbody>{rows.map(run => <tr key={run.id}><td><AppLink to={`/datasets/preparacion-cdc/ejecuciones/${encodeURIComponent(run.id)}`}>{run.pipelineId}</AppLink></td><td>{run.origin === 'poll' ? 'Polling' : 'Manual'}</td><td>{fmtDate(run.startedAt)}</td><td><span className={`prep-status prep-${run.status}`}>{statusLabels[run.status]}</span></td><td>{run.eventCount}</td><td>{run.rejectedCount}</td><td>{run.publishedVersion ? `v${run.publishedVersion.versionNumber}` : '—'}</td></tr>)}</tbody></table></div>
        <div className="prep-run-cards">{rows.map(run => <RunCard key={run.id} run={run} />)}</div></>}
  </>
}

function RunCard({ run }: { run: PreparationRun }) {
  return <AppLink className="prep-run-card" to={`/datasets/preparacion-cdc/ejecuciones/${encodeURIComponent(run.id)}`}><strong>{run.pipelineId}</strong><span>{run.origin === 'poll' ? 'Polling' : 'Manual'} · {fmtDate(run.startedAt)}</span><span className={`prep-status prep-${run.status}`}>{statusLabels[run.status]}</span><span>{run.eventCount} eventos · {run.rejectedCount} rechazados</span><span>Versión publicada: {run.publishedVersion ? `v${run.publishedVersion.versionNumber}` : '—'}</span></AppLink>
}
