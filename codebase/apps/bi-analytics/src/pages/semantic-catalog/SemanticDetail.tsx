import { useCallback, useState } from 'react'
import type { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import type { ResourceKind } from '../../domain/semanticCatalog'
import { catalogPath, semanticLabels } from '../../domain/semanticCatalog'
import { AppLink, navigate } from '../../components/SynapseShell'
import { useSemanticCatalogResource } from '../../hooks/useSemanticCatalogResource'
import { CopyComponentDialog } from './CopyComponentDialog'

function Consumers({repository, id}: {repository: SemanticCatalogRepository; id: string}) {
  const [offset, setOffset] = useState(0)
  const resource = useSemanticCatalogResource(useCallback(signal => repository.consumers(id, offset, signal), [repository, id, offset]), `${id}/${offset}`)
  return <section><h2>KPI consumidores</h2>{resource.loading ? <p role="status">Cargando consumidores…</p> : resource.error ? <div role="alert">{resource.error.message}</div> : <>
    <ul>{resource.data?.items.map(item => <li key={item.id}><AppLink to={catalogPath('kpi-definitions', item.id)}>{item.name}</AppLink></li>)}</ul>
    {!resource.data?.total && <p>Sin consumidores actuales. La protección previa no se revoca.</p>}
    <button className="source-button" disabled={!offset} onClick={() => setOffset(offset - 25)}>Consumidores anteriores</button>
    <button className="source-button" disabled={!resource.data || offset + resource.data.items.length >= resource.data.total} onClick={() => setOffset(offset + 25)}>Más consumidores</button>
  </>}</section>
}
export function SemanticDetail({repository, kind, id, canWrite}: {repository: SemanticCatalogRepository; kind: ResourceKind; id: string; canWrite: boolean}) {
  const resource = useSemanticCatalogResource(useCallback(signal => repository.get(kind, id, signal), [repository, kind, id]), `${kind}/${id}`)
  const [copy, setCopy] = useState(false), [consumers, setConsumers] = useState(false)
  if (resource.loading) return <p role="status">Cargando definición…</p>
  if (resource.error || !resource.data) return <div role="alert">{resource.error?.message}<button className="source-button" onClick={resource.refresh}>Reintentar</button></div>
  const item = resource.data, component = 'kind' in item ? item : undefined
  return <section className="semantic-detail"><AppLink to="/catalogo-semantico">Volver al catálogo</AppLink><h1>{item.name}</h1><p>Borrador · Gobierno pendiente · Versión técnica {item.version}</p>
    <p>{item.completeness === 'complete' ? 'Documentación completa; no implica aprobación.' : 'Documentación incompleta'}</p>
    {!!item.missingMetadata.length && <section><h2>Pendientes de documentación</h2><ul>{item.missingMetadata.map(path => <li key={path}>{path.startsWith('components.') ? `Componente ${path.split('.')[1]}: ` : ''}{semanticLabels[path.split('.').at(-1)!] ?? path}</li>)}</ul></section>}
    {component?.protected && <p role="status">Protegida desde su primer uso. La definición original no admite cambios.</p>}
    {!!item.warnings.length && <p role="status">Vinculación desactualizada o no disponible. No se reasocia automáticamente.</p>}
    <dl>{Object.entries(item).filter(([key, value]) => key in semanticLabels && typeof value === 'string').map(([key, value]) => <div key={key}><dt>{semanticLabels[key]}</dt><dd>{String(value)}</dd></div>)}</dl>
    {component?.bindingSnapshot && <section><h2>Vínculo histórico</h2><p>{component.bindingSnapshot.schema}.{component.bindingSnapshot.object} · {component.bindingSnapshot.column}</p><p>Dataset versión {component.bindingSnapshot.datasetVersion}</p></section>}
    {component?.copyOriginId && <p>Origen de copia: <AppLink to={catalogPath('components', component.copyOriginId)}>Ver componente original</AppLink></p>}
    {'measureIds' in item && <section><h2>Componentes referenciados</h2><ul>{[...(item.dimensionIds ?? []), ...(item.measureIds ?? [])].map(ref => <li key={ref}><AppLink to={catalogPath('components', ref)}>Ver componente {ref}</AppLink></li>)}</ul></section>}
    <div className="semantic-actions">{canWrite && !component?.protected && <AppLink className="source-button" to={`${catalogPath(kind, id)}/editar`}>Editar</AppLink>}
      {component && <><button className="source-button" onClick={() => setConsumers(value => !value)}>Ver consumidores ({component.consumerCount})</button>{canWrite && <button className="source-button primary" onClick={() => setCopy(true)}>Crear copia</button>}</>}</div>
    {consumers && <Consumers repository={repository} id={id} />}
    {copy && component && <CopyComponentDialog repository={repository} component={component} onClose={() => setCopy(false)} onSaved={saved => {setCopy(false); navigate(catalogPath('components', saved.id))}} />}
  </section>
}
