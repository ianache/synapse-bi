import {useCallback, useEffect, useRef, useState} from 'react'
import type {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import type {SemanticCatalogRepository} from '../../adapters/semanticCatalogRepository'
import {ApiRequestError} from '../../adapters/apiRepository'
import type {CaptureChange, ModelComparison, ModelDetailRecord, ModelDraft, ModelPreview, SemanticModel} from '../../domain/semanticModels'
import {draftPath} from '../../domain/semanticModels'
import {useDatasetResource} from '../../hooks/useDatasetResource'
import {AppLink} from '../../components/SynapseShell'
import {CaptureSummary, ModelError, ModelNotice, modelDate, modelTabKeys} from './ModelsChrome'

const display = (value: unknown) => value == null ? '—' : typeof value === 'string' ? value : JSON.stringify(value)
export function ModelCompare({repository, detail, canWrite, editable = true, onSaved, search, catalogRepository}: {repository: SemanticModelsRepository; detail: ModelDetailRecord; canWrite: boolean; editable?: boolean; onSaved: (result: ModelDraft, model?: SemanticModel) => void; search: string; catalogRepository?: SemanticCatalogRepository}) {
  const parameters = new URLSearchParams(search)
  const [model, setModel] = useState(detail.model), [draft, setDraft] = useState(detail.draft)
  const [needsRecovery, setNeedsRecovery] = useState(false), [stillEditable, setStillEditable] = useState(editable)
  const uncertain = useRef<{digest: string; ids: string[]} | undefined>(undefined)
  const [mode, setMode] = useState(parameters.get('mode') === 'versions' ? 'versions' : 'catalog')
  const [left, setLeft] = useState(parameters.get('leftDraftId') ?? draft.id), [right, setRight] = useState(parameters.get('rightDraftId') ?? draft.id)
  const [selection, setSelection] = useState(draft.kpiIds), [preview, setPreview] = useState<ModelPreview>(), [comparison, setComparison] = useState<ModelComparison>()
  const [checked, setChecked] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState<Error>()
  const active = useRef(true), locked = useRef(false), request = useRef<AbortController | undefined>(undefined)
  useEffect(() => {active.current = true; return () => {active.current = false; request.current?.abort()}}, [])
  const history = useDatasetResource(useCallback(signal => repository.drafts(model.id, 0, signal), [repository, model.id]), `compare-history/${model.id}`)
  const options = useDatasetResource(useCallback(signal => catalogRepository ? catalogRepository.all('kpi-definitions', {domainId: model.domainId}, signal) : Promise.resolve([]), [catalogRepository, model.domainId]), `compare-kpis/${model.domainId}`)
  async function inspect() {
    if (locked.current || (mode === 'catalog' && (!canWrite || !stillEditable || needsRecovery))) return
    locked.current = true; setPending(true); setError(undefined); setChecked(false); setPreview(undefined); setComparison(undefined)
    const controller = new AbortController(); request.current = controller
    try {
      if (mode === 'catalog') {const value = await repository.preview(model.id, draft, selection, controller.signal); if (active.current && !controller.signal.aborted) setPreview(value)}
      else {const value = await repository.compare(model.id, left, right, controller.signal); if (active.current && !controller.signal.aborted) setComparison(value)}
    } catch (e) {if (active.current && !controller.signal.aborted) {setError(e instanceof Error ? e : new Error('No se pudo comparar.')); if (e instanceof ApiRequestError && e.status === 412) setNeedsRecovery(true)}}
    finally {if (active.current) {locked.current = false; setPending(false)}}
  }
  async function confirm() {
    if (locked.current || !preview || !checked || !canWrite || !stillEditable || needsRecovery || mode !== 'catalog') return
    locked.current = true; setPending(true); setError(undefined)
    uncertain.current = {digest: preview.candidateDigest, ids: [...selection].sort()}
    try {const result = await repository.update(model.id, {...draft, revision: preview.baseRevision}, selection, preview.candidateDigest); if (active.current) onSaved(result, {...model, revision: model.revision + 1, updatedAt: result.updatedAt})}
    catch (e) {if (active.current) {setError(e instanceof Error ? e : new Error('No se pudo actualizar.')); setPreview(undefined); setChecked(false); setNeedsRecovery(!(e instanceof ApiRequestError && e.status < 500 && e.status !== 412)); if (e instanceof ApiRequestError && e.status < 500) uncertain.current = undefined}}
    finally {if (active.current) {locked.current = false; setPending(false)}}
  }
  async function recover() {
    if (locked.current) return
    locked.current = true; setPending(true)
    const controller = new AbortController(); request.current = controller
    try {
      const latest = await repository.get(model.id, controller.signal)
      const current = latest.draft.id === draft.id ? latest.draft : await repository.getDraft(model.id, draft.id, controller.signal)
      if (!active.current || controller.signal.aborted) return
      if (uncertain.current && current.captureDigest === uncertain.current.digest && JSON.stringify([...current.kpiIds].sort()) === JSON.stringify(uncertain.current.ids)) {
        onSaved(current, latest.model); return
      }
      setModel(latest.model); setDraft(current); setStillEditable(latest.draft.id === draft.id)
      setNeedsRecovery(false); setPreview(undefined); setComparison(undefined); setChecked(false); setError(undefined); uncertain.current = undefined
    } catch (e) {if (active.current && !controller.signal.aborted) setError(e instanceof Error ? e : new Error('No se pudo recuperar la revisión.'))}
    finally {if (active.current) {locked.current = false; setPending(false)}}
  }
  const changes: CaptureChange[] = preview?.changes ?? comparison?.changes ?? []
  const capture = preview?.candidateCapture ?? draft.capture
  function switchMode(value: string) {setMode(value); setPreview(undefined); setComparison(undefined); setChecked(false); setError(undefined)}
  return <><AppLink className="source-back" to={draftPath(model.id, draft.id)}>← Volver al borrador</AppLink><header className="models-heading"><div><span className="models-eyebrow">US-004 · Comparación y actualización explícita</span><h1>Comparar captura con catálogo</h1><div className="models-context"><strong>{model.name}</strong><span className="models-badge">Dominio: {draft.capture.domain.name}</span><span className="models-badge">Borrador {draft.sequence}</span></div><p>{preview ? `Catálogo comprobado: ${modelDate(preview.checkedAt)}` : 'Compara de forma explícita; no se aplican cambios al abrir esta pantalla.'}</p></div></header><ModelNotice /><ModelError error={error} />{error instanceof ApiRequestError && ['capture_changed', 'version_conflict'].includes(error.code) && <p className="models-info">Vuelve a comparar antes de confirmar.</p>}{needsRecovery && <button className="source-button" disabled={pending} onClick={recover}>Recuperar revisión y conservar selección</button>}{!stillEditable && <p className="models-info">Existe un borrador posterior. La selección local se conserva, pero esta captura es de sólo lectura.</p>}
    <fieldset disabled={pending || (mode === 'catalog' && (needsRecovery || !stillEditable))}><div className="models-compare-controls"><div className="models-tabs" role="tablist" onKeyDown={event => modelTabKeys(event, ["catalog","versions"], switchMode)} aria-label="Modo de comparación"><button type="button" role="tab" aria-selected={mode === 'catalog'} tabIndex={mode === 'catalog' ? 0 : -1} onClick={() => switchMode('catalog')}>Borrador vs catálogo actual</button><button type="button" role="tab" aria-selected={mode === 'versions'} tabIndex={mode === 'versions' ? 0 : -1} onClick={() => switchMode('versions')}>Entre versiones guardadas</button></div>{mode === 'versions' ? <><label>Borrador de origen<select value={left} onChange={e => {setLeft(e.target.value); setComparison(undefined)}}>{!history.data?.items.some(d => d.id === left) && <option value={left}>Borrador seleccionado</option>}{history.data?.items.map(row => <option key={row.id} value={row.id}>Borrador {row.sequence}</option>)}</select></label><label>Borrador de destino<select value={right} onChange={e => {setRight(e.target.value); setComparison(undefined)}}>{!history.data?.items.some(d => d.id === right) && <option value={right}>Borrador seleccionado</option>}{history.data?.items.map(row => <option key={row.id} value={row.id}>Borrador {row.sequence}</option>)}</select></label><button type="button" className="source-button" onClick={inspect}>Comparar versiones guardadas</button><ModelError error={history.error} retry={history.refresh} /></> : <button type="button" className="source-button primary" disabled={!canWrite || !editable} onClick={inspect}>Comprobar cambios del catálogo</button>}</div>
    {mode === 'catalog' && canWrite && editable && catalogRepository && <details className="models-card models-selection"><summary>Ajustar selección de KPI del mismo dominio</summary><ModelError error={options.error} retry={options.refresh} />{options.data?.map(k => <label key={k.id}><input type="checkbox" checked={selection.includes(k.id)} aria-label={`Incluir KPI ${k.name}`} disabled={!selection.includes(k.id) && selection.length >= 100} onChange={e => {setSelection(e.target.checked ? [...selection, k.id] : selection.filter(id => id !== k.id)); setPreview(undefined); setChecked(false)}} />{k.name}</label>)}</details>}
    <div className="models-stats models-diff-stats">{(['modified', 'added', 'removed'] as const).map((kind, i) => <article key={kind}><small>{['Discrepancias detectadas', 'Nuevos elementos', 'Elementos retirados'][i]}</small><strong>{preview || comparison ? changes.filter(c => c.change === kind).length : '—'}</strong><span>{['Atributos modificados', 'Definiciones añadidas', 'Definiciones retiradas'][i]}</span></article>)}<article><strong>Seguridad de versión</strong><span>Actualizar sólo afecta este borrador. Las versiones anteriores permanecen intactas.</span></article></div>
    <div className="models-grid"><div className="models-sections"><section className="models-card"><h2>Matriz comparativa de diferencias</h2>{!preview && !comparison ? <p className="models-empty">Solicita una comparación para ver diferencias. La captura guardada permanece intacta.</p> : <><div className="models-table-scroll" role="region" aria-label="Diferencias de captura" tabIndex={0}><table><thead><tr><th>Elemento</th><th>Tipo</th><th>Atributo</th><th>Valor guardado</th><th>{mode === 'catalog' ? 'Valor en catálogo comprobado' : 'Valor de destino'}</th></tr></thead><tbody>{changes.map((change, index) => <tr key={index}><td>{capture.kpis.find(k => k.id === change.id)?.name ?? capture.components.find(c => c.id === change.id)?.name ?? change.id}</td><td><span className="models-badge models-warning">{change.change === 'added' ? 'Añadido' : change.change === 'removed' ? 'Retirado' : 'Modificado'}</span></td><td>{change.field || 'Definición completa'}</td><td>{display(change.before)}</td><td>{display(change.after)}</td></tr>)}</tbody></table></div>{!changes.length && <p className="models-empty">Sin diferencias en el contenido comparado.</p>}</>}</section>
    <div className="models-info">Actualizar afecta únicamente este borrador. Las versiones anteriores permanecen intactas.</div>{mode === 'catalog' && <section className="models-confirm models-card"><h2>Acción explícita sobre el borrador</h2><p>Si el catálogo cambia antes de confirmar, vuelve a comparar; tus cambios se conservarán. No ejecuta consultas ni publica métricas.</p><label><input type="checkbox" checked={checked} disabled={!preview || !canWrite || !editable} onChange={e => setChecked(e.target.checked)} />He revisado los cambios de esta captura</label><footer className="models-actions"><AppLink className="source-button" to={draftPath(model.id, draft.id)}>Cancelar y conservar captura</AppLink><button className="source-button primary" type="button" disabled={!preview || !checked || !canWrite || !editable} onClick={confirm}>Confirmar actualización de borrador</button></footer></section>}</div><CaptureSummary capture={capture} digest={preview?.candidateDigest ?? draft.captureDigest} /></div></fieldset>{pending && <p role="status">{checked ? 'Actualizando borrador…' : 'Comparando capturas…'}</p>}</>
}
