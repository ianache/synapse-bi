import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Badge, Button, Icon, Modal } from '@bi-analytics/design-system'
import { AppLink, navigate, SynapseShell } from '../components/SynapseShell'
import { normalizeSearch, searchKpis, type PublishedKpi } from '../domain/kpis'
import type { LocalDashboard } from '../adapters/localDashboards'
import type { ApiRepository } from '../adapters/apiRepository'
import { useWorkspaceRepository } from '../hooks/useWorkspaceRepository'
import { LiveKpiValue } from '../components/LiveKpiValue'
import './kpi-workspace.css'

function KpiBadges({ kpi }: { kpi: PublishedKpi }) {
  return <div className="kpi-badges"><Badge>{kpi.domain}</Badge><Badge tone="success">● Publicado</Badge><span className="kpi-quality"><Icon name="check" size={12} />Calidad · {kpi.quality}</span></div>
}

function KpiMetadata({ kpi }: { kpi: PublishedKpi }) {
  return <dl className="kpi-metadata"><div><dt>Propietario</dt><dd>{kpi.owner}</dd></div><div><dt>Frescura del dato</dt><dd><span className="fresh-dot" />{kpi.freshness}</dd></div><div><dt>Frecuencia de cálculo</dt><dd>{kpi.frequency}</dd></div></dl>
}

function KpiDetails({ kpi, onClose }: { kpi: PublishedKpi; onClose: () => void }) {
  return <Modal title={`Detalle de ${kpi.name}`} onClose={onClose}><div className="kpi-detail"><div className="kpi-section-heading"><h2>{kpi.name}</h2><Button variant="ghost" onClick={onClose} aria-label="Cerrar detalle">×</Button></div><KpiBadges kpi={kpi} /><p>{kpi.definition}</p><dl><dt>Fórmula</dt><dd>{kpi.formula}</dd><dt>Unidad</dt><dd>{kpi.unit}</dd><dt>Grano</dt><dd>{kpi.grain}</dd><dt>Dimensiones del modelo</dt><dd>{kpi.dimensions?.join(', ') ?? 'Fecha, producto y canal (ejemplo)'}</dd></dl><KpiMetadata kpi={kpi} /><h3>Lineage</h3><p className="kpi-lineage"><Icon name="layers" />{kpi.lineage?.map(node => node.label).join(' → ') ?? `Fuente de ventas → Dataset preparado → Modelo semántico → ${kpi.name}`}</p><p className="kpi-muted">{kpi.dataMode === 'synthetic' ? 'Modelo de desarrollo con datos sintéticos. Calidad y frescura sin evaluar.' : 'Consulta la definición y los metadatos del modelo antes de utilizar el KPI.'}</p><Button onClick={() => { onClose(); navigate(`/kpi/${kpi.id}/agregar`) }}><Icon name="plus" />Añadir al dashboard</Button></div></Modal>
}

function ExploreKpis({ onDetail, kpis, apiMode }: { onDetail: (kpi: PublishedKpi) => void; kpis: PublishedKpi[]; apiMode: boolean }) {
  const [query, setQuery] = useState('ventas')
  const [category, setCategory] = useState('Todos')
  const [advanced, setAdvanced] = useState(false)
  const [owner, setOwner] = useState('')
  const [sort, setSort] = useState('relevance')
  const results = searchKpis(query, category, owner, kpis)
  if (sort === 'name') results.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  function reset() { setQuery(''); setCategory('Todos'); setOwner('') }
  return <>
    <div className="kpi-page-intro"><span className="kpi-eyebrow"><Icon name="check" size={12} />MÉTRICAS PUBLICADAS</span><h1>Encuentra un KPI confiable</h1><p>Explora métricas gobernadas y publicadas por los equipos de datos.<br className="desktop-break" /> Reutiliza sus definiciones y trazabilidad en tus dashboards analíticos.</p></div>
    <section className="kpi-search-panel" aria-label="Buscar y filtrar KPI">
      <div className="kpi-search-row"><label className="kpi-search-input"><Icon name="search" size={20} /><span className="sr-only">Buscar KPI</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca por nombre, sinónimo o pregunta..." type="search" /></label><Button variant="outline" aria-expanded={advanced} aria-controls="advanced-kpi-filters" onClick={() => setAdvanced(!advanced)}><Icon name="filter" />Filtros avanzados</Button></div>
      <div className="kpi-filters"><span>Filtrar por categoría:</span>{['Todos', 'Ventas', 'Clientes', 'Operaciones', 'Publicados'].map(item => <button key={item} type="button" className="kpi-chip" aria-pressed={category === item} onClick={() => setCategory(item)}>{category === item && <Icon name="check" size={12} />}{item}</button>)}</div>
      {advanced && <div id="advanced-kpi-filters" className="kpi-advanced"><label>Propietario<select value={owner} onChange={e => setOwner(e.target.value)}><option value="">Todos los propietarios</option>{Array.from(new Set(kpis.map(k => k.owner))).map(name => <option key={name}>{name}</option>)}</select></label><Button variant="ghost" onClick={reset}>Limpiar filtros</Button></div>}
    </section>
    <div className="kpi-results-heading"><h2>{query.trim() ? <>Resultados para: <span>“{query.trim()}”</span></> : 'Todos los KPI'} <small aria-live="polite">{results.length} métricas encontradas</small></h2><label className="kpi-sort">Ordenar por<select value={sort} onChange={e => setSort(e.target.value)}><option value="relevance">Relevancia</option><option value="name">Nombre A–Z</option></select></label></div>
    <div className="kpi-explore-grid"><section aria-label="Resultados de KPI" className="kpi-results">
      {results.map(kpi => <article key={kpi.id} className="kpi-result-card"><div className="kpi-result-title"><h3>{kpi.name}</h3><KpiBadges kpi={kpi} /></div><code className="kpi-id">{kpi.id}</code><p>{kpi.definition}</p><KpiMetadata kpi={kpi} /><div className="kpi-result-actions"><button className="kpi-text-button kpi-lineage-link" onClick={() => onDetail(kpi)}><Icon name="layers" size={14} />Ver lineage de ejemplo</button><button className="kpi-text-button" onClick={() => onDetail(kpi)}>Ver detalle<Icon name="arrow" size={14} /></button><Button onClick={() => navigate(`/kpi/${kpi.id}/agregar`)} aria-label={`Añadir al dashboard: ${kpi.name}`}><Icon name="plus" />Añadir al dashboard</Button></div></article>)}
      {!results.length && <div className="kpi-empty" role="status"><Icon name="search" size={32} /><h3>No encontramos KPI con esos filtros</h3><p>Prueba otro nombre o sinónimo, o amplía la categoría.</p><Button variant="outline" onClick={reset}>Limpiar búsqueda y filtros</Button></div>}
    </section><aside className="kpi-trust-panel" aria-label="Confianza y gobernanza"><div className="kpi-trust-title"><span className="kpi-trust-icon"><Icon name="check" size={20} /></span><h2>¿Por qué estos resultados son confiables?</h2></div>{[{ icon: 'receipt' as const, title: 'Definición gobernada', text: 'Un significado compartido y versionado para cada métrica publicada.' }, { icon: 'layers' as const, title: 'Lineage disponible', text: 'Entiende el recorrido desde la fuente hasta tu visualización.' }, { icon: 'lock' as const, title: 'Acceso autorizado', text: 'La API debe aplicar los permisos del usuario y su tenant.' }].map(item => <div className="kpi-trust-item" key={item.title}><Icon name={item.icon} /><div><h3>{item.title}</h3><p>{item.text}</p></div></div>)}<div className="kpi-demo-note"><strong>Vista previa de la experiencia</strong><p>{apiMode ? 'Los dashboards se guardan en el backend. El catálogo indica si los datos son sintéticos o provienen de una fuente conectada.' : 'Los valores de calidad, frescura y permisos son ilustrativos. Los dashboards se guardan sólo en este navegador.'}</p></div></aside></div>
  </>
}

function CreateDashboard({ dashboards, onCreate, onCancel }: { dashboards: LocalDashboard[]; onCreate: (name: string) => Promise<boolean>; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) { setError('Escribe un nombre para el dashboard.'); return }
    if (dashboards.some(d => normalizeSearch(d.name) === normalizeSearch(trimmed))) { setError('Ya existe un dashboard con ese nombre.'); return }
    if (pending) return
    setPending(true)
    try { if (await onCreate(trimmed)) setError('') } finally { setPending(false) }
  }
  return <form className="kpi-create-form" onSubmit={submit}><h3>Crear dashboard</h3><label htmlFor="dashboard-name">Nombre del dashboard</label><input id="dashboard-name" autoFocus maxLength={80} value={name} onChange={e => { setName(e.target.value); setError('') }} aria-invalid={!!error} aria-describedby={error ? 'dashboard-name-error' : undefined} placeholder="Por ejemplo: Ventas por canal" />{error && <p id="dashboard-name-error" role="alert" className="kpi-error">{error}</p>}<p>Se creará un dashboard personal de Ana Rivas y quedará seleccionado para añadir el KPI.</p><div className="kpi-button-row"><Button variant="ghost" onClick={onCancel}>Cancelar creación</Button><Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Crear y seleccionar'}</Button></div></form>
}

function AddKpi({ kpi, dashboards, onCreate, onAdd, onDetail, onSuccess }: { kpi: PublishedKpi; dashboards: LocalDashboard[]; onCreate: (name: string) => Promise<LocalDashboard | null>; onAdd: (dashboard: LocalDashboard, kpi: PublishedKpi) => Promise<LocalDashboard | null>; onDetail: (kpi: PublishedKpi) => void; onSuccess: (dashboard: LocalDashboard) => void }) {
  const [selectedId, setSelectedId] = useState(() => dashboards.find(d => d.editable && !d.kpiIds.includes(kpi.id))?.id ?? '')
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [personalOnly, setPersonalOnly] = useState(false)
  const selected = dashboards.find(d => d.id === selectedId)
  const [busy, setBusy] = useState(false)
  const canAdd = !busy && !creating && selected?.editable && !selected.kpiIds.includes(kpi.id)
  const visible = dashboards.filter(d => normalizeSearch(d.name).includes(normalizeSearch(query)) && (!personalOnly || !d.shared))
  async function create(name: string) {
    const dashboard = await onCreate(name)
    if (!dashboard) return false
    setSelectedId(dashboard.id); setQuery(''); setPersonalOnly(false); setCreating(false)
    return true
  }
  async function add() {
    if (!selected || !canAdd) return
    setBusy(true)
    try {
      const updated = await onAdd(selected, kpi)
      if (updated) onSuccess(updated)
    } finally { setBusy(false) }
  }
  return <>
    <AppLink to="/explorar" className="kpi-back">← Volver a Explorar KPI</AppLink><div className="kpi-page-intro"><h1>Añadir KPI al dashboard</h1><p>Asigna la métrica publicada a un espacio de visualización para tu equipo.</p></div>
    <div className="kpi-destination-grid"><aside className="kpi-summary" aria-label="KPI seleccionado"><span className="kpi-eyebrow">KPI SELECCIONADO</span><code className="kpi-id">{kpi.id}</code><h2><Icon name="chart" size={22} />{kpi.name}</h2><KpiBadges kpi={kpi} /><div className="kpi-definition"><span>DEFINICIÓN DE NEGOCIO</span><p>{kpi.definition}</p></div><KpiMetadata kpi={kpi} /><button className="kpi-lineage-box" onClick={() => onDetail(kpi)}><Icon name="layers" />Ver lineage y definición<Icon name="arrow" /></button><p className="kpi-reassurance"><Icon name="lock" /><span>El KPI conservará su definición gobernada, lineage y referencia al modelo semántico.</span></p></aside>
    <section className="kpi-destinations" aria-labelledby="destination-heading"><h2 id="destination-heading">Elige dónde quieres añadirlo</h2><p>Selecciona un dashboard existente o crea uno nuevo para continuar.</p><div className="kpi-search-row"><label className="kpi-search-input"><Icon name="search" /><span className="sr-only">Buscar dashboards</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar dashboards..." /></label><Button variant="outline" onClick={() => setCreating(true)} aria-expanded={creating}><Icon name="plus" />Crear dashboard</Button></div><label className="kpi-personal-filter"><input type="checkbox" checked={personalOnly} onChange={e => setPersonalOnly(e.target.checked)} />Sólo dashboards personales</label>
      {creating && <CreateDashboard dashboards={dashboards} onCreate={create} onCancel={() => setCreating(false)} />}
      <fieldset className="kpi-destination-list"><legend className="sr-only">Dashboard de destino</legend>{visible.map(d => <label key={d.id} className="kpi-dashboard-option" data-selected={selectedId === d.id} data-disabled={!d.editable || d.kpiIds.includes(kpi.id)}><input type="radio" name="dashboard" value={d.id} checked={selectedId === d.id} disabled={!d.editable || d.kpiIds.includes(kpi.id)} onChange={() => setSelectedId(d.id)} /><span className="kpi-dashboard-icon"><Icon name="grid" size={22} /></span><span className="kpi-dashboard-copy"><strong>{d.name}</strong><span>Propietario: {d.owner}</span><span>Actualizado: {d.updated}</span><span><Icon name="chart" size={12} />{d.visualizations} visualizaciones</span></span><span className="kpi-dashboard-tags"><Badge>{d.shared ? 'Compartido' : 'Personal'}</Badge><Badge tone={d.editable ? 'success' : 'warning'}>{!d.editable ? 'Sólo lectura' : d.kpiIds.includes(kpi.id) ? 'KPI ya añadido' : 'Lectura / Edición'}</Badge></span></label>)}</fieldset>
      {!visible.length && <div className="kpi-empty" role="status"><h3>No hay dashboards con esos filtros</h3><p>Puedes limpiar la búsqueda o crear un dashboard personal.</p><Button variant="outline" onClick={() => { setQuery(''); setPersonalOnly(false) }}>Limpiar filtros</Button></div>}
      <div className="kpi-automatic-note"><Icon name="monitor" /><p><strong>Configuración inicial:</strong> el KPI se añadirá como tarjeta vinculada al modelo. Podrás verlo en el dashboard seleccionado.</p></div>
    </section></div>
    <div className="kpi-action-bar"><p>Destino seleccionado: <strong>{kpi.name}</strong><Icon name="arrow" size={14} /><span>{selected?.name ?? 'Selecciona un dashboard'}</span></p><div className="kpi-button-row"><Button variant="outline" onClick={() => navigate('/explorar')}>Cancelar</Button><Button disabled={!canAdd} loading={busy} onClick={add}><Icon name="plus" />Añadir KPI</Button></div></div>
  </>
}

function Dashboards({ dashboards, dashboardId, onDetail, kpis, api }: { dashboards: LocalDashboard[]; dashboardId?: string; onDetail: (kpi: PublishedKpi) => void; kpis: PublishedKpi[]; api: ApiRepository | null }) {
  const [period, setPeriod] = useState({ startDate: '2026-10-01', endDate: '2026-10-03', channel: '' })
  const dashboard = dashboards.find(d => d.id === dashboardId)
  if (dashboardId && !dashboard) return <div className="kpi-empty"><h1>Dashboard no encontrado</h1><AppLink to="/dashboards">Ver dashboards</AppLink></div>
  return <><div className="kpi-page-intro"><span className="kpi-eyebrow">ESPACIO DE ANÁLISIS</span><h1>{dashboard?.name ?? 'Dashboards'}</h1><p>{dashboard ? `Propietario: ${dashboard.owner} · ${dashboard.shared ? 'Compartido' : 'Personal'}` : 'Encuentra tus espacios de análisis y los KPI que has añadido.'}</p></div><AppLink to="/explorar" className="kpi-add-link"><Icon name="plus" />Explorar y añadir KPI</AppLink>{dashboard ? <>{api && <div className="kpi-query-filters"><label>Desde<input type="date" value={period.startDate} onChange={e => setPeriod(p => ({ ...p, startDate: e.target.value }))} /></label><label>Hasta<input type="date" value={period.endDate} onChange={e => setPeriod(p => ({ ...p, endDate: e.target.value }))} /></label><label>Canal<select aria-label="Canal" value={period.channel} onChange={e => setPeriod(p => ({ ...p, channel: e.target.value }))}><option value="">Todos</option><option>Digital</option><option>Tienda</option></select></label></div>}<h2>KPI añadidos</h2><div className="kpi-dashboard-grid">{dashboard.kpiIds.map(id => kpis.find(k => k.id === id)).filter((k): k is PublishedKpi => !!k).map(k => <article className="kpi-result-card" key={k.id}><h3>{k.name}</h3><KpiBadges kpi={k} /><p>{k.definition}</p>{api ? <LiveKpiValue api={api} kpi={k} version={dashboard.modelVersions?.[k.id] ?? k.modelVersion ?? 1} period={{ startDate: period.startDate, endDate: period.endDate, ...(period.channel ? { channel: period.channel } : {}) }} /> : <p className="kpi-muted">Sin conexión al motor de consulta. El valor se mostrará al integrar la API semántica.</p>}<button className="kpi-text-button" onClick={() => onDetail(k)}>Ver definición<Icon name="arrow" /></button></article>)}</div>{!dashboard.kpiIds.length && <p className="kpi-empty">Todavía no has añadido KPI desde el catálogo.</p>}{!api && <p className="kpi-muted">Esta vista muestra los KPI añadidos en la demostración. Las {dashboard.visualizations - dashboard.kpiIds.length} visualizaciones de ejemplo originales no contienen datos de consulta.</p>}</> : <div className="kpi-dashboard-grid">{dashboards.map(d => <AppLink key={d.id} className="kpi-dashboard-tile" to={`/dashboards/${d.id}`}><Icon name="grid" size={26} /><h2>{d.name}</h2><p>{d.owner} · {d.visualizations} visualizaciones</p><Badge>{d.shared ? 'Compartido' : 'Personal'}</Badge><span className="kpi-tile-open">Abrir dashboard →</span></AppLink>)}</div>}</>
}

export function KpiWorkspace({ path }: { path: string }) {
  const { api, dashboards, kpis, loading, error, refresh, createDashboard, addKpi } = useWorkspaceRepository()
  const [detail, setDetail] = useState<PublishedKpi | null>(null)
  const [success, setSuccess] = useState<{ name: string; id: string } | null>(null)
  const previousPath = useRef(path)
  const addMatch = /^\/kpi\/([^/]+)\/agregar\/?$/.exec(path)
  const dashboardMatch = /^\/dashboards\/([^/]+)\/?$/.exec(path)
  const kpi = kpis.find(k => k.id === addMatch?.[1])
  const isDashboards = path.startsWith('/dashboards')
  useEffect(() => {
    document.documentElement.lang = 'es'
    document.title = `${addMatch ? 'Añadir KPI al dashboard' : isDashboards ? 'Dashboards' : 'Explorar KPI'} · Synapse BI`
    if (previousPath.current !== path) {
      setDetail(null)
      document.getElementById('workspace')?.focus()
      window.scrollTo?.(0, 0)
      previousPath.current = path
    }
  }, [path, isDashboards, !!addMatch])
  return <SynapseShell active={isDashboards ? 'dashboards' : 'explore'} breadcrumb={addMatch ? 'Explorar KPI / Añadir al dashboard' : isDashboards ? 'Dashboards' : 'Explorar KPI'}>
    {error && <div className="kpi-error-banner"><p role="alert">{error}</p>{api && <Button variant="outline" onClick={() => void refresh()}>Actualizar datos</Button>}</div>}
    {success && <div className="kpi-success" role="status"><Icon name="check" /><span>KPI añadido a <strong>{success.name}</strong>.</span><AppLink to={`/dashboards/${success.id}`}>Abrir dashboard</AppLink><button aria-label="Cerrar confirmación" onClick={() => setSuccess(null)}>×</button></div>}
    {loading ? <p role="status">Cargando catálogo y dashboards…</p> : error && !kpis.length ? <p>Comprueba que el backend esté disponible y vuelve a cargar los datos.</p> : addMatch ? kpi ? <AddKpi key={kpi.id} kpi={kpi} dashboards={dashboards} onCreate={createDashboard} onAdd={addKpi} onDetail={setDetail} onSuccess={d => { setSuccess({ name: d.name, id: d.id }); navigate(`/dashboards/${d.id}`) }} /> : <div className="kpi-empty"><h1>KPI no encontrado</h1><AppLink to="/explorar">Volver a explorar KPI</AppLink></div> : isDashboards ? <Dashboards dashboards={dashboards} dashboardId={dashboardMatch?.[1]} onDetail={setDetail} kpis={kpis} api={api} /> : <ExploreKpis onDetail={setDetail} kpis={kpis} apiMode={!!api} />}
    {detail && <KpiDetails kpi={detail} onClose={() => setDetail(null)} />}
  </SynapseShell>
}
