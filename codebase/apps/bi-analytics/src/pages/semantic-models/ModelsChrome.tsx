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
  return <div className="models-notice" role="note"><Icon name="lock" size={18} /><p><strong>Guardar no publica, certifica ni calcula.</strong> Esta etapa registra modelos semánticos en borrador. Las capturas no se sincronizan automáticamente con el catálogo y requieren actualización explícita.</p></div>
}
export function ModelError({error, retry}: {error?: Error; retry?: () => void}) {
  return error ? <div className="models-error" role="alert"><p>{error.message}</p>{retry && <button type="button" className="source-button" onClick={retry}>Reintentar</button>}</div> : null
}
export function CaptureSummary({capture, pending = false}: {capture: Capture; pending?: boolean}) {
  const measures = capture.components.filter(c => c.kind === 'measure'), dimensions = capture.components.filter(c => c.kind === 'dimension')
  const origins = [...new Set(capture.components.flatMap(c => c.bindingSnapshot ? [`${c.bindingSnapshot.schema}.${c.bindingSnapshot.object}`] : []))]
  return <aside className="models-card models-summary" aria-label="Resumen de la captura"><h2><Icon name="database" size={18} />{pending ? 'Captura que se guardará' : 'Resumen del contrato'}</h2><p>Captura estable · actualización explícita</p><section><h3>{capture.kpis.length} KPI seleccionados</h3><ul>{capture.kpis.map(k => <li key={k.id}>{k.name}</li>)}</ul>{!capture.kpis.length && <p>Sin KPI. Borrador con faltantes documentales.</p>}</section><section><h3>{measures.length} medidas únicas</h3><ul>{measures.map(c => <li key={c.id}>{c.name}</li>)}</ul></section><section><h3>{dimensions.length} dimensiones únicas</h3><ul>{dimensions.map(c => <li key={c.id}>{c.name}</li>)}</ul><small>Las dependencias compartidas se cuentan una sola vez.</small></section><section><h3>Origen físico declarado</h3>{origins.length ? origins.map(origin => <code key={origin}>{origin}</code>) : <p>Sin procedencia declarada.</p>}<small>No se realiza introspección ni se leen filas.</small></section><div className="models-summary-rule">Se conservarán las definiciones y dependencias al guardar. Los cambios del catálogo requieren comparación y actualización explícitas.</div><span className="models-badge">Borrador · sin versión publicada</span></aside>
}
export const modelDate = (value: string) => new Date(value).toLocaleString('es-PE', {dateStyle: 'medium', timeStyle: 'short'})
