import { useCallback, useState } from 'react'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { AppLink } from '../../components/SynapseShell'
import { datasetPath, metadataLabels, writable, type DatasetFilters } from '../../domain/datasets'
import { useDatasetResource } from '../../hooks/useDatasetResource'

export function DatasetList({ repository }: { repository: DatasetsRepository }) {
  const [filters, setFilters] = useState<DatasetFilters>({ limit: 20, offset: 0 })
  const [query, setQuery] = useState('')
  const resource = useDatasetResource(useCallback(signal => repository.list(filters, signal), [repository, filters]), JSON.stringify(filters))
  const identity = useDatasetResource(useCallback(signal => repository.me(signal), [repository]), 'dataset-identity')
  const filter = (next: DatasetFilters) => setFilters(previous => ({ ...previous, ...next, offset: 0 }))
  return <>
    <header className="source-heading"><div><p className="source-eyebrow">US-002 · Catálogo técnico</p><h1>Tus datasets, con contexto</h1><p>Registra su procedencia y metadatos antes de definir su significado de negocio.</p></div>{writable(identity.data?.scopes ?? []) && <AppLink to="/datasets/nuevo" className="source-button primary">+ Registrar dataset</AppLink>}</header>
    <div className="dataset-note">Registrar no publica KPI ni certifica metadatos. La completitud mide presencia, no aprobación.</div>
    <section className="source-card" aria-label="Catálogo de datasets">
      <div className="dataset-filters"><form onSubmit={e => { e.preventDefault(); filter({ q: query }) }}><label>Buscar dataset<input maxLength={200} value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre u objeto de origen" /></label><button className="source-button">Buscar</button></form>
        <label>Tipo<select value={filters.kind ?? ''} onChange={e => filter({ kind: (e.target.value || undefined) as DatasetFilters['kind'] })}><option value="">Todos</option><option value="direct">Directo</option><option value="prepared">Preparado</option></select></label>
        <label>Completitud<select value={filters.completeness ?? ''} onChange={e => filter({ completeness: (e.target.value || undefined) as DatasetFilters['completeness'] })}><option value="">Todas</option><option value="complete">Completo</option><option value="incomplete">Incompleto</option></select></label>
        <label>Registro<select value={filters.registrationStatus ?? ''} onChange={e => filter({ registrationStatus: (e.target.value || undefined) as DatasetFilters['registrationStatus'] })}><option value="">Todos</option><option value="draft">Borrador</option><option value="registered">Registrado</option></select></label>
      </div>
      {resource.loading ? <p role="status" className="source-pad">Cargando datasets…</p> : resource.error ? <div role="alert" className="dataset-error">{resource.error.message} <button className="source-button" onClick={resource.refresh}>Reintentar</button></div> : resource.data && <>
        {resource.data.items.length ? <div className="source-table-scroll" role="region" aria-label="Datasets, tabla desplazable" tabIndex={0}><table className="source-table"><thead><tr><th>Dataset y origen</th><th>Tipo declarado</th><th>Registro</th><th>Metadatos</th></tr></thead><tbody>{resource.data.items.map(item => <tr key={item.id}>
          <td><AppLink className="source-link" to={datasetPath(item.id)}>{item.name}</AppLink><small>{item.origin.schema}.{item.origin.object} · {item.origin.sourceName}</small></td><td>{item.kind === 'direct' ? 'Directo' : 'Preparado'}</td><td>{item.registrationStatus === 'draft' ? 'Borrador' : 'Registrado'}</td><td><span className={`dataset-badge ${item.completeness === 'complete' ? 'complete' : ''}`}>{item.completeness === 'complete' ? 'Completo' : 'Incompleto'}</span><small>{item.missingMetadata.map(field => metadataLabels[field]).join(', ') || 'Validación pendiente'}</small></td>
        </tr>)}</tbody></table></div> : <div className="source-empty"><h2>{Object.entries(filters).some(([key, value]) => !['limit', 'offset'].includes(key) && value) ? 'Sin coincidencias' : 'Aún no hay datasets'}</h2><p>Selecciona una observación existente para registrar su contexto técnico.</p></div>}
        <footer className="dataset-pagination"><span>{resource.data.total} datasets · Solo tu organización</span><div><button className="source-button" disabled={!filters.offset} onClick={() => setFilters(f => ({ ...f, offset: Math.max(0, (f.offset ?? 0) - 20) }))}>Anterior</button><button className="source-button" disabled={(filters.offset ?? 0) + 20 >= resource.data.total || (filters.offset ?? 0) + 20 > 10000} onClick={() => setFilters(f => ({ ...f, offset: (f.offset ?? 0) + 20 }))}>Siguiente</button></div></footer>
      </>}
    </section><div className="dataset-note">Separación de capas: conexión técnica ≠ dataset registrado ≠ semántica de negocio.</div>
  </>
}
