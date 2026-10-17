import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiRequestError } from '../../adapters/apiRepository'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { SourcesRepository } from '../../adapters/sourcesRepository'
import { AppLink, navigate } from '../../components/SynapseShell'
import { datasetPath, metadataLabels, writable, type Dataset, type Governance, type Medallion, type Origin, type SaveDataset } from '../../domain/datasets'
import type { SchemaObject } from '../../domain/observations'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import { Icon } from '@bi-analytics/design-system'
import { DatasetObjectSelection, DatasetColumnSelection } from './DatasetOriginTables'
import { DatasetRegistrationSummary } from './DatasetRegistrationSummary'

const emptyOrigin: Origin = { sourceId: '', observationId: '', schema: '', object: '' }
const emptyGovernance: Governance = { owner: null, classification: null, freshnessExpectation: null, loadReference: null }
const emptyMedallion: Medallion = { schemaDescription: null, partitionPolicy: null, retentionPolicy: null, minimumQuality: null, tenantPolicy: null }
const text = (value: string) => value || null // Preserve typing spaces; normalize only at submit.
const sameOrigin = (a: Origin, b: Origin) => a.sourceId === b.sourceId && a.observationId === b.observationId && a.schema === b.schema && a.object === b.object
const fromDataset = (d: Dataset): SaveDataset => ({ name: d.name, description: d.description, kind: d.kind, saveAs: d.registrationStatus,
  origin: { sourceId: d.origin.sourceId, observationId: d.origin.observationId, schema: d.origin.schema, object: d.origin.object },
  selectedColumns: d.selectedColumns.map(c => c.name), governance: { ...d.governance }, preparation: d.preparation, medallion: d.medallion })

function OriginPicker({ sourceRepository, origin, change, prefix, disabled = false, includeObject = true }: {
  sourceRepository: SourcesRepository; origin: Origin; change: (origin: Origin) => void; prefix: string; disabled?: boolean; includeObject?: boolean
}) {
  const sources = useDatasetResource(useCallback(signal => sourceRepository.list(signal), [sourceRepository]), 'sources')
  const history = useDatasetResource(useCallback(signal => origin.sourceId ? sourceRepository.history(origin.sourceId, signal) : Promise.resolve({ items: [] }), [sourceRepository, origin.sourceId]), origin.sourceId)
  const observation = useDatasetResource(useCallback(signal => origin.sourceId && origin.observationId ? sourceRepository.observation(origin.sourceId, origin.observationId, signal) : Promise.resolve(undefined), [sourceRepository, origin.sourceId, origin.observationId]), `${origin.sourceId}/${origin.observationId}`)
  const errors = [sources, history, observation].filter(r => r.error)
  return <>
    {errors.map((r, i) => <div key={i} className="dataset-error" role="alert">{r.error?.message}<button type="button" className="source-button" onClick={r.refresh}>Reintentar origen</button></div>)}
    <div className="dataset-origin-fields"><label>{prefix} · Fuente<select disabled={disabled || sources.loading} value={origin.sourceId} onChange={e => change({ ...emptyOrigin, sourceId: e.target.value })}><option value="">Selecciona una fuente</option>{sources.data?.items.map(source => <option key={source.id} value={source.id}>{source.name}</option>)}</select></label>
      <label>{prefix} · Observación<select disabled={disabled || !origin.sourceId || history.loading} value={origin.observationId} onChange={e => change({ ...origin, observationId: e.target.value, schema: '', object: '' })}><option value="">Selecciona una observación exitosa</option>{origin.observationId && !history.data?.items.some(o => o.id === origin.observationId) && <option value={origin.observationId}>{origin.observationId} · Histórica</option>}{history.data?.items.filter(o => o.status === 'success').map(o => <option key={o.id} value={o.id}>OBS-{o.sequence} · {new Date(o.createdAt).toLocaleDateString('es-PE')}</option>)}</select></label>
      {!includeObject && <label>Origen · Esquema<select aria-label="Origen · Esquema" disabled={disabled || observation.loading || !observation.data?.snapshot} value={origin.schema} onChange={event => change({...origin, schema: event.target.value, object: ''})}><option value="">Todos los esquemas observados</option>{observation.data?.snapshot?.schemas.map(schema => <option key={schema} value={schema}>{schema}</option>)}</select></label>}
      {includeObject && <label>{prefix} · Objeto<select disabled={disabled || observation.loading || observation.data?.status !== 'success'} value={origin.object ? JSON.stringify([origin.schema, origin.object]) : ''} onChange={e => { const [schema, object] = e.target.value ? JSON.parse(e.target.value) : ['', '']; change({ ...origin, schema, object }) }}><option value="">Selecciona tabla o vista</option>{observation.data?.snapshot?.objects.map(obj => <option key={JSON.stringify([obj.schema, obj.name])} value={JSON.stringify([obj.schema, obj.name])}>{obj.schema}.{obj.name} · {obj.kind === 'table' ? 'Tabla' : 'Vista'}</option>)}</select></label>}
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
  const sourceContext = useDatasetResource(useCallback(signal => sourceRepository.list(signal), [sourceRepository]), 'registration-source-names')
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
  const sourceName = sourceContext.data?.items.find(source => source.id === body.origin.sourceId)?.name
  const summary = <DatasetRegistrationSummary origin={body.origin} kind={body.kind} observation={observation.data} object={object} selected={body.selectedColumns.length} sourceName={sourceName} missing={step === 2 ? missing : []} />
  const governanceField = (key: keyof Governance) => <label key={key}>{metadataLabels[key]}<input maxLength={500} value={body.governance[key] ?? ''} placeholder="Sin declarar" aria-invalid={missingServer.includes(key) || undefined} onChange={event => change({governance: {...body.governance, [key]: text(event.target.value)}})} /></label>
  return <div className="dataset-registration">
    <AppLink className="source-back" to={base ? datasetPath(base.id) : '/datasets'}>← Volver a {base ? 'la ficha' : 'datasets'}</AppLink>
    <header className="source-heading wizard-heading"><div><p className="source-eyebrow">US-002 · Registro técnico · Paso {step} de 2</p><h1>{base ? 'Editar dataset' : step === 1 ? 'Elige el origen del dataset' : 'Dale contexto al dataset'}</h1><p>{step === 1 ? 'Registra la referencia física de origen antes de clasificar y documentar metadatos técnicos en el catálogo.' : 'Documenta la responsabilidad técnica, clasificación inicial, expectativa de frescura y linaje declarado antes de registrar el dataset en el catálogo.'}</p></div></header>
    <ol className="wizard-steps" aria-label="Pasos del registro"><li aria-current={step === 1 ? 'step' : undefined}><span>{step === 2 ? <Icon name="check" /> : '1'}</span><div><small>Paso 1</small><strong>Origen inspeccionado</strong></div><em>{step === 1 ? 'Actual' : 'Completado'}</em></li><li aria-current={step === 2 ? 'step' : undefined}><span>2</span><div><small>Paso 2</small><strong>Metadatos y gobernanza técnica</strong></div><em>{step === 2 ? 'Actual' : 'Pendiente'}</em></li></ol>
    <div className={'wizard-governance-note ' + (step === 2 ? 'metadata' : '')} role="note"><Icon name="lock" size={18} /><p>{step === 1 ? 'Este registro preserva una referencia de origen observada; no ejecuta transformaciones ni define granularidad de negocio.' : 'Registrar un dataset técnico con atributos declarados no publica métricas, no define el grano analítico de negocio ni ejecuta consultas o pipelines de datos.'} Guardar no certifica ni aprueba metadatos.</p></div>
    {identity.loading ? <p role="status">Comprobando permisos…</p> : identity.error ? <div className="dataset-error" role="alert">{identity.error.message}<button className="source-button" onClick={identity.refresh}>Reintentar permisos</button></div> : !canWrite && <div className="dataset-error" role="alert">No tienes permiso para registrar o editar datasets.</div>}
    {error && <div className="dataset-error" role="alert">{error.message}{error instanceof ApiRequestError && error.status === 412 && <><p>Tus cambios locales se conservan. Recargar los descartará.</p><button type="button" className="source-button" disabled={pending} onClick={reload}>Recargar versión actual (descarta cambios locales)</button></>}</div>}
    <form onSubmit={event => event.preventDefault()} className="dataset-form"><fieldset disabled={pending || !canWrite}>
      <div className="wizard-grid"><div className="wizard-sections">
      {step === 1 ? <>
        <section className="source-card wizard-card"><div className="wizard-section-title"><h2><span aria-hidden="true">1</span>Tipo de dataset</h2><small>Clasificación técnica declarada</small></div>
          <div className="wizard-type-cards" role="radiogroup" aria-label="Tipo de dataset">{(['direct', 'prepared'] as const).map(kind => <label key={kind} className={body.kind === kind ? 'selected' : ''}><input type="radio" name="dataset-kind" aria-label={kind === 'direct' ? 'Directo' : 'Preparado'} disabled={!!base} checked={body.kind === kind} onChange={() => change({kind, preparation: kind === 'prepared' ? {processReference: null, inputOrigins: []} : null})} /><strong>{kind === 'direct' ? 'Directo' : 'Preparado'}</strong><p>{kind === 'direct' ? 'Referencia a una tabla o vista de origen.' : 'Origen preparado por un proceso externo declarado.'}</p><small>{kind === 'direct' ? 'Sin ejecutar transformaciones' : 'Proceso e inputs explícitos'}</small></label>)}</div><p className="wizard-muted">Una vista no implica preparación. Un esquema gold no implica Medallion.</p>{base && <p>El origen y tipo son inmutables: crea otro dataset para cambiarlos.</p>}</section>
        <section className="source-card wizard-card"><div className="wizard-section-title"><h2><span aria-hidden="true">2</span>Parámetros de conexión e introspección</h2></div><OriginPicker prefix="Origen" sourceRepository={sourceRepository} origin={body.origin} change={changeOrigin} disabled={!!base} includeObject={false} />{observation.error && <div role="alert" className="dataset-error">{observation.error.message}<button type="button" className="source-button" onClick={observation.refresh}>Reintentar observación</button></div>}<p className="wizard-muted">DDL de la observación seleccionada. No se realiza una introspección nueva ni se leen filas.</p></section>
        <DatasetObjectSelection key={body.origin.sourceId + '/' + body.origin.observationId} observation={observation.data} origin={body.origin} change={changeOrigin} disabled={!!base} />
        {object && <DatasetColumnSelection object={object} selected={body.selectedColumns} change={selectedColumns => change({selectedColumns})} search={columnSearch} setSearch={setColumnSearch} />}
      </> : <>
        <section className="source-card wizard-card"><div className="wizard-section-title"><h2><span aria-hidden="true">1</span>Identificación del dataset</h2><small>Identificador asignado por el sistema</small></div><div className="wizard-identification"><label>Nombre del dataset<input aria-label="Nombre del dataset" required maxLength={100} value={body.name} onChange={event => change({name: event.target.value})} /><small>Nombre de visualización legible en el catálogo técnico.</small></label><label>Identificador técnico<input aria-label="Identificador técnico" readOnly value={base?.id ?? 'Se asignará al guardar'} /><small>No se genera un identificador ficticio ni se edita manualmente.</small></label></div><label>Descripción técnica<textarea maxLength={2000} rows={3} value={body.description} onChange={event => change({description: event.target.value})} /></label><div className="wizard-declared-kind"><small>Tipo de dataset</small><strong>{body.kind === 'direct' ? 'Directo' : 'Preparado'} (declarado)</strong></div></section>
        <section className="source-card wizard-card"><div className="wizard-section-title"><h2><span aria-hidden="true">2</span>Gobierno y responsabilidad declarada</h2><small>Pendiente de validación</small></div>{governanceField('owner')}{governanceField('classification')}<p className="wizard-muted">El responsable declarado no es la identidad técnica que guarda el registro. La clasificación es texto libre y no aplica permisos de acceso automáticamente.</p></section>
        <section className="source-card wizard-card"><div className="wizard-section-title"><h2><span aria-hidden="true">3</span>Frescura y ciclo de actualización</h2></div>{governanceField('freshnessExpectation')}{governanceField('loadReference')}<p className="wizard-load-note"><Icon name="clock" size={16} />Fecha de observación técnica ≠ fecha de última carga. No existe evaluación automatizada de frescura ni SLA configurado.</p></section>
        <section className="source-card wizard-card"><div className="wizard-section-title"><h2><span aria-hidden="true">4</span>Linaje técnico declarado</h2></div><p className="wizard-muted">Salida observada: <code>{body.origin.schema}.{body.origin.object}</code> · {body.selectedColumns.length} columnas seleccionadas.</p>
          {body.kind === 'prepared' ? <><label>Referencia del proceso<input maxLength={1000} value={body.preparation?.processReference ?? ''} onChange={event => change({preparation: {inputOrigins: body.preparation?.inputOrigins ?? [], processReference: text(event.target.value)}})} /></label><p>No se ejecuta ni consulta el proceso.</p><OriginPicker prefix="Entrada" sourceRepository={sourceRepository} origin={candidate} change={setCandidate} /><button type="button" className="source-button" disabled={!candidateValid || inputDuplicate || (body.preparation?.inputOrigins.length ?? 0) >= 20} onClick={() => {change({preparation: {processReference: body.preparation?.processReference ?? null, inputOrigins: [...(body.preparation?.inputOrigins ?? []), candidate]}}); setCandidate(emptyOrigin)}}>Añadir input observado</button><ul>{body.preparation?.inputOrigins.map((origin, index) => <li key={JSON.stringify(origin)}>{origin.schema}.{origin.object} · {origin.observationId}<button type="button" className="source-button" aria-label={'Quitar input ' + origin.schema + '.' + origin.object} onClick={() => change({preparation: {processReference: body.preparation?.processReference ?? null, inputOrigins: body.preparation!.inputOrigins.filter((_, position) => position !== index)}})}>Quitar</button></li>)}</ul></> : <p>Origen directo declarado; sin proceso de preparación ni inputs adicionales.</p>}
          <div className="wizard-medallion"><label className="dataset-checkbox"><input type="checkbox" checked={body.medallion !== null} onChange={event => change({medallion: event.target.checked ? {...emptyMedallion} : null})} />Declarar alcance Medallion</label><p className="wizard-muted">Opcional. El esquema gold no implica esta declaración ni aprobación de políticas.</p>{body.medallion && Object.entries(body.medallion).map(([key, value]) => <label key={key}>{metadataLabels['medallion.' + key]}<input maxLength={500} value={value ?? ''} aria-invalid={missingServer.includes('medallion.' + key) || undefined} onChange={event => change({medallion: {...body.medallion!, [key]: text(event.target.value)}})} /></label>)}</div>
        </section>
      </>}
      </div>{summary}</div>
      <footer className="dataset-form-actions wizard-actions"><div className="wizard-action-context"><Icon name="database" /><span><strong>{step === 1 ? body.origin.object || 'Sin objeto seleccionado' : body.name || 'Dataset sin nombre'}</strong><small>{body.selectedColumns.length} columnas · Cambios pendientes de guardar</small></span></div>{step === 1 ? <div><AppLink className="source-button" to="/datasets">Cancelar</AppLink><button type="button" className="source-button primary" disabled={!structureValid} onClick={() => setStep(2)}>Continuar a metadatos<Icon name="arrow" size={16} /></button></div> : <div><button type="button" className="source-button" onClick={() => setStep(1)}>← Volver al origen</button><button type="button" className="source-button" disabled={!structureValid || !body.name.trim()} onClick={() => save('draft')}>Guardar borrador</button><button type="button" className="source-button primary" disabled={!structureValid || !body.name.trim() || missing.length > 0} onClick={() => save('registered')}>{base ? 'Guardar registro' : 'Registrar dataset'}</button></div>}</footer>
    </fieldset>{pending && <p role="status">{reloading ? 'Recargando versión actual…' : 'Guardando dataset…'}</p>}</form>
  </div>
}
