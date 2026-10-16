import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiRequestError } from '../../adapters/apiRepository'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { SourcesRepository } from '../../adapters/sourcesRepository'
import { AppLink, navigate } from '../../components/SynapseShell'
import { datasetPath, metadataLabels, writable, type Dataset, type Governance, type Medallion, type Origin, type SaveDataset } from '../../domain/datasets'
import type { SchemaObject } from '../../domain/observations'
import { useDatasetResource } from '../../hooks/useDatasetResource'

const emptyOrigin: Origin = { sourceId: '', observationId: '', schema: '', object: '' }
const emptyGovernance: Governance = { owner: null, classification: null, freshnessExpectation: null, loadReference: null }
const emptyMedallion: Medallion = { schemaDescription: null, partitionPolicy: null, retentionPolicy: null, minimumQuality: null, tenantPolicy: null }
const text = (value: string) => value || null // Preserve typing spaces; normalize only at submit.
const sameOrigin = (a: Origin, b: Origin) => a.sourceId === b.sourceId && a.observationId === b.observationId && a.schema === b.schema && a.object === b.object
const fromDataset = (d: Dataset): SaveDataset => ({ name: d.name, description: d.description, kind: d.kind, saveAs: d.registrationStatus,
  origin: { sourceId: d.origin.sourceId, observationId: d.origin.observationId, schema: d.origin.schema, object: d.origin.object },
  selectedColumns: d.selectedColumns.map(c => c.name), governance: { ...d.governance }, preparation: d.preparation, medallion: d.medallion })

function OriginPicker({ sourceRepository, origin, change, prefix, disabled = false }: {
  sourceRepository: SourcesRepository; origin: Origin; change: (origin: Origin) => void; prefix: string; disabled?: boolean
}) {
  const sources = useDatasetResource(useCallback(signal => sourceRepository.list(signal), [sourceRepository]), 'sources')
  const history = useDatasetResource(useCallback(signal => origin.sourceId ? sourceRepository.history(origin.sourceId, signal) : Promise.resolve({ items: [] }), [sourceRepository, origin.sourceId]), origin.sourceId)
  const observation = useDatasetResource(useCallback(signal => origin.sourceId && origin.observationId ? sourceRepository.observation(origin.sourceId, origin.observationId, signal) : Promise.resolve(undefined), [sourceRepository, origin.sourceId, origin.observationId]), `${origin.sourceId}/${origin.observationId}`)
  const errors = [sources, history, observation].filter(r => r.error)
  return <>
    {errors.map((r, i) => <div key={i} className="dataset-error" role="alert">{r.error?.message}<button type="button" className="source-button" onClick={r.refresh}>Reintentar origen</button></div>)}
    <div className="dataset-origin-fields"><label>{prefix} · Fuente<select disabled={disabled || sources.loading} value={origin.sourceId} onChange={e => change({ ...emptyOrigin, sourceId: e.target.value })}><option value="">Selecciona una fuente</option>{sources.data?.items.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label>
      <label>{prefix} · Observación<select disabled={disabled || !origin.sourceId || history.loading} value={origin.observationId} onChange={e => change({ ...origin, observationId: e.target.value, schema: '', object: '' })}><option value="">Selecciona una observación exitosa</option>{origin.observationId && !history.data?.items.some(o => o.id === origin.observationId) && <option value={origin.observationId}>{origin.observationId} · Histórica</option>}{history.data?.items.filter(o => o.status === 'success').map(o => <option key={o.id} value={o.id}>OBS-{o.sequence} · {new Date(o.createdAt).toLocaleDateString('es-PE')}</option>)}</select></label>
      <label>{prefix} · Objeto<select disabled={disabled || observation.loading || observation.data?.status !== 'success'} value={origin.object ? JSON.stringify([origin.schema, origin.object]) : ''} onChange={e => { const [schema, object] = e.target.value ? JSON.parse(e.target.value) : ['', '']; change({ ...origin, schema, object }) }}><option value="">Selecciona tabla o vista</option>{observation.data?.snapshot?.objects.map(obj => <option key={JSON.stringify([obj.schema, obj.name])} value={JSON.stringify([obj.schema, obj.name])}>{obj.schema}.{obj.name} · {obj.kind === 'table' ? 'Tabla' : 'Vista'}</option>)}</select></label>
    </div>
    {observation.data?.status === 'failed' && <div className="dataset-error" role="alert">La observación falló; selecciona una observación exitosa.</div>}
  </>
}

export function DatasetForm({ repository, sourceRepository, dataset, initialOrigin }: {
  repository: DatasetsRepository; sourceRepository: SourcesRepository; dataset?: Dataset; initialOrigin?: Origin
}) {
  const [base, setBase] = useState(dataset)
  const [body, setBody] = useState<SaveDataset>(() => dataset ? fromDataset(dataset) : { name: '', description: '', kind: 'direct', saveAs: 'draft', origin: initialOrigin ?? emptyOrigin, selectedColumns: [], governance: emptyGovernance, preparation: null, medallion: null })
  const [step, setStep] = useState(1)
  const [columnSearch, setColumnSearch] = useState('')
  const [pending, setPending] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState<Error>()
  const [missingServer, setMissingServer] = useState<string[]>([])
  const [candidate, setCandidate] = useState<Origin>(emptyOrigin)
  const lock = useRef(false)
  const lifecycle = useRef(0)
  useEffect(() => { lifecycle.current++; return () => { lifecycle.current++ } }, [])
  const attempt = useRef<{ content: string; key: string } | undefined>(undefined)
  const identity = useDatasetResource(useCallback(signal => repository.me(signal), [repository]), 'dataset-write-identity')
  const observation = useDatasetResource(useCallback(signal => body.origin.sourceId && body.origin.observationId ? sourceRepository.observation(body.origin.sourceId, body.origin.observationId, signal) : Promise.resolve(undefined), [sourceRepository, body.origin.sourceId, body.origin.observationId]), `${body.origin.sourceId}/${body.origin.observationId}`)
  const inputObservation = useDatasetResource(useCallback(signal => candidate.sourceId && candidate.observationId ? sourceRepository.observation(candidate.sourceId, candidate.observationId, signal) : Promise.resolve(undefined), [sourceRepository, candidate.sourceId, candidate.observationId]), `${candidate.sourceId}/${candidate.observationId}`)
  const object: SchemaObject | undefined = observation.data?.status === 'success' ? observation.data.snapshot?.objects.find(o => o.schema === body.origin.schema && o.name === body.origin.object) : undefined
  const structureValid = !!object && body.selectedColumns.length > 0 && body.selectedColumns.every(name => object.columns.some(c => c.name === name))
  const missing = ['owner', 'classification', 'freshnessExpectation'].filter(key => !body.governance[key as keyof Governance]?.trim())
  if (body.kind === 'prepared') {
    if (!body.preparation?.processReference?.trim()) missing.push('preparation.processReference')
    if (!body.preparation?.inputOrigins.length) missing.push('preparation.inputOrigins')
  }
  if (body.medallion) Object.entries(body.medallion).forEach(([key, value]) => { if (!value?.trim()) missing.push(`medallion.${key}`) })
  const canWrite = writable(identity.data?.scopes ?? [])
  function change(next: Partial<SaveDataset>) { setBody(old => ({ ...old, ...next })); setMissingServer([]) }
  function changeOrigin(origin: Origin) { change({ origin, selectedColumns: [] }); setColumnSearch('') }
  async function save(saveAs: SaveDataset['saveAs']) {
    if (lock.current || !canWrite || !structureValid || !body.name.trim() || (saveAs === 'registered' && missing.length)) return
    lock.current = true; setPending(true); setError(undefined); setMissingServer([])
    const activeLifecycle = lifecycle.current
    const normalized: SaveDataset = { ...body, name: body.name.trim().normalize('NFC'), saveAs,
      selectedColumns: object!.columns.filter(column => body.selectedColumns.includes(column.name)).sort((a, b) => a.position - b.position).map(column => column.name),
      governance: Object.fromEntries(Object.entries(body.governance).map(([key, value]) => [key, value?.trim() || null])) as unknown as Governance,
      preparation: body.preparation ? { processReference: body.preparation.processReference?.trim() || null,
        inputOrigins: [...body.preparation.inputOrigins].sort((a, b) => {
          for (const field of ['sourceId', 'observationId', 'schema', 'object'] as const) {
            if (a[field] !== b[field]) return a[field] < b[field] ? -1 : 1
          }
          return 0
        }) } : null,
      medallion: body.medallion ? Object.fromEntries(Object.entries(body.medallion).map(([key, value]) => [key, value?.trim() || null])) as unknown as Medallion : null }
    const content = JSON.stringify(normalized)
    if (attempt.current?.content !== content) attempt.current = { content, key: crypto.randomUUID() }
    try {
      const result = base ? await repository.update(base, normalized) : await repository.create(normalized, attempt.current.key)
      if (lifecycle.current === activeLifecycle) navigate(datasetPath(result.id)) // Never navigate from a departed form.
    } catch (caught) {
      if (lifecycle.current !== activeLifecycle) return
      const e = caught instanceof Error ? caught : new Error('No se pudo guardar el dataset.')
      setError(e)
      if (e instanceof ApiRequestError) setMissingServer(e.missingMetadata)
    } finally { if (lifecycle.current === activeLifecycle) { lock.current = false; setPending(false) } }
  }
  async function reload() {
    if (lock.current || !base || !window.confirm('Se descartarán los cambios locales. ¿Recargar la versión actual?')) return
    lock.current = true; setPending(true); setReloading(true)
    const activeLifecycle = lifecycle.current
    try {
      const current = await repository.get(base.id)
      if (lifecycle.current !== activeLifecycle) return
      setBase(current); setBody(fromDataset(current)); setError(undefined); attempt.current = undefined; setMissingServer([])
    } catch (e) {
      if (lifecycle.current === activeLifecycle) setError(e instanceof Error ? e : new Error('No se pudo recargar.'))
    } finally {
      if (lifecycle.current === activeLifecycle) { lock.current = false; setPending(false); setReloading(false) }
    }
  }
  const candidateValid = inputObservation.data?.status === 'success' && inputObservation.data.snapshot?.objects.some(o => o.schema === candidate.schema && o.name === candidate.object)
  const inputDuplicate = sameOrigin(candidate, body.origin) || body.preparation?.inputOrigins.some(o => sameOrigin(o, candidate))
  return <>
    <AppLink className="source-back" to={base ? datasetPath(base.id) : '/datasets'}>← Volver a {base ? 'la ficha' : 'datasets'}</AppLink>
    <header className="source-heading"><div><p className="source-eyebrow">Registro técnico · Paso {step} de 2</p><h1>{base ? 'Editar dataset' : step === 1 ? 'Elige el origen del dataset' : 'Dale contexto al dataset'}</h1><p>Registrar conserva procedencia y declaraciones; no lee filas, ejecuta procesos ni certifica.</p></div></header>
    <ol className="source-steps"><li className={step === 1 ? 'current' : ''}>1 · Origen observado</li><li className={step === 2 ? 'current' : ''}>2 · Metadatos y gobernanza</li></ol>
    {identity.loading ? <p role="status">Comprobando permisos…</p> : identity.error ? <div className="dataset-error" role="alert">{identity.error.message}<button className="source-button" onClick={identity.refresh}>Reintentar permisos</button></div> : !canWrite && <div className="dataset-error" role="alert">No tienes permiso para registrar o editar datasets.</div>}
    {error && <div className="dataset-error" role="alert">{error.message}{error instanceof ApiRequestError && error.status === 412 && <><p>Tus cambios locales se conservan. Recargar los descartará.</p><button type="button" className="source-button" disabled={pending} onClick={reload}>Recargar versión actual (descarta cambios locales)</button></>}</div>}
    <form onSubmit={e => e.preventDefault()} className="dataset-form"><fieldset disabled={pending || !canWrite}>
      {step === 1 ? <><section className="source-card source-pad"><h2>1. Tipo de dataset</h2><label>Tipo de dataset<select disabled={!!base} value={body.kind} onChange={e => change({ kind: e.target.value as SaveDataset['kind'], preparation: e.target.value === 'prepared' ? { processReference: null, inputOrigins: [] } : null })}><option value="direct">Directo</option><option value="prepared">Preparado</option></select></label><p>Una vista no implica preparación. Un esquema gold no implica Medallion.</p>{base && <p>El origen y tipo son inmutables: crea otro dataset para cambiarlos.</p>}</section>
        <section className="source-card source-pad"><h2>2. Origen observado</h2><OriginPicker prefix="Origen" sourceRepository={sourceRepository} origin={body.origin} change={changeOrigin} disabled={!!base} />{observation.error && <div role="alert" className="dataset-error">{observation.error.message}<button type="button" className="source-button" onClick={observation.refresh}>Reintentar observación</button></div>}
          {object && <><h3>3. Columnas de {object.schema}.{object.name}</h3><label>Buscar columna<input value={columnSearch} onChange={e => setColumnSearch(e.target.value)} /></label><div className="dataset-column-picker" role="region" aria-label="Selección de columnas observadas" tabIndex={0}>{object.columns.filter(c => c.name.toLocaleLowerCase().includes(columnSearch.toLocaleLowerCase())).map(column => <label className="dataset-checkbox" key={column.name}><input type="checkbox" aria-label={`Seleccionar columna ${column.name}`} checked={body.selectedColumns.includes(column.name)} onChange={e => change({ selectedColumns: e.target.checked ? [...body.selectedColumns, column.name] : body.selectedColumns.filter(name => name !== column.name) })} /><span>{column.name}<small>{column.type} · Posición {column.position}</small></span></label>)}</div><p>{body.selectedColumns.length} columnas seleccionadas · Restricciones del origen, sin inferir granularidad.</p></>}
        </section><footer className="dataset-form-actions"><AppLink className="source-button" to="/datasets">Cancelar</AppLink><button type="button" className="source-button primary" disabled={!structureValid} onClick={() => setStep(2)}>Continuar a metadatos</button></footer></> : <>
        <div className="dataset-form-grid"><div><section className="source-card source-pad"><h2>Identificación del dataset</h2><label>Nombre del dataset<input required maxLength={100} value={body.name} onChange={e => change({ name: e.target.value })} /></label><label>Descripción técnica<textarea maxLength={2000} rows={3} value={body.description} onChange={e => change({ description: e.target.value })} /></label></section>
          <section className="source-card source-pad"><h2>Gobernanza declarada</h2><p>El responsable declarado no es la identidad técnica que guarda el registro.</p>{Object.entries(body.governance).map(([key, value]) => <label key={key}>{metadataLabels[key]}<input maxLength={500} value={value ?? ''} placeholder="Sin declarar" aria-invalid={missingServer.includes(key) || undefined} onChange={e => change({ governance: { ...body.governance, [key]: text(e.target.value) } })} /></label>)}</section>
          {body.kind === 'prepared' && <section className="source-card source-pad"><h2>Preparación declarada</h2><label>Referencia del proceso<input maxLength={1000} value={body.preparation?.processReference ?? ''} onChange={e => change({ preparation: { inputOrigins: body.preparation?.inputOrigins ?? [], processReference: text(e.target.value) } })} /></label><p>No se ejecuta ni consulta el proceso.</p><OriginPicker prefix="Entrada" sourceRepository={sourceRepository} origin={candidate} change={setCandidate} /><button type="button" className="source-button" disabled={!candidateValid || inputDuplicate || (body.preparation?.inputOrigins.length ?? 0) >= 20} onClick={() => { change({ preparation: { processReference: body.preparation?.processReference ?? null, inputOrigins: [...(body.preparation?.inputOrigins ?? []), candidate] } }); setCandidate(emptyOrigin) }}>Añadir input observado</button><ul>{body.preparation?.inputOrigins.map((o, i) => <li key={JSON.stringify(o)}>{o.schema}.{o.object} · {o.observationId}<button type="button" className="source-button" aria-label={`Quitar input ${o.schema}.${o.object}`} onClick={() => change({ preparation: { processReference: body.preparation?.processReference ?? null, inputOrigins: body.preparation!.inputOrigins.filter((_, index) => index !== i) } })}>Quitar</button></li>)}</ul></section>}
          <section className="source-card source-pad"><label className="dataset-checkbox"><input type="checkbox" checked={body.medallion !== null} onChange={e => change({ medallion: e.target.checked ? { ...emptyMedallion } : null })} />Declarar alcance Medallion</label>{body.medallion && Object.entries(body.medallion).map(([key, value]) => <label key={key}>{metadataLabels[`medallion.${key}`]}<input maxLength={500} value={value ?? ''} aria-invalid={missingServer.includes(`medallion.${key}`) || undefined} onChange={e => change({ medallion: { ...body.medallion!, [key]: text(e.target.value) } })} /></label>)}</section>
        </div><aside className="source-card source-pad"><h2>Resumen de origen técnico</h2><p>{body.origin.schema}.{body.origin.object}</p><p>{body.selectedColumns.length} columnas · {body.kind === 'direct' ? 'Directo' : 'Preparado'}</p><p>Frescura y calidad sin evaluar. Validación de gobierno pendiente.</p><h3>Metadatos pendientes</h3>{missing.length ? <ul>{missing.map(field => <li key={field}>{metadataLabels[field]}</li>)}</ul> : <p>Campos completos; no implica aprobación.</p>}</aside></div>
        <footer className="dataset-form-actions"><button type="button" className="source-button" onClick={() => setStep(1)}>← Volver al origen</button><div><button type="button" className="source-button" disabled={!structureValid || !body.name.trim()} onClick={() => save('draft')}>Guardar borrador</button><button type="button" className="source-button primary" disabled={!structureValid || !body.name.trim() || missing.length > 0} onClick={() => save('registered')}>{base ? 'Guardar registro' : 'Registrar dataset'}</button></div></footer>
      </>}
    </fieldset>{pending && <p role="status">{reloading ? 'Recargando versión actual…' : 'Guardando dataset…'}</p>}</form>
  </>
}
