import { useCallback, useState, type FormEvent } from 'react'
import type { PreparationRepository, PreparationRun } from '../../adapters/preparationRepository'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import { AppLink, navigate } from '../../components/SynapseShell'

const checkLabels: Record<string, string> = {
  missing_business_key: 'Clave de negocio ausente', invalid_event: 'Evento u operación inválida',
  missing_required_fields: 'Campos requeridos ausentes', duplicate_event_id: 'ID de evento duplicado',
}
const date = (value?: string | null) => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

export function PreparationRunDetail({ runId, repository, onChanged }: { runId: string; repository: PreparationRepository; onChanged: () => void }) {
  const load = useCallback((signal: AbortSignal) => repository.run(runId, signal), [runId, repository])
  const resource = useDatasetResource(load, runId)
  const [editorOpen, setEditorOpen] = useState(false)
  const [json, setJson] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [busy, setBusy] = useState(false)
  const [retryError, setRetryError] = useState('')
  if (resource.loading) return <p role="status" className="prep-loading">Cargando detalle de ejecución…</p>
  if (resource.error || !resource.data) return <div role="alert" className="prep-error">{resource.error?.message ?? 'No se encontró la ejecución.'}<button onClick={resource.refresh}>Reintentar carga</button></div>
  const run = resource.data
  const failed = run.status === 'technical_failure' || run.status === 'quality_rejected'
  const checks = run.qualityResults.checks ?? []
  const latestVersion = run.latestSuccessfulVersion
  async function pollRetry() {
    if (run.origin !== 'poll') return
    setBusy(true); setRetryError('')
    try { const result = await repository.retry(run.id); onChanged(); navigate(`/datasets/preparacion-cdc/ejecuciones/${encodeURIComponent(result.id)}`) }
    catch (error) { setRetryError(error instanceof Error ? error.message : 'No se pudo crear el reintento.') }
    finally { setBusy(false) }
  }
  async function manualRetry(event: FormEvent) {
    event.preventDefault(); setJsonError('')
    let parsed: unknown
    try { parsed = JSON.parse(json) } catch { setJsonError('El JSON no es válido. Revisa la sintaxis del lote.'); return }
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
      setJsonError('Ingresa un arreglo JSON con al menos un evento CDC objeto.'); return
    }
    setBusy(true); setRetryError('')
    try { const result = await repository.retry(run.id, parsed as Record<string, unknown>[]); setEditorOpen(false); setJson(''); onChanged(); navigate(`/datasets/preparacion-cdc/ejecuciones/${encodeURIComponent(result.id)}`) }
    catch (error) { setRetryError(error instanceof Error ? error.message : 'No se pudo crear el reintento.') }
    finally { setBusy(false) }
  }
  return <>
    <header className="prep-detail-header"><div><AppLink to="/datasets/preparacion-cdc/ejecuciones" className="prep-back">← Volver al historial</AppLink><span className="prep-eyebrow">US-007 · PREPARACIÓN CDC · DETALLE DE EJECUCIÓN</span><h1>{run.status === 'quality_rejected' ? 'Lote no publicado' : run.status === 'technical_failure' ? 'No se pudo completar la ejecución' : 'Detalle de ejecución'}</h1></div>
      <div className="prep-detail-actions"><span className={`prep-status prep-${run.status}`}>{run.status === 'quality_rejected' ? '⚠ Rechazado por calidad' : run.status === 'technical_failure' ? '⊗ Fallo técnico' : run.status === 'published' ? '✓ Publicada' : run.status}</span>{failed && (run.origin === 'manual' ? <button className="prep-primary" onClick={() => setEditorOpen(true)} disabled={busy}>↻ Reintentar manualmente</button> : <button className="prep-primary" onClick={pollRetry} disabled={busy}>{busy ? 'Reintentando…' : '↻ Reintentar manualmente'}</button>)}</div>
    </header>
    {retryError && <p role="alert" className="prep-error">{retryError}</p>}
    {run.status === 'quality_rejected' && <section className="prep-detail-card prep-quality"><div className="prep-detail-title"><span>⚠</span><div><h2>Diagnóstico de calidad</h2><p>El lote de eventos CDC no superó las validaciones de calidad requeridas.</p></div></div>
      <div className="prep-preservation"><span>⊘ No se creó una versión nueva del dataset preparado.</span><span>✓ Se conserva intacta la última versión exitosa{latestVersion ? ` (v${latestVersion.versionNumber})` : ''}.</span></div>
      <h3>Controles que bloquean publicación</h3><div className="prep-checks">{checks.map(check => <article key={check.code} className={check.passed ? 'prep-check prep-check-pass' : 'prep-check prep-check-fail'}><b>{checkLabels[check.code] ?? check.code}</b><span>{check.passed ? 'Sin rechazos' : `${check.rejectedCount} evento(s) rechazado(s)`}</span></article>)}</div>
    </section>}
    {run.status === 'technical_failure' && <section className="prep-detail-card prep-technical"><div className="prep-detail-title"><span>⊗</span><div><h2>Diagnóstico de ejecución</h2><p>{run.sanitizedError || 'Falló la ejecución técnica. La API no proporcionó más detalle.'}</p></div></div>
      {run.errorCode && <span className="prep-code">{run.errorCode}</span>}
      <div className="prep-sanitized"><strong>Evidencia técnica saneada · Data Engineering</strong><span className="prep-api-tag">Modo saneado</span><p>La evidencia disponible es exclusivamente técnica y saneada. No se exponen credenciales, sentencias SQL, cadenas de conexión ni payloads CDC.</p></div>
      <ul className="prep-guidelines"><li>El checkpoint no avanza ante una publicación fallida.</li><li>El rango CDC requiere reintento manual enlazado; no se reintenta automáticamente.</li><li>{run.origin === 'manual' ? 'Para el lote manual, envía eventos corregidos.' : 'El reintento reprocesa el rango retenido.'}</li></ul>
    </section>}
    <section className="prep-detail-card prep-technical-metadata"><h2>Parámetros de ejecución técnica provistos por API</h2><dl><div><dt>Pipeline</dt><dd>{run.pipelineId}</dd></div><div><dt>Origen</dt><dd>{run.origin === 'poll' ? 'Polling PostgreSQL' : 'Lote manual'}</dd></div><div><dt>Destino preparado</dt><dd>{run.datasetId}</dd></div><div><dt>Identificador de ejecución</dt><dd>{run.id}</dd></div><div><dt>Timestamp</dt><dd>{date(run.startedAt)}</dd></div><div><dt>Versión del dataset resultante</dt><dd>{run.publishedVersion ? `v${run.publishedVersion.versionNumber}` : 'Ninguna (se conserva la versión anterior si existe)'}</dd></div></dl>
      {run.publishedVersion && <AppLink className="prep-secondary" to={`/datasets/preparacion-cdc/datasets/${encodeURIComponent(run.datasetId)}/versiones/${encodeURIComponent(run.publishedVersion.versionId)}`}>Ver linaje y versión {run.publishedVersion.versionNumber}</AppLink>}
      {!run.publishedVersion && latestVersion && <AppLink className="prep-secondary" to={`/datasets/preparacion-cdc/datasets/${encodeURIComponent(run.datasetId)}/versiones/${encodeURIComponent(latestVersion.versionId)}`}>Ver última versión exitosa v{latestVersion.versionNumber}</AppLink>}
    </section>
    {editorOpen && <div className="prep-modal-backdrop"><section className="prep-json-dialog" role="dialog" aria-modal="true" aria-labelledby="prep-json-title"><header><h2 id="prep-json-title">Reenviar lote corregido</h2><button type="button" aria-label="Cerrar editor JSON" onClick={() => setEditorOpen(false)}>×</button></header><p>Corrige el origen y pega el lote completo como un arreglo JSON de eventos CDC. El reintento quedará enlazado a esta ejecución.</p><form onSubmit={manualRetry}><label htmlFor="cdc-json">Eventos CDC (JSON)</label><textarea id="cdc-json" rows={12} value={json} onChange={event => setJson(event.target.value)} placeholder={'[\n  {"sourceEventId":"...","businessKey":1,"operation":"update","eventTimestamp":"...","afterImage":{}}\n]'} />{jsonError && <p role="alert" className="prep-error">{jsonError}</p>}<footer><button type="button" className="prep-secondary" onClick={() => setEditorOpen(false)}>Cancelar</button><button type="submit" className="prep-primary" disabled={busy || !json.trim()}>{busy ? 'Enviando…' : 'Enviar reintento'}</button></footer></form></section></div>}
  </>
}
