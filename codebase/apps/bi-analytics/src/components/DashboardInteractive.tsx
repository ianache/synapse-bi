import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@bi-analytics/design-system'
import type { ApiRepository } from '../adapters/apiRepository'
import type { LocalDashboard } from '../adapters/localDashboards'
import type { PublishedKpi } from '../domain/kpis'
import { ChannelChart } from './ChannelChart'
import { LiveKpiValue } from './LiveKpiValue'
import { DashboardUnavailable } from './DashboardUnavailable'
import './dashboard-interactive.css'

type Reader = { subject: string; name: string }
function validWindow(start: string, end: string) {
  const from = Date.parse(`${start}T00:00:00Z`), to = Date.parse(`${end}T00:00:00Z`)
  return !!start && !!end && Number.isFinite(from) && Number.isFinite(to) && from <= to && to - from <= 366 * 86400000
}
export function DashboardInteractive({ dashboard, kpis, api, onUpdate, onDetail }: { dashboard: LocalDashboard; kpis: PublishedKpi[]; api: ApiRepository; onUpdate: (dashboard: LocalDashboard) => void; onDetail: (kpi: PublishedKpi) => void }) {
  const [period, setPeriod] = useState({ startDate: dashboard.initialPeriod?.startDate ?? '', endDate: dashboard.initialPeriod?.endDate ?? '', channel: '' })
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [draft, setDraft] = useState({ startDate: dashboard.initialPeriod?.startDate ?? '', endDate: dashboard.initialPeriod?.endDate ?? '' })
  const [readers, setReaders] = useState<Reader[]>([])
  const [grants, setGrants] = useState<Reader[]>([])
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [accessLost, setAccessLost] = useState(false)
  const [pinned, setPinned] = useState<Record<string, PublishedKpi>>({})
  const [unavailable, setUnavailable] = useState<string[]>([])
  const [retryPinned, setRetryPinned] = useState(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const hasNavigated = useRef(false)
  useEffect(() => { if (hasNavigated.current) titleRef.current?.focus() }, [editing, sharing])
  const onAccessLost = useCallback(() => setAccessLost(true), [])
  const visible = dashboard.kpiIds.map(id => {
    const version = dashboard.modelVersions?.[id]
    const catalog = kpis.find(kpi => kpi.id === id && kpi.modelVersion === version)
    const stored = pinned[id]
    return catalog ?? (stored?.modelVersion === version ? stored : undefined)
  }).filter((kpi): kpi is PublishedKpi => !!kpi)
  const channelKpi = visible.find(kpi => kpi.dimensions?.includes('channel'))
  const valid = validWindow(period.startDate, period.endDate)
  useEffect(() => { setPeriod({ startDate: dashboard.initialPeriod?.startDate ?? '', endDate: dashboard.initialPeriod?.endDate ?? '', channel: '' }); setDraft({ startDate: dashboard.initialPeriod?.startDate ?? '', endDate: dashboard.initialPeriod?.endDate ?? '' }) }, [dashboard.id, dashboard.initialPeriod?.startDate, dashboard.initialPeriod?.endDate])
  useEffect(() => {
    const controller = new AbortController()
    const missing = dashboard.kpiIds.filter(id => dashboard.modelVersions?.[id] != null && !kpis.some(kpi => kpi.id === id && kpi.modelVersion === dashboard.modelVersions?.[id]))
    Promise.all(missing.map(async id => {
      try { return { id, item: await api.request<PublishedKpi>(`/kpis/${encodeURIComponent(id)}?version=${dashboard.modelVersions![id]}`, { signal: controller.signal }) } } catch { return { id, item: null } }
    })).then(items => { if (!controller.signal.aborted) { setPinned(Object.fromEntries(items.filter((entry): entry is { id: string; item: PublishedKpi } => !!entry.item).map(entry => [entry.id, entry.item]))); setUnavailable(items.filter(entry => !entry.item).map(entry => entry.id)) } })
    return () => controller.abort()
  }, [api, dashboard.kpiIds, dashboard.modelVersions, kpis, retryPinned])
  async function savePeriod() {
    setBusy(true); setError('')
    try { const updated = await api.setInitialPeriod(dashboard, draft); onUpdate(updated); setEditing(false) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el período.') } finally { setBusy(false) }
  }
  async function openSharing() {
    hasNavigated.current = true; setSharing(true); setError('')
    try { const [directory, existing] = await Promise.all([api.readers(), api.dashboardReaders(dashboard)]); setReaders(directory.items); setGrants(existing.items) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar el directorio.') }
  }
  async function changeReader(subject: string, grant: boolean) {
    setBusy(true); setError('')
    try { const updated = await api.setReader(dashboard, subject, grant); onUpdate(updated); const current = await api.dashboardReaders(updated); setGrants(current.items); setSelected('') } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar el acceso.') } finally { setBusy(false) }
  }
  async function removeKpi(id: string) {
    setBusy(true); setError('')
    try { onUpdate(await api.removeKpi(dashboard, id)) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo retirar el KPI.') } finally { setBusy(false) }
  }
  if (accessLost) return <DashboardUnavailable />
  if ((editing || sharing) && dashboard.editable) return <div className="interactive-dashboard interactive-management">
    <header className="interactive-management-header"><div><h1 ref={titleRef} tabIndex={-1}>Gestionar y compartir dashboard: {dashboard.name}</h1><p>Configura el período inicial y el acceso de lectura.</p></div><button type="button" onClick={() => { setEditing(false); setSharing(false); setError('') }}><Icon name="arrow-left" size={18} />Volver al dashboard</button></header>
    {error && <p role="alert">{error}</p>}
    <div className="interactive-management-layout"><div className="interactive-management-main">
      <section id="dashboard-period-editor" className="interactive-panel"><h2>1. Configuración general y período inicial</h2><label>Nombre del dashboard<input value={dashboard.name} disabled /></label><p>Edición del nombre: no disponible.</p><div className="interactive-management-dates"><label>Fecha inicial<input type="date" value={draft.startDate} onChange={e => setDraft({ ...draft, startDate: e.target.value })} /></label><label>Fecha final<input type="date" value={draft.endDate} onChange={e => setDraft({ ...draft, endDate: e.target.value })} /></label></div><p>La fecha inicial debe ser anterior o igual a la final y el intervalo no puede superar 366 días. El canal inicial es Todos los canales.</p><button disabled={busy || !validWindow(draft.startDate, draft.endDate)} onClick={() => void savePeriod()}><Icon name="save" size={18} />Guardar período</button></section>
      <section className="interactive-panel"><h2>2. KPI añadidos</h2><a href="/explorar">Añadir KPI</a>{visible.length || unavailable.length ? <ul className="interactive-management-list">{visible.map(kpi => <li key={kpi.id}><span><strong>{kpi.name}</strong><br /><small>{kpi.id}</small></span><button disabled={busy} onClick={() => void removeKpi(kpi.id)}>Retirar {kpi.name}</button></li>)}{unavailable.map(id => <li key={id}><span>Versión del KPI no disponible: {id}</span><button disabled={busy} onClick={() => void removeKpi(id)}>Retirar {id}</button></li>)}</ul> : <p>No hay indicadores disponibles</p>}{unavailable.length > 0 && <button onClick={() => setRetryPinned(value => value + 1)}>Reintentar carga de KPI</button>}</section>
      <section id="dashboard-sharing" className="interactive-panel"><h2>3. Compartir con personas del tenant</h2><p>Las personas autorizadas pueden consultar el dashboard. La revocación se aplica en la siguiente solicitud o recarga.</p>{!sharing ? <button onClick={() => void openSharing()}>Administrar acceso de lectura</button> : <><label>Persona<select value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecciona una persona</option>{readers.filter(person => !grants.some(item => item.subject === person.subject)).map(person => <option key={person.subject} value={person.subject}>{person.name}</option>)}</select></label><button disabled={!selected || busy} onClick={() => void changeReader(selected, true)}><Icon name="user-plus" size={18} />Conceder acceso</button><ul className="interactive-management-list">{grants.map(person => <li key={person.subject}><span>{person.name} · Solo lectura</span><button disabled={busy} onClick={() => void changeReader(person.subject, false)}>Retirar acceso a {person.name}</button></li>)}</ul><button onClick={() => setSharing(false)}>Cerrar</button></>}</section>
    </div><aside className="interactive-panel interactive-management-summary"><h2>Resumen del dashboard</h2><dl><dt>Propietario</dt><dd>{dashboard.owner}</dd><dt>Acceso</dt><dd>{dashboard.shared ? 'Compartido' : 'Personal'}</dd><dt>Canal inicial</dt><dd>Todos los canales</dd></dl></aside></div>
  </div>
  return <div className="interactive-dashboard">
    <header className="interactive-header"><div><h1 ref={titleRef} tabIndex={-1}>{dashboard.name}</h1><p>Propietario: {dashboard.owner} · {dashboard.shared ? 'Compartido' : 'Personal'}</p></div>{dashboard.editable && <div className="interactive-actions"><a href="/explorar"><Icon name="plus" size={18} /><span>Añadir KPI</span></a><button onClick={() => { hasNavigated.current = true; setEditing(true) }}><Icon name="edit" size={18} /><span>Editar dashboard</span></button><button onClick={() => void openSharing()}><Icon name="share" size={18} /><span>Compartir</span></button></div>}</header>
    {error && <p role="alert">{error}</p>}
    {!dashboard.initialPeriod ? <p role="status">{dashboard.editable ? 'Configura el período inicial para consultar este dashboard.' : 'El período inicial no está disponible.'}</p> : <><section className="interactive-filters" aria-label="Filtros del dashboard"><label>Desde<input aria-label="Desde" type="date" value={period.startDate} onChange={e => setPeriod({ ...period, startDate: e.target.value })} /></label><label>Hasta<input aria-label="Hasta" type="date" value={period.endDate} onChange={e => setPeriod({ ...period, endDate: e.target.value })} /></label><label>Canal<select aria-label="Canal" value={period.channel} onChange={e => setPeriod({ ...period, channel: e.target.value })}><option value="">Todos los canales</option><option value="Digital">Digital</option><option value="Tienda">Tienda</option></select></label>{period.channel && <button aria-label={`Quitar filtro Canal: ${period.channel}`} onClick={() => setPeriod({ ...period, channel: '' })}>Canal: {period.channel} ×</button>}<button onClick={() => setPeriod({ ...dashboard.initialPeriod!, channel: '' })}>Limpiar filtros</button>{period.channel && <p className="interactive-filter-context">{`Filtro por canal activo: ${period.channel}`}</p>}</section>
      {!valid ? <p role="alert">Selecciona fechas ordenadas con un intervalo máximo de 366 días.</p> : <><div className="interactive-kpis">{visible.map(kpi => <article className="interactive-card" key={kpi.id}><div className="interactive-card-heading"><h2>{kpi.name}</h2><code>{kpi.id}</code></div>{kpi.definition && <p className="interactive-card-definition">{kpi.definition}</p>}{period.channel && !kpi.dimensions?.includes('channel') && <p>Este filtro no aplica</p>}<LiveKpiValue api={api} kpi={kpi} version={dashboard.modelVersions?.[kpi.id] ?? kpi.modelVersion ?? 1} onAccessLost={onAccessLost} period={{ dashboardId: dashboard.id, startDate: period.startDate, endDate: period.endDate, ...(period.channel && kpi.dimensions?.includes('channel') ? { channel: period.channel } : {}) }} /><button onClick={() => onDetail(kpi)}>Ver definición</button>{dashboard.editable && <button disabled={busy} onClick={() => void removeKpi(kpi.id)}>Retirar {kpi.name}</button>}</article>)}{channelKpi && <ChannelChart api={api} kpi={channelKpi} version={dashboard.modelVersions?.[channelKpi.id] ?? channelKpi.modelVersion ?? 1} period={{ ...period, dashboardId: dashboard.id }} onAccessLost={onAccessLost} onSelect={channel => setPeriod({ ...period, channel })} />}</div></>}
    </>}
    {dashboard.editable && (!dashboard.initialPeriod || !valid) && visible.length > 0 && <section className="interactive-panel"><h2>KPI añadidos</h2>{visible.map(kpi => <div key={kpi.id}>{kpi.name} <button disabled={busy} onClick={() => void removeKpi(kpi.id)}>Retirar {kpi.name}</button></div>)}</section>}
    {unavailable.length > 0 && <div role="alert">No se pudieron cargar algunas versiones de KPI. <button onClick={() => setRetryPinned(value => value + 1)}>Reintentar carga de KPI</button></div>}
    {!visible.length && !unavailable.length && <section className="interactive-panel interactive-empty" aria-labelledby="dashboard-empty-title"><span className="interactive-empty-icon"><Icon name="eye-off" size={28} /></span><h2 id="dashboard-empty-title">No hay indicadores disponibles</h2><p>No hay indicadores disponibles para mostrar en este dashboard.</p><a href="/dashboards"><Icon name="arrow-left" size={18} />Volver a dashboards</a></section>}
  </div>
}
