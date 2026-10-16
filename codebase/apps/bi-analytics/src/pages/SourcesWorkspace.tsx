import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '@bi-analytics/design-system'
import { AppLink, navigate, SynapseShell } from '../components/SynapseShell'
import { SourcesRepository, type Source, type ConnectionFields, type Probe, type Observation, type SchemaObject } from '../adapters/sourcesRepository'
import './kpi-workspace.css'
import './sources.css'
import './sources-accessibility.css'
import { DatasetsRepository } from '../adapters/datasetsRepository'
import { writable } from '../domain/datasets'

const repository = new SourcesRepository()
const datasetsRepository = new DatasetsRepository()
const date = (value: string | null) => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin registrar'
const message = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación.'
const sourcePath = (id: string) => `/fuentes/${encodeURIComponent(id)}`

function useResource<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const [data, setData] = useState<T>()
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError(''); setData(undefined)
    load(controller.signal).then(value => { if (!controller.signal.aborted) setData(value) }).catch(error => { if (!controller.signal.aborted) setError(message(error)) })
    return () => controller.abort()
    // Loading is intentionally keyed by resource identity and explicit refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, revision])
  return { data, error, refresh: () => setRevision(value => value + 1) }
}

function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`source-notice ${error ? 'source-notice-error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>
}
function Status({ status }: { status: string }) {
  return <span className={`source-status ${status === 'connected' || status === 'success' ? 'is-good' : 'is-warning'}`}><span aria-hidden="true">●</span> {status === 'connected' ? 'Conectada' : status === 'success' ? 'Completada' : status === 'failed' ? 'Fallida' : 'Requiere atención'}</span>
}
function Heading({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return <header className="source-heading"><div><p className="source-eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <p>{children}</p>}</div><div className="source-actions">{actions}</div></header>
}
function Waiting({ error, retry }: { error: string; retry: () => void }) {
  return error ? <Notice error>{error} <button className="source-link" onClick={retry}>Reintentar</button></Notice> : <p role="status" className="source-loading">Cargando fuentes y metadatos…</p>
}

export function SourcesWorkspace({ path }: { path: string }) {
  const parts = path.split('/').filter(Boolean)
  let content: ReactNode
  if (parts.length === 1) content = <SourceList />
  else if (parts[1] === 'nueva' && parts.length === 2) content = <SourceForm />
  else if (parts.length === 2) content = <SourceDetail id={parts[1]} />
  else if (parts[2] === 'editar' && parts.length === 3) content = <EditSource id={parts[1]} />
  else if (parts[2] === 'esquema' && parts.length === 4) content = <SchemaExplorer id={parts[1]} observationId={parts[3]} />
  else content = <Notice error>Pantalla no disponible. <AppLink to="/fuentes">Volver a fuentes</AppLink></Notice>
  return <SynapseShell active="sources" breadcrumb="Fuentes de datos"><div className="sources-workspace">{content}</div></SynapseShell>
}

function SourceList() {
  const resource = useResource(signal => repository.list(signal), 'sources')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const sources = resource.data?.items ?? []
  const visible = sources.filter(source => `${source.name} ${source.database}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (status === 'all' || source.status === status))
  return <>
    <Heading eyebrow="Administración de datos" title="Conecta y observa tus fuentes" actions={<AppLink to="/fuentes/nueva" className="source-button primary"><Icon name="plus" size={18} />Registrar fuente</AppLink>}>Administra conexiones seguras y descubre su estructura técnica, en un solo lugar.</Heading>
    {!resource.data ? <Waiting error={resource.error} retry={resource.refresh} /> : <>
      <div className="source-stats">{[['Fuentes registradas', sources.length, 'database'], ['Conectadas', sources.filter(s => s.status === 'connected').length, 'check'], ['Requieren atención', sources.filter(s => s.status === 'attention').length, 'clock']].map(([label, value, icon]) => <div className="source-stat" key={label}><span>{label}</span><strong>{value}</strong><Icon name={icon as 'database' | 'check' | 'clock'} size={22} /></div>)}</div>
      <section className="source-card source-registry" aria-label="Fuentes registradas">
        <div className="source-toolbar"><label className="source-search"><Icon name="search" size={18} /><input aria-label="Buscar fuente" placeholder="Buscar por nombre o base de datos…" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="source-filter">Estado<select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos los estados</option><option value="connected">Conectadas</option><option value="attention">Requieren atención</option></select></label><span className="source-chip">PostgreSQL</span></div>
        {visible.length ? <div className="source-table-scroll"><table className="source-table"><thead><tr><th>Fuente</th><th>Base de datos</th><th>Estado de conexión</th><th>Última prueba</th><th><span className="source-sr-only">Acciones</span></th></tr></thead><tbody>{visible.map(source => <tr key={source.id}><td><div className="source-name"><span className="source-db-icon"><Icon name="database" size={23} /></span><span><AppLink to={sourcePath(source.id)}>{source.name}</AppLink><small>PostgreSQL · {source.laboratory ? 'Laboratorio' : 'Conexión administrada'}</small></span></div></td><td><code>{source.database}</code><small>{source.host}:{source.port}</small></td><td><Status status={source.status} /></td><td>{date(source.testedAt)}</td><td><AppLink to={sourcePath(source.id)} className="source-link">Ver detalle →</AppLink></td></tr>)}</tbody></table></div> : <div className="source-empty"><Icon name="database" size={36} /><h2>{sources.length ? 'Sin coincidencias' : 'Tu primera fuente, bien conectada'}</h2><p>{sources.length ? 'Prueba otro nombre o cambia el filtro de estado.' : 'Registra una conexión PostgreSQL de solo lectura para comenzar a observar su esquema.'}</p>{!sources.length && <AppLink className="source-button primary" to="/fuentes/nueva">Registrar fuente PostgreSQL</AppLink>}</div>}
        <footer className="source-card-footer">{visible.length} de {sources.length} fuentes · Solo se muestran conexiones de tu organización.</footer>
      </section>
      <Notice><strong>El primer paso es técnico.</strong> Conectar una fuente no publica datasets ni certifica indicadores. Las definiciones de negocio se incorporan después.</Notice>
    </>}
  </>
}

function EditSource({ id }: { id: string }) {
  const resource = useResource(signal => repository.get(id, signal), id)
  return resource.data ? <SourceForm source={resource.data} /> : <Waiting error={resource.error} retry={resource.refresh} />
}

function SourceForm({ source }: { source?: Source }) {
  const [name, setName] = useState(source?.name ?? '')
  const [description, setDescription] = useState(source?.description ?? '')
  const [connection, setConnection] = useState<ConnectionFields>(source ? { host: source.host, port: source.port, database: source.database, username: source.username, tlsMode: source.tlsMode, laboratory: source.laboratory, schemas: source.schemas } : { host: '127.0.0.1', port: 55432, database: 'bi_analytics', username: 'bi_reader_global', tlsMode: 'disable', laboratory: true, schemas: ['gold'] })
  const [password, setPassword] = useState('')
  const [probe, setProbe] = useState<Probe>()
  const [pending, setPending] = useState<'test' | 'save'>()
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [schemaText, setSchemaText] = useState(connection.schemas.join(', '))
  useEffect(() => {
    if (!probe) return
    const timeout = window.setTimeout(() => { setExpired(true); setProbe(undefined) }, Math.max(0, new Date(probe.validUntil).getTime() - Date.now()))
    return () => clearTimeout(timeout)
  }, [probe])
  function change<K extends keyof ConnectionFields>(key: K, value: ConnectionFields[K]) {
    setConnection(previous => ({ ...previous, [key]: value })); setProbe(undefined); setExpired(false); setError('')
  }
  async function test() {
    setPending('test'); setError(''); setProbe(undefined); setExpired(false)
    try { setProbe(await repository.test({ ...connection, password })) } catch (error) { setError(message(error)) } finally { setPending(undefined) }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!probe || new Date(probe.validUntil).getTime() <= Date.now() || pending) { setError('Prueba la conexión antes de registrar la fuente.'); return }
    setPending('save'); setError('')
    try {
      const saved = await repository.save({ ...connection, name, description, password, testId: probe.testId }, source)
      setPassword(''); navigate(sourcePath(saved.id))
    } catch (error) { setError(message(error)); setPending(undefined) }
  }
  return <>
    <AppLink className="source-back" to={source ? sourcePath(source.id) : '/fuentes'}>← Volver a {source ? 'la fuente' : 'fuentes de datos'}</AppLink>
    <Heading eyebrow="Conexión PostgreSQL" title={source ? 'Actualizar conexión y credencial' : 'Registrar fuente PostgreSQL'}>Una conexión de solo lectura. Un punto de partida confiable.</Heading>
    <ol className="source-steps" aria-label="Progreso del registro"><li className="current"><span>1</span> Configurar conexión</li><li className={probe ? 'current' : ''}><span>2</span> Validar acceso</li><li><span>3</span> Registrar fuente</li></ol>
    <form onSubmit={save} className="source-form-layout">
      <div><section className="source-card source-form-card"><h2>Información de la fuente</h2><p>Un nombre claro facilita encontrarla en tu organización.</p><fieldset disabled={!!pending}>
        <label>Nombre de la fuente<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Retail Gold · Laboratorio" /></label>
        <label>Descripción <span className="source-muted">(opcional)</span><textarea maxLength={1000} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Origen y propósito de esta conexión" /></label>
      </fieldset></section>
      <section className="source-card source-form-card"><h2>Parámetros de conexión</h2><p><span className="source-chip">PostgreSQL</span> Conector de metadatos · Acceso de solo lectura</p><fieldset disabled={!!pending}>
        <div className="source-fields"><label>Host<input required maxLength={253} value={connection.host} onChange={e => change('host', e.target.value)} autoComplete="off" /></label><label>Puerto<input required type="number" min={1} max={65535} value={connection.port || ''} onChange={e => change('port', Number(e.target.value))} /></label></div>
        <div className="source-fields"><label>Base de datos<input required maxLength={63} value={connection.database} onChange={e => change('database', e.target.value)} /></label><label>Esquemas a observar<input required value={schemaText} onChange={e => { setSchemaText(e.target.value); change('schemas', e.target.value.split(',').map(v => v.trim()).filter(Boolean)) }} /><small>Separados por coma. Sin esquemas del sistema.</small></label></div>
        <div className="source-fields"><label>Usuario de solo lectura<input required maxLength={63} value={connection.username} onChange={e => change('username', e.target.value)} autoComplete="off" /></label><label>{source ? 'Nueva contraseña' : 'Contraseña'}<input aria-label={source ? 'Nueva contraseña' : 'Contraseña'} aria-describedby="source-password-hint" required type="password" maxLength={512} value={password} onChange={e => { setPassword(e.target.value); setProbe(undefined); setError('') }} autoComplete="new-password" /><small id="source-password-hint">{source ? 'La credencial anterior nunca se muestra.' : 'Se cifra al registrar. No se devuelve en la API.'}</small></label></div>
        <label>Seguridad de transporte<select value={connection.tlsMode} onChange={e => change('tlsMode', e.target.value as ConnectionFields['tlsMode'])}><option value="verify-full">TLS · Verificar certificado y host</option><option value="disable">Sin TLS · Solo laboratorio local</option></select></label>
        <label className="source-checkbox"><input type="checkbox" checked={connection.laboratory} onChange={e => change('laboratory', e.target.checked)} />Esta conexión corresponde a un laboratorio</label>
      </fieldset>
      {connection.tlsMode === 'disable' && <Notice>Sin TLS únicamente en desarrollo, con un destino loopback autorizado. No utilizar con datos productivos.</Notice>}
      <div className="source-validation"><button type="button" className="source-button" disabled={!!pending || !password || !connection.schemas.length} onClick={test}><Icon name="check" size={18} />{pending === 'test' ? 'Probando conexión…' : 'Probar conexión'}</button>{probe && <span className="source-success" role="status">Conexión validada · {probe.schemas.join(', ')} · válida 10 minutos</span>}</div>
      {expired && <Notice>La prueba venció. Valida nuevamente antes de registrar.</Notice>}
      {error && <Notice error>{error}</Notice>}
      </section>
      <footer className="source-form-footer"><span><Icon name="lock" size={16} />Credencial cifrada · Lectura de metadatos</span><div className="source-actions"><AppLink to={source ? sourcePath(source.id) : '/fuentes'} className="source-button">Cancelar</AppLink><button className="source-button primary" disabled={!probe || !!pending || !name.trim()} type="submit">{pending === 'save' ? 'Guardando…' : source ? 'Guardar cambios' : 'Registrar fuente'}</button></div></footer></div>
      <aside className="source-help"><div className="source-card"><span className="source-db-icon"><Icon name="database" size={28} /></span><h2>Conecta con confianza</h2><p>La cuenta necesita USAGE en los esquemas y SELECT en sus tablas y vistas. No debe tener permisos de escritura ni privilegios elevados.</p><hr /><h3>¿Qué se observa?</h3><ul><li>Tablas y vistas accesibles</li><li>Columnas y tipos de datos</li><li>Claves y relaciones declaradas</li><li>Comentarios técnicos</li></ul><p>No se leen registros ni se ejecuta SQL del usuario.</p></div><Notice>El operador debe autorizar el host y puerto en el backend. El laboratorio incluido utiliza <code>127.0.0.1:55432</code> y el esquema <code>gold</code>.</Notice></aside>
    </form>
  </>
}

function SourceDetail({ id }: { id: string }) {
  const resource = useResource(async signal => ({ source: await repository.get(id, signal), history: (await repository.history(id, signal)).items }), id)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function run(observe: boolean) {
    setPending(observe ? 'observe' : 'test'); setError(''); setSuccess('')
    try {
      if (observe) {
        const result = await repository.observe(id)
        navigate(`${sourcePath(id)}/esquema/${result.id}`)
      } else { await repository.retest(id); setSuccess('Conexión comprobada correctamente.'); resource.refresh() }
    } catch (error) { setError(message(error)); resource.refresh() } finally { setPending('') }
  }
  if (!resource.data) return <Waiting error={resource.error} retry={resource.refresh} />
  const { source, history } = resource.data
  const latest = history.find(o => o.status === 'success')
  return <>
    <AppLink to="/fuentes" className="source-back">← Todas las fuentes</AppLink>
    <Heading eyebrow={`PostgreSQL · ${source.laboratory ? 'Laboratorio' : 'Fuente administrada'}`} title={source.name} actions={<><button className="source-button" disabled={!!pending} onClick={() => run(false)}>{pending === 'test' ? 'Probando…' : 'Probar conexión'}</button><button className="source-button primary" disabled={!!pending} onClick={() => run(true)}><Icon name="eye" size={18} />{pending === 'observe' ? 'Observando esquema…' : 'Observar esquema'}</button></>}>{source.description || 'Conexión de lectura y observación técnica de esquema.'}</Heading>
    <div className="source-subhead"><Status status={source.status} /><span>Última prueba: {date(source.testedAt)}</span><span>Configuración v{source.version}</span></div>
    {error && <Notice error>{error}</Notice>}{success && <Notice>{success}</Notice>}
    <div className="source-detail-grid"><section className="source-card source-pad"><div className="source-section-title"><h2>Conexión</h2><AppLink className="source-link" to={`${sourcePath(id)}/editar`}>Editar conexión</AppLink></div><dl className="source-properties">{[['Conector', 'PostgreSQL'], ['Host y puerto', `${source.host}:${source.port}`], ['Base de datos', source.database], ['Usuario', source.username], ['Esquemas', source.schemas.join(', ')], ['Transporte', source.tlsMode === 'disable' ? 'Sin TLS · Laboratorio local' : 'TLS verificado'], ['Credencial', 'Configurada · no visible']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><AppLink className="source-link" to={`${sourcePath(id)}/editar`}><Icon name="key" size={16} /> Actualizar credencial</AppLink></section>
    <section className="source-card source-pad source-observation-card"><p className="source-eyebrow">Última observación completada</p>{latest ? <><h2>OBS-{String(latest.sequence).padStart(3, '0')}</h2><p>{date(latest.createdAt)}</p><div className="source-observation-counts"><div><strong>{latest.tables}</strong><span>Tablas</span></div><div><strong>{latest.views}</strong><span>Vistas</span></div></div>{latest.sourceVersion !== source.version && <Notice>Esta observación corresponde a una configuración anterior.</Notice>}<AppLink className="source-button" to={`${sourcePath(id)}/esquema/${latest.id}`}>Explorar esquema <Icon name="arrow" size={16} /></AppLink></> : <div className="source-empty compact"><Icon name="layers" size={32} /><h2>Aún no hay observaciones</h2><p>Observa el esquema para registrar su estructura técnica.</p></div>}<small>Una observación no es una versión del modelo semántico.</small></section></div>
    <section className="source-card"><div className="source-pad source-section-title"><div><h2>Historial de observaciones</h2><p>Instantáneas independientes. Las anteriores no se sobrescriben.</p></div><span className="source-chip">Últimas 100</span></div>{history.length ? <div className="source-table-scroll"><table className="source-table"><thead><tr><th>Observación</th><th>Fecha</th><th>Estado</th><th>Objetos</th><th>Acción</th></tr></thead><tbody>{history.map(item => <tr key={item.id}><td>OBS-{String(item.sequence).padStart(3, '0')}</td><td>{date(item.createdAt)}</td><td><Status status={item.status} /></td><td>{item.status === 'success' ? `${item.tables} tablas · ${item.views} vistas` : 'No se obtuvo una instantánea'}</td><td>{item.status === 'success' ? <AppLink className="source-link" to={`${sourcePath(id)}/esquema/${item.id}`}>Explorar</AppLink> : <span className="source-muted">Revisa la conexión y reintenta</span>}</td></tr>)}</tbody></table></div> : <p className="source-pad source-muted">Todavía no se ha observado esta fuente.</p>}</section>
    <Notice><strong>Conexión no significa certificación.</strong> Los datos del laboratorio Gold son sintéticos. La observación es real y solo describe estructura técnica; no define granularidad, KPI ni reglas de negocio.</Notice>
  </>
}

function SchemaExplorer({ id, observationId }: { id: string; observationId: string }) {
  const identity = useResource(signal => datasetsRepository.me(signal), 'dataset-identity')
  const resource = useResource(async signal => ({ source: await repository.get(id, signal), observation: await repository.observation(id, observationId, signal) }), `${id}/${observationId}`)
  const [selected, setSelected] = useState('gold.fact_sales')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'columns' | 'relations' | 'comment'>('columns')
  if (!resource.data) return <Waiting error={resource.error} retry={resource.refresh} />
  const { source, observation } = resource.data
  const objects = observation.snapshot?.objects ?? []
  const current = objects.find(o => `${o.schema}.${o.name}` === selected) ?? objects[0]
  const foreignKeys = current?.constraints.filter(c => c.kind === 'f') ?? []
  const visible = objects.filter(o => `${o.schema}.${o.name}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  return <>
    <AppLink to={sourcePath(id)} className="source-back">← {source.name}</AppLink>
    <Heading eyebrow="Explorador de metadatos" title={`Explorar esquema · ${(observation.snapshot?.schemas ?? source.schemas).join(', ')}`} actions={<AppLink className="source-button" to={sourcePath(id)}>Volver a la fuente</AppLink>}>OBS-{String(observation.sequence).padStart(3, '0')} · {date(observation.createdAt)} · {objects.filter(o => o.kind === 'table').length} tablas y {objects.filter(o => o.kind === 'view').length} vistas</Heading>
    {observation.sourceVersion !== source.version && <Notice>Instantánea histórica: la configuración de conexión cambió después de esta observación.</Notice>}
    {observation.status === 'failed' ? <Notice error>Esta observación no pudo completarse. Vuelve a la fuente para reintentar.</Notice> : !objects.length ? <div className="source-card source-empty"><h2>No hay objetos accesibles</h2><p>El esquema está vacío o la cuenta no dispone de SELECT sobre sus objetos.</p></div> : <div className="source-explorer">
      <aside className="source-card source-object-tree" aria-label="Objetos del esquema"><h2>Esquemas observados</h2><label className="source-search"><Icon name="search" size={16} /><input aria-label="Buscar tabla o vista" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tabla o vista…" /></label>{[...new Set(objects.map(o => o.schema))].map(schema => <div key={schema}><h3><Icon name="layers" size={16} /> {schema} <span>{objects.filter(o => o.schema === schema).length}</span></h3>{(['table', 'view'] as const).map(kind => <div key={kind}><p className="source-tree-label">{kind === 'table' ? 'Tablas' : 'Vistas'} ({objects.filter(o => o.schema === schema && o.kind === kind).length})</p>{visible.filter(o => o.schema === schema && o.kind === kind).map(object => <button key={object.name} className={object === current ? 'selected' : ''} aria-pressed={object === current} onClick={() => { setSelected(`${schema}.${object.name}`); setTab('columns') }}><Icon name={kind === 'table' ? 'grid' : 'eye'} size={15} />{object.name}</button>)}</div>)}</div>)}{!visible.length && <p>No se encontraron objetos.</p>}</aside>
      <section className="source-card source-object-detail"><header className="source-pad"><p className="source-eyebrow">{current.schema} / {current.kind === 'table' ? 'Tabla' : 'Vista'}</p><h2>{current.name}</h2><p>{current.columns.length} columnas · {foreignKeys.length} relaciones declaradas</p></header><div className="source-tabs" role="tablist" aria-label="Detalle técnico">{([['columns', 'Columnas'], ['relations', `Claves y relaciones (${foreignKeys.length})`], ['comment', 'Comentario técnico']] as const).map(([value, label]) => <button key={value} id={`source-tab-${value}`} role="tab" aria-selected={tab === value} aria-controls="source-tabpanel" onClick={() => setTab(value)}>{label}</button>)}</div><div role="tabpanel" id="source-tabpanel" aria-labelledby={`source-tab-${tab}`}>
        {tab === 'columns' && <Columns object={current} />}
        {tab === 'relations' && <div className="source-pad">{current.constraints.length ? current.constraints.map(constraint => <article className="source-constraint" key={constraint.name}><span className="source-chip">{({ p: 'PK', u: 'UQ', f: 'FK', c: 'CHECK' })[constraint.kind]}</span><h3>{constraint.name}</h3><code>({constraint.columns.join(', ')})</code>{constraint.kind === 'f' && <p>→ {constraint.referencedSchema}.{constraint.referencedTable} ({constraint.referencedColumns.join(', ')})</p>}</article>) : <p>Sin restricciones declaradas accesibles.</p>}</div>}
        {tab === 'comment' && <div className="source-pad"><h3>Comentario declarado en PostgreSQL</h3><p className="source-technical-comment">{current.comment || 'Este objeto no tiene un comentario técnico declarado.'}</p><Notice>Un comentario técnico no constituye una definición de negocio validada.</Notice></div>}
      </div></section>
      <aside className="source-help source-explorer-help"><section className="source-card source-pad"><h2>Relaciones declaradas</h2><p>Claves foráneas de <code>{current.name}</code></p>{foreignKeys.length ? foreignKeys.map(key => <div className="source-fk" key={key.name}><strong>{key.referencedSchema}.{key.referencedTable}</strong><small>{key.columns.join(', ')} → {key.referencedColumns.join(', ')}</small></div>) : <p>Sin claves foráneas declaradas.</p>}</section><section className="source-card source-pad"><span className="source-chip">Sin definir</span><h2>Semántica de negocio</h2><p>La granularidad, dimensiones e indicadores necesitan una definición explícita.</p>{observation.status === 'success' && writable(identity.data?.scopes ?? []) ? <AppLink className="source-button" to={`/datasets/nuevo?${new URLSearchParams({ sourceId: id, observationId, schema: current.schema, object: current.name })}`}>Registrar dataset</AppLink> : <button className="source-button" disabled>Registrar dataset</button>}<small>US-002 · Registrar no define ni publica semántica</small></section></aside>
    </div>}
    <p className="source-footnote"><Icon name="lock" size={15} />Solo metadatos observados. Sin vista previa de filas, inferencias de negocio ni publicación automática.</p>
  </>
}

function Columns({ object }: { object: SchemaObject }) {
  return <div className="source-table-scroll" role="region" aria-label={`Tabla de columnas de ${object.name}, desplazable`} tabIndex={0}><table className="source-table source-columns"><caption className="source-sr-only">Columnas de {object.name}</caption><thead><tr><th>Columna</th><th>Tipo</th><th>Claves</th><th>Nulos</th><th>Generada</th></tr></thead><tbody>{object.columns.map(column => {
    const keys = [...new Set(object.constraints.filter(c => c.columns.includes(column.name) && c.kind !== 'c').map(c => c.kind))]
    return <tr key={column.name}><td><code>{column.name}</code>{column.comment && <small>{column.comment}</small>}</td><td><code>{column.type}</code></td><td><span className="source-key-tags">{keys.length ? keys.map(key => <span className={`source-key ${key}`} key={key}>{({ p: 'PK', u: 'UQ', f: 'FK', c: '' })[key]}</span>) : '—'}</span></td><td>{column.nullable ? 'Sí' : 'No'}</td><td>{column.generated ? 'Sí' : '—'}</td></tr>
  })}</tbody></table></div>
}
