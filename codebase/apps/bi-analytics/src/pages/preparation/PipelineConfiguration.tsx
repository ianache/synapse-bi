import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { DatasetPage } from '../../domain/datasets'
import type { Source } from '../../adapters/sourcesRepository'
import type { PreparationPipeline } from '../../adapters/preparationRepository'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import { AppLink } from '../../components/SynapseShell'
import type { PreparationRepository } from '../../adapters/preparationRepository'

export function PipelineConfiguration({ repository, loadPipelines, loadSources, loadDatasets, onCreated }: {
  repository: PreparationRepository
  loadPipelines: (signal: AbortSignal) => Promise<{ items: PreparationPipeline[] }>
  loadSources: (signal: AbortSignal) => Promise<{ items: Source[] }>
  loadDatasets: (signal: AbortSignal) => Promise<DatasetPage>
  onCreated: () => void
}) {
  const pipelinesResource = useDatasetResource(loadPipelines, 'pipelines')
  const sourcesResource = useDatasetResource(loadSources, 'sources')
  const datasetsResource = useDatasetResource(loadDatasets, 'input-datasets')
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches)
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches)
  const [name, setName] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [inputDatasetId, setInputDatasetId] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<PreparationPipeline>()
  const pipelines = pipelinesResource.data?.items ?? []
  const sources = sourcesResource.data?.items ?? []
  const registeredDatasets = datasetsResource.data?.items ?? []
  const inputDatasets = registeredDatasets.filter(dataset => dataset.kind === 'direct')
  const selectedDataset = inputDatasets.find(dataset => dataset.id === inputDatasetId)
  const canSave = !!name.trim() && !!sourceId && !!inputDatasetId && !pending
  const refreshPipelines = useCallback(() => { onCreated(); pipelinesResource.refresh() }, [onCreated, pipelinesResource.refresh])
  useEffect(() => { const media = window.matchMedia('(max-width: 700px)'); const update = () => setIsMobile(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    setPending(true); setError('')
    try {
      const created = await repository.createPipeline({ sourceId, inputDatasetId, preparedDatasetName: name.trim(), enabled })
      setSuccess(created); setOpen(false); setName(''); setSourceId(''); setInputDatasetId(''); setEnabled(false); refreshPipelines()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar el pipeline.') }
    finally { setPending(false) }
  }
  const fields = <>
    <label className="prep-field">Nombre del dataset preparado <span aria-hidden="true">*</span>
      <input required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Nombre del dataset preparado" />
      <small>Identificador del nuevo dataset derivado en la capa de datos.</small>
    </label>
    <label className="prep-field">Fuente de datos de origen (PostgreSQL) <span aria-hidden="true">*</span>
      <select required value={sourceId} onChange={event => setSourceId(event.target.value)}>
        <option value="">Selecciona una fuente PostgreSQL registrada</option>
        {sources.map(source => <option key={source.id} value={source.id}>{source.name} · {source.database}</option>)}
      </select>
    </label>
    <label className="prep-field">Dataset de entrada <span aria-hidden="true">*</span>
      <select required value={inputDatasetId} onChange={event => setInputDatasetId(event.target.value)}>
        <option value="">Selecciona un dataset registrado</option>
        {inputDatasets.map(dataset => <option key={dataset.id} value={dataset.id}>{dataset.origin.schema}.{dataset.origin.object} ({dataset.name})</option>)}
      </select>
    </label>
    <div className="prep-flow" aria-label="Flujo de datos estructurado">
      <strong>↟ Flujo de datos estructurado</strong>
      <p>Origen PostgreSQL <b>[{sources.find(source => source.id === sourceId)?.database || '—'}]</b> → Pipeline CDC → Destino <b>[{name.trim() || 'Dataset preparado'}]</b></p>
      {selectedDataset && <small>Entrada: {selectedDataset.origin.schema}.{selectedDataset.origin.object}</small>}
    </div>
    <div className="prep-poll-toggle"><div><strong>Habilitar polling automático</strong><small>Consulta cada 1 minuto. Solo laboratorio.</small><span className="prep-lab-tag">● Entorno de pruebas</span></div>
      <input aria-label="Habilitar polling automático" type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />
    </div>
    <div className="prep-note">▤ El dataset preparado resultante se registra automáticamente en el catálogo gobernado al confirmar el pipeline, quedando disponible para modelado semántico.</div>
  </>
  const errorNode = error && <p role="alert" className="prep-error">{error}</p>
  if (pipelinesResource.loading) return <p role="status" className="prep-loading">Cargando pipelines CDC…</p>
  if (pipelinesResource.error) return <div role="alert" className="prep-error">{pipelinesResource.error.message}<button onClick={pipelinesResource.refresh}>Actualizar</button></div>
  return <>
    {!(isMobile && open) && <header className="prep-page-header">
      <div><span className="prep-eyebrow">⇄ US-007 · PREPARACIÓN CDC · PIPELINES DE VENTAS</span><h1>Pipelines CDC de ventas</h1><p>Configura la ingesta continua CDC de transacciones de ventas en la capa analítica gobernada.</p></div>
      <div className="prep-header-actions"><AppLink to="/datasets/preparacion-cdc/ejecuciones" className="prep-secondary">Historial de ejecuciones</AppLink><button className="prep-primary" onClick={() => setOpen(true)}>＋ Configurar pipeline</button></div>
    </header>}
    {!(isMobile && open) && <div className="prep-api-hint">Vista de diseño · valores provistos por API</div>}
    {success && <p className="prep-success" role="status">Pipeline creado. Dataset preparado: {success.preparedDatasetId}</p>}
    {!(isMobile && open) && <section className="prep-pipeline-list">
      {pipelines.length === 0 ? <div className="prep-empty"><span className="prep-empty-icon">⫯</span><h2>Aún no hay pipelines CDC configurados</h2><p>Se requiere registrar un pipeline inicial para habilitar la captura continua de eventos desde PostgreSQL hacia el catálogo.</p><button className="prep-primary" onClick={() => setOpen(true)}>＋ Configurar pipeline</button></div>
        : pipelines.map(pipeline => { const output = registeredDatasets.find(dataset => dataset.id === pipeline.preparedDatasetId); const input = registeredDatasets.find(dataset => dataset.id === pipeline.inputDatasetId); const source = sources.find(item => item.id === pipeline.sourceId); return <article className="prep-pipeline-card" key={pipeline.id}><div><h2>{output?.name ?? pipeline.preparedDatasetId}</h2><p>{source?.name ?? pipeline.sourceId} · {input ? `${input.origin.schema}.${input.origin.object}` : pipeline.inputDatasetId} · {pipeline.enabled ? 'Polling habilitado' : 'Polling deshabilitado'}</p></div><AppLink className="prep-secondary" to={`/datasets/preparacion-cdc/ejecuciones?pipeline_id=${encodeURIComponent(pipeline.id)}`}>Ver ejecuciones</AppLink></article>})}
    </section>}
    {(sourcesResource.error || datasetsResource.error) && <p className="prep-error" role="alert">{sourcesResource.error?.message || datasetsResource.error?.message}</p>}
    {open && <div className="prep-drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false) }}>
      <aside className="prep-drawer" role={isMobile ? undefined : 'dialog'} aria-modal={isMobile ? undefined : true} aria-labelledby="prep-drawer-title"><header><div><h2 id="prep-drawer-title">Configurar pipeline CDC</h2><p>Parámetros de captura y registro automático de destino</p><span className="prep-api-tag">Vista de diseño · valores provistos por API</span></div><button aria-label="Cerrar panel de configuración" onClick={() => setOpen(false)}>×</button></header>
        <form onSubmit={submit}><div className="prep-drawer-fields">{fields}{errorNode}</div><footer><div className="prep-tenant">● Tenant de la sesión</div><button type="submit" className="prep-primary" disabled={!canSave}>{pending ? 'Guardando…' : '▣ Guardar pipeline'}</button><button type="button" className="prep-secondary" onClick={() => setOpen(false)}>Cancelar</button>{!canSave && <small>Completa los campos requeridos para habilitar el guardado</small>}</footer></form>
      </aside>
    </div>}
  </>
}
