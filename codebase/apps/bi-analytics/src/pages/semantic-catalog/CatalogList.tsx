import { useCallback, useState } from 'react'
import type { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import type { ResourceKind } from '../../domain/semanticCatalog'
import { catalogPath } from '../../domain/semanticCatalog'
import { AppLink } from '../../components/SynapseShell'
import { useSemanticCatalogResource } from '../../hooks/useSemanticCatalogResource'

export function CatalogList({repository, canWrite}: {repository: SemanticCatalogRepository; canWrite: boolean}) {
  const [kind, setKind] = useState<ResourceKind>('domains'), [q, setQ] = useState(''), [offset, setOffset] = useState(0), [domainId, setDomainId] = useState('')
  const resource = useSemanticCatalogResource(useCallback(signal => repository.list(kind, {q, offset, ...(kind !== 'domains' && domainId ? {domainId} : {})}, signal), [repository, kind, q, offset, domainId]), `${kind}/${q}/${offset}/${domainId}`)
  const domains = useSemanticCatalogResource(useCallback(signal => repository.all('domains', {}, signal), [repository]), 'domains-selector')
  return <section><div className="semantic-title"><h1>Catálogo semántico</h1>{canWrite && <div className="semantic-actions"><AppLink to="/catalogo-semantico/domains/nuevo" className="source-button">Crear dominio</AppLink>
    {kind !== 'domains' && <AppLink to={catalogPath(kind, 'nuevo')} className="source-button primary">Nuevo elemento</AppLink>}</div>}</div>
    <div className="semantic-tabs" role="group" aria-label="Tipo de elemento">{([['domains', 'Dominios'], ['components', 'Dimensiones y medidas'], ['kpi-definitions', 'KPI']] as const).map(([value, label]) =>
      <button key={value} className="source-button" aria-pressed={kind === value} onClick={() => {setKind(value); setOffset(0)}}>{label}</button>)}</div>
    <div className="semantic-filters"><label>Buscar<input aria-label="Buscar" type="search" maxLength={100} value={q} onChange={e => {setQ(e.target.value); setOffset(0)}} /></label>
      {kind !== 'domains' && <label>Dominio<select aria-label="Filtrar dominio" value={domainId} onChange={e => {setDomainId(e.target.value); setOffset(0)}}><option value="">Todos los dominios</option>{domains.data?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}</div>
    {resource.loading ? <p role="status">Cargando catálogo…</p> : resource.error ? <div role="alert">{resource.error.message}<button className="source-button" onClick={resource.refresh}>Reintentar</button></div>
      : resource.data && <><p role="status">{resource.data.total} elementos</p>{!resource.data.items.length ? <p>Todavía no hay elementos.</p> : <div className="semantic-table"><table><caption>Definiciones en borrador</caption><thead><tr><th>Nombre</th><th>Tipo</th><th>Documentación</th><th>Consumidores</th><th>Acción</th></tr></thead><tbody>
        {resource.data.items.map(item => <tr key={item.id}><td>{item.name}</td><td>{'kind' in item ? item.kind === 'dimension' ? 'Dimensión' : 'Medida' : kind === 'domains' ? 'Dominio' : 'KPI'}</td>
          <td>{item.completeness === 'complete' ? 'Completa · no aprobada' : 'Incompleta'}</td><td>{'consumerCount' in item ? item.consumerCount : '—'}</td><td><AppLink to={catalogPath(kind, item.id)}>Ver <span className="sr-only">{item.name}</span></AppLink></td></tr>)}
      </tbody></table></div>}<div className="semantic-actions"><button className="source-button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 25))}>Anterior</button><button className="source-button" disabled={offset + resource.data.items.length >= resource.data.total} onClick={() => setOffset(offset + 25)}>Siguiente</button></div></>}
  </section>
}
