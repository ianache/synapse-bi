import { useCallback, useState } from 'react'
import { Icon } from '@bi-analytics/design-system'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { AppLink } from '../../components/SynapseShell'
import { datasetPath, metadataLabels, writable, type DatasetFilters } from '../../domain/datasets'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import { DatasetCatalogSummary, DatasetGovernanceCells } from './DatasetCatalogMetadata'

export function StitchDatasetList({repository}: {repository: DatasetsRepository}) {
  const [filters, setFilters] = useState<DatasetFilters>({limit: 20, offset: 0}), [query, setQuery] = useState('')
  const resource = useDatasetResource(useCallback(signal => repository.list(filters, signal), [repository, filters]), JSON.stringify(filters))
  const identity = useDatasetResource(useCallback(signal => repository.me(signal), [repository]), 'dataset-identity')
  const filter = (next: DatasetFilters) => setFilters(previous => ({...previous, ...next, offset: 0}))
  return <div className="ds-catalog">
    <header className="source-heading ds-heading"><div><p className="source-eyebrow">US-002 · CATÁLOGO TÉCNICO <span>· Entorno local</span></p><h1>Tus datasets, con contexto</h1><p>Registra su procedencia y metadatos antes de definir su significado de negocio.</p></div>{writable(identity.data?.scopes ?? []) && <AppLink to="/datasets/nuevo" className="source-button primary"><Icon name="plus" size={18} />Registrar dataset</AppLink>}</header>
    <div className="ds-governance-note" role="note"><Icon name="lock" size={20} /><p><strong>Aviso normativo de catalogación:</strong> Registrar un dataset no publica KPI ni certifica sus metadatos. Esta vista registra la procedencia técnica y clasificación declarada. No define métricas, grano ni semántica de negocio.</p></div>
    <DatasetCatalogSummary repository={repository} />
    <section className="ds-filter-bar" aria-label="Filtros de datasets"><form onSubmit={event => {event.preventDefault(); filter({q: query})}}><label className="ds-search"><span className="sr-only">Buscar dataset</span><Icon name="search" size={18} /><input type="search" maxLength={200} value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nombre de dataset u objeto físico…" /></label><button className="source-button" type="submit">Buscar</button></form>
      <div className="ds-filter-cluster"><label>Tipo<select aria-label="Tipo" value={filters.kind ?? ''} onChange={event => filter({kind: (event.target.value || undefined) as DatasetFilters['kind']})}><option value="">Todos</option><option value="direct">Directo</option><option value="prepared">Preparado</option></select></label>
        <label>Completitud<select aria-label="Completitud" value={filters.completeness ?? ''} onChange={event => filter({completeness: (event.target.value || undefined) as DatasetFilters['completeness']})}><option value="">Todas</option><option value="complete">Completo</option><option value="incomplete">Incompleto</option></select></label>
        <label>Registro<select aria-label="Registro" value={filters.registrationStatus ?? ''} onChange={event => filter({registrationStatus: (event.target.value || undefined) as DatasetFilters['registrationStatus']})}><option value="">Todos</option><option value="draft">Borrador</option><option value="registered">Registrado</option></select></label><span className="ds-showing"><span className="ds-dot total" />{resource.data ? `Mostrando ${resource.data.items.length} de ${resource.data.total} datasets` : 'Consultando catálogo'}</span></div>
    </section>
    <section className="source-card ds-list-card" aria-label="Catálogo de datasets" aria-busy={resource.loading}>
      {resource.loading ? <p role="status" className="source-pad">Cargando datasets…</p> : resource.error ? <div role="alert" className="dataset-error">{resource.error.message} <button className="source-button" onClick={resource.refresh}>Reintentar</button></div> : resource.data && <>
        {resource.data.items.length ? <div className="source-table-scroll" role="region" aria-label="Datasets, tabla desplazable" tabIndex={0}><table className="source-table ds-table"><caption className="sr-only">Datasets técnicos y metadatos declarados</caption><thead><tr><th scope="col">Dataset y objeto físico</th><th scope="col">Tipo (declarado)</th><th scope="col">Responsable</th><th scope="col">Clasificación declarada</th><th scope="col">Metadatos</th><th scope="col">Acciones</th></tr></thead><tbody>{resource.data.items.map(item => <tr key={item.id}>
          <td><div className="ds-record"><span className={`ds-record-icon ${item.kind}`}><Icon name={item.kind === 'prepared' ? 'layers' : 'grid'} size={20} /></span><div><AppLink className="source-link" to={datasetPath(item.id)}>{item.name}</AppLink><div className="ds-origin"><code>{item.origin.schema}.{item.origin.object}</code><span>{item.origin.sourceName}</span></div></div></div></td>
          <td><span className={`ds-status ds-kind ${item.kind}`}><span className="ds-dot" />{item.kind === 'direct' ? 'Directo' : 'Preparado'}</span></td>
          <DatasetGovernanceCells repository={repository} item={item} />
          <td><span className={`ds-status ${item.completeness === 'complete' ? 'ds-complete' : 'ds-incomplete'}`}>{item.completeness === 'complete' ? 'Completo' : 'Incompleto'}</span><small>Registro: {item.registrationStatus === 'draft' ? 'Borrador' : 'Registrado'}</small><small>{item.completeness === 'complete' ? 'No equivale a aprobado' : item.missingMetadata.map(field => metadataLabels[field] ?? field).join(', ') || 'Validación pendiente'}</small></td>
          <td><AppLink className="ds-view" to={datasetPath(item.id)} aria-label={`Ver ficha de ${item.name}`}>Ver ficha<Icon name="arrow" size={14} /></AppLink></td>
        </tr>)}</tbody></table></div> : <div className="source-empty"><Icon name="database" size={30} /><h2>{Object.entries(filters).some(([key, value]) => !['limit', 'offset'].includes(key) && value) ? 'Sin coincidencias' : 'Aún no hay datasets'}</h2><p>Selecciona una observación existente para registrar su contexto técnico.</p></div>}
        <footer className="dataset-pagination ds-pagination"><span>{resource.data.total} datasets · Solo tu organización <small>Origen físico según observación histórica</small></span><div><button className="source-button" disabled={!filters.offset} onClick={() => setFilters(previous => ({...previous, offset: Math.max(0, (previous.offset ?? 0) - 20)}))}>Anterior</button><span>{Math.floor((filters.offset ?? 0) / 20) + 1}</span><button className="source-button" disabled={(filters.offset ?? 0) + 20 >= resource.data.total || (filters.offset ?? 0) + 20 > 10000} onClick={() => setFilters(previous => ({...previous, offset: (previous.offset ?? 0) + 20}))}>Siguiente</button></div></footer>
      </>}
    </section>
    <div className="ds-architecture-note" role="note"><Icon name="layers" size={20} /><div><h2>Principio de arquitectura: Separación de capas de gobernanza técnica vs. semántica</h2><p>La base de gobierno registrada en esta pantalla es exclusivamente técnica para el linaje de datos. La completitud formal de metadatos no equivale a aprobación empresarial. La definición de significado de negocio pertenece al catálogo semántico.</p></div></div>
    <footer className="ds-page-footer"><span><strong>Synapse BI</strong> — Suite de Analítica de Datos y Gobernanza Empresarial</span><span>Catálogo técnico · Entorno local</span></footer>
  </div>
}
