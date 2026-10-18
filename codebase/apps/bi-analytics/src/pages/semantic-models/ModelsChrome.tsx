import {Icon} from '@bi-analytics/design-system'
import type {Capture} from '../../domain/semanticModels'
import type {KeyboardEvent} from 'react'

export function modelTabKeys(event: KeyboardEvent<HTMLDivElement>, values: string[], select: (value: string) => void) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role=tab]')]
  const index = buttons.findIndex(button => button === document.activeElement)
  if (index < 0) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + values.length) % values.length
  select(values[next]); buttons[next]?.focus()
}

export function ModelNotice() {
  return <div className="models-notice" role="note"><span className="models-notice-icon"><Icon name="lock" size={20} /></span><div><div className="models-notice-title">Aviso normativo de gobernanza <span className="models-badge">Sólo lectura y borrador</span></div><p><strong>Guardar no publica, certifica ni calcula.</strong> Esta etapa registra modelos semánticos en borrador. Las capturas no se sincronizan automáticamente con el catálogo y requieren actualización explícita.</p></div></div>
}
export function ModelError({error, retry}: {error?: Error; retry?: () => void}) {
  return error ? <div className="models-error" role="alert"><p>{error.message}</p>{retry && <button type="button" className="source-button" onClick={retry}>Reintentar</button>}</div> : null
}
function DependencyCard({component}: {component: Capture['components'][number]}) {
  const binding = component.bindingSnapshot
  return <li className="models-summary-dependency"><strong>{component.name}</strong><code>{component.id}</code><small>{binding ? `${binding.schema}.${binding.object}.${binding.column}` : 'Sin procedencia declarada.'}</small></li>
}
export function CaptureSummary({capture, pending = false, digest}: {capture: Capture; pending?: boolean; digest?: string}) {
  const measures = capture.components.filter(c => c.kind === 'measure'), dimensions = capture.components.filter(c => c.kind === 'dimension')
  const origins = [...new Map(capture.components.flatMap(c => c.bindingSnapshot ? [[JSON.stringify([c.bindingSnapshot.sourceId, c.bindingSnapshot.datasetId, c.bindingSnapshot.datasetVersion, c.bindingSnapshot.schema, c.bindingSnapshot.object]), c.bindingSnapshot] as const] : [])).values()]
  return <aside className="models-card models-summary" aria-label="Resumen de la captura">
    <header><h2><Icon name="database" size={18} />{pending ? 'Captura que se guardará' : 'Resumen del contrato'}</h2><p>Captura estable · actualización explícita</p></header>
    <section><h3>{capture.kpis.length} KPI seleccionados</h3><ul className="models-summary-kpis">{capture.kpis.map(k => <li key={k.id}>{k.name}</li>)}</ul>{!capture.kpis.length && <p>Sin KPI. Borrador con faltantes documentales.</p>}</section>
    <section><h3>{measures.length} medidas únicas</h3><ul className="models-summary-dependencies">{measures.map(c => <DependencyCard key={c.id} component={c} />)}</ul></section>
    <section><h3>{dimensions.length} dimensiones únicas</h3><ul className="models-summary-dependencies">{dimensions.map(c => <DependencyCard key={c.id} component={c} />)}</ul><small>Las dependencias compartidas se cuentan una sola vez.</small></section>
    <section><h3>Origen físico declarado</h3>{origins.length ? origins.map(origin => <div className="models-summary-origin" key={JSON.stringify(origin)}><strong><Icon name="database" size={14} />{origin.schema}.{origin.object}</strong><span>Dataset {origin.datasetId} · revisión {origin.datasetVersion}</span><small>Fuente: {origin.sourceId}</small></div>) : <p>Sin procedencia declarada.</p>}<small>No se realiza introspección ni se leen filas.</small></section>
    <div className="models-summary-rule"><strong>Regla de gobernanza</strong>Se conservarán las definiciones y dependencias al guardar. Los cambios del catálogo requieren comparación y actualización explícitas.</div>
    <footer><span>Estado resultante</span><span className="models-badge">Borrador · sin versión publicada</span></footer>
    {digest && <div className="models-summary-digest"><span>Integridad de la captura</span><code title={digest}>sha256:{digest.slice(0, 12)}…{digest.slice(-6)}</code></div>}
  </aside>
}
export const modelDate = (value: string) => new Date(value).toLocaleString('es-PE', {dateStyle: 'medium', timeStyle: 'short'})
