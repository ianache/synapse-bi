import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiRequestError } from '../../adapters/apiRepository'
import type { DraftMetadata } from '../../domain/semanticCatalog'

function canonical(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(canonical).sort())
  if (value && typeof value === 'object') return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]))
  return JSON.stringify(typeof value === 'string' ? value.trim().normalize('NFC') : value)
}
export function DraftForm<T extends object, R extends DraftMetadata>({body, initial, title, save, reload, onReload, onSaved, children, protected: locked = false, headingLevel = 1}:
  {body: T; initial?: R; title: string; save: (body: T, key: string, version?: number) => Promise<R>; reload?: () => Promise<R>; onReload?: (item: R) => void;
    onSaved: (item: R) => void; children: ReactNode; protected?: boolean; headingLevel?: 1 | 2}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  const mounted = useRef(true), busy = useRef(false), intent = useRef<{fingerprint: string; key: string} | undefined>(undefined)
  const [pending, setPending] = useState(false), [reloading, setReloading] = useState(false), [error, setError] = useState<Error>()
  const [uncertain, setUncertain] = useState(false), [version, setVersion] = useState(initial?.version)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const conflict = error instanceof ApiRequestError && error.status === 412
  async function submit() {
    if (busy.current || locked || conflict) return
    busy.current = true; setPending(true); setError(undefined)
    const fingerprint = canonical(body)
    if (intent.current?.fingerprint !== fingerprint) intent.current = {fingerprint, key: crypto.randomUUID()}
    try {
      const result = await save(body, intent.current.key, version)
      if (mounted.current) { setUncertain(false); onSaved(result) }
    } catch (caught) {
      if (mounted.current) {
        const failure = caught instanceof Error ? caught : new Error('No se pudo guardar.')
        setError(failure)
        setUncertain(!(failure instanceof ApiRequestError) || failure.status >= 500)
      }
    } finally { busy.current = false; if (mounted.current) setPending(false) }
  }
  async function refresh() {
    if (busy.current || !reload || !window.confirm('¿Descartar tus cambios y cargar la versión actual?')) return
    busy.current = true; setReloading(true)
    try {
      const item = await reload()
      if (mounted.current) { onReload?.(item); setVersion(item.version); setError(undefined); setUncertain(false) }
    } catch { if (mounted.current) setError(new ApiRequestError(412, 'version_conflict', 'No se pudo recargar. Tus cambios se conservan.')) }
    finally { busy.current = false; if (mounted.current) setReloading(false) }
  }
  return <form className="semantic-form" aria-label={title} onSubmit={event => { event.preventDefault(); void submit() }}>
    <Heading>{title}</Heading>
    {locked && <p role="status">Protegida desde su primer uso. Crea una copia para cambiarla.</p>}
    {error && <div role="alert">{error.message}{uncertain && <p>Resultado incierto. Reintenta el mismo contenido antes de cambiarlo.</p>}</div>}
    <fieldset disabled={locked || pending || reloading || uncertain} aria-busy={pending || reloading}>{children}</fieldset>
    {!locked && <div className="semantic-actions"><button className="source-button primary" type="submit" disabled={pending || reloading || conflict}>{pending ? 'Guardando…' : uncertain ? 'Reintentar guardado' : 'Guardar borrador'}</button>
      {conflict && <button className="source-button" type="button" onClick={() => void refresh()} disabled={pending || reloading}>Recargar versión</button>}</div>}
  </form>
}
export function TextField({label, value, onChange, multiline = false, required = false, maxLength = 500}: {label: string; value: string | null | undefined; onChange: (value: string) => void; multiline?: boolean; required?: boolean; maxLength?: number}) {
  return <label className="semantic-field">{label}{multiline ? <textarea aria-label={label} value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} maxLength={maxLength} />
    : <input aria-label={label} value={value ?? ''} onChange={e => onChange(e.target.value)} required={required} maxLength={maxLength} />}</label>
}
