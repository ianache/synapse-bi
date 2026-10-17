import { useCallback } from 'react'
import { Icon } from '@bi-analytics/design-system'
import type { DatasetsRepository } from '../../adapters/datasetsRepository'
import type { DatasetSummary } from '../../domain/datasets'
import { useDatasetResource } from '../../hooks/useDatasetResource'

export function DatasetCatalogSummary({repository}: {repository: DatasetsRepository}) {
  const counts = useDatasetResource(useCallback(async signal => {
    const [total, direct, prepared] = await Promise.all([
      repository.list({limit: 1}, signal), repository.list({kind: 'direct', limit: 1}, signal), repository.list({kind: 'prepared', limit: 1}, signal),
    ])
    return {total: total.total, direct: direct.total, prepared: prepared.total}
  }, [repository]), 'dataset-catalog-summary')
  return <section aria-label="Resumen de datasets" className="ds-summary">
    {[{key: 'total', title: 'Datasets registrados', label: 'Total de datasets', suffix: 'fichas activas', note: 'Incluye borradores y registros técnicos', icon: 'database'},
      {key: 'direct', title: 'Directos', label: 'Datasets directos', suffix: 'origen directo', note: 'Vinculación a tabla/vista de origen', icon: 'arrow'},
      {key: 'prepared', title: 'Preparados', label: 'Datasets preparados', suffix: 'preparación declarada', note: 'Transformación técnica declarada', icon: 'layers'}].map(card =>
      <article key={card.key}><div className="ds-summary-title"><h2>{card.title}</h2><Icon name={card.icon as 'database' | 'arrow' | 'layers'} size={20} /></div><div className="ds-summary-value"><strong aria-label={card.label}>{counts.data?.[card.key as 'total' | 'direct' | 'prepared'] ?? '—'}</strong><span>{card.suffix}</span></div><p><span className={`ds-dot ${card.key}`} />{card.note}</p></article>)}
    {counts.error && <p className="ds-summary-error">Resumen no disponible. <button className="source-button" onClick={counts.refresh}>Reintentar resumen</button></p>}
  </section>
}

export function DatasetGovernanceCells({repository, item}: {repository: DatasetsRepository; item: DatasetSummary}) {
  const metadata = useDatasetResource(useCallback(signal => repository.get(item.id, signal), [repository, item.id, item.version]), `${item.id}/${item.version}`)
  if (metadata.loading) return <><td className="ds-governance-muted">Cargando metadatos…</td><td className="ds-governance-muted">—</td></>
  if (metadata.error || !metadata.data) return <><td><span className="ds-governance-muted">No disponible</span><button className="ds-metadata-retry" onClick={metadata.refresh} aria-label={`Reintentar metadatos de ${item.name}`}>Reintentar</button></td><td className="ds-governance-muted">No disponible</td></>
  return <><td>{metadata.data.governance.owner ? <div className="ds-declared-owner"><Icon name="clock" size={15} /><span>{metadata.data.governance.owner}<small>Pendiente de validación</small></span></div> : <span className="ds-status ds-incomplete">Pendiente</span>}</td>
    <td>{metadata.data.governance.classification ? <span className="ds-status ds-classification"><Icon name="lock" size={12} />{metadata.data.governance.classification} (declarado)</span> : <span className="ds-governance-muted">Sin definir</span>}</td></>
}
