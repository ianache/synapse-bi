import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { AppLink } from '../../components/SynapseShell'
import { datasetPath, metadataLabels, writable } from '../../domain/datasets'
import { useDatasetResource } from '../../hooks/useDatasetResource'

const tabs = ['Columnas seleccionadas', 'Linaje declarado', 'Restricciones del origen'] as const
export function DatasetDetail({ id, repository }: { id: string; repository: DatasetsRepository }) {
  const resource = useDatasetResource(useCallback(signal => repository.get(id, signal), [id, repository]), id)
  const identity = useDatasetResource(useCallback(signal => repository.me(signal), [repository]), 'dataset-identity')
  const [tab, setTab] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  function keydown(event: KeyboardEvent, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : undefined
    if (next !== undefined) { event.preventDefault(); setTab(next); tabRefs.current[next]?.focus() }
  }
  if (resource.loading) return <p role="status">Cargando dataset…</p>
  if (resource.error || !resource.data) return <div role="alert" className="dataset-error">{resource.error?.message}<button className="source-button" onClick={resource.refresh}>Reintentar</button></div>
  const dataset = resource.data
  return <>
    <AppLink className="source-back" to="/datasets">← Volver al catálogo</AppLink>
    <header className="source-heading"><div><p className="source-eyebrow">Ficha de dataset · {dataset.kind === 'direct' ? 'Directo' : 'Preparado'}</p><h1>{dataset.name}</h1><p>{dataset.description || 'Contexto técnico registrado'}</p><span className="dataset-badge">{dataset.registrationStatus === 'draft' ? 'Borrador' : 'Registrado'} · {dataset.completeness === 'complete' ? 'Metadatos completos' : 'Metadatos incompletos'}</span></div>{writable(identity.data?.scopes ?? []) && <AppLink className="source-button primary" to={`${datasetPath(id)}/editar`}>Editar metadatos</AppLink>}</header>
    <div className="dataset-note">Validación de gobierno pendiente</div>
    {dataset.origin.sourceVersion !== dataset.origin.currentSourceVersion && <div className="dataset-warning">Instantánea histórica: observada con configuración v{dataset.origin.sourceVersion}; fuente actual v{dataset.origin.currentSourceVersion}. No se ha sustituido la observación.</div>}
    <div className="dataset-detail-grid"><div><section className="source-card source-pad"><h2>Resumen de procedencia técnica</h2><dl className="dataset-properties">
      <dt>Fuente</dt><dd>{dataset.origin.sourceName}</dd><dt>Objeto de origen</dt><dd>{dataset.origin.schema}.{dataset.origin.object} · {dataset.origin.kind}</dd><dt>Observación</dt><dd>{dataset.origin.observationId}</dd><dt>Fecha de observación (no última carga)</dt><dd>{new Date(dataset.origin.observedAt).toLocaleString('es-PE')}</dd><dt>Versión del registro</dt><dd>{dataset.version}</dd><dt>Creado por (identidad técnica)</dt><dd>{dataset.createdBy}</dd></dl></section>
      <section className="source-card dataset-tabs-card"><div role="tablist" aria-label="Detalle del dataset" className="dataset-tabs">{tabs.map((label, index) => <button key={label} role="tab" id={`dataset-tab-${index}`} aria-controls="dataset-panel" aria-selected={tab === index} tabIndex={tab === index ? 0 : -1} ref={el => { tabRefs.current[index] = el }} onKeyDown={event => keydown(event, index)} onClick={() => setTab(index)}>{label}</button>)}</div>
        <div role="tabpanel" id="dataset-panel" aria-labelledby={`dataset-tab-${tab}`} tabIndex={0} className="source-pad">
          {tab === 0 && <div className="source-table-scroll" role="region" aria-label="Columnas del dataset, tabla desplazable" tabIndex={0}><table className="source-table"><thead><tr><th>Columna</th><th>Tipo</th><th>Nulos</th><th>Generada</th><th>Comentario</th></tr></thead><tbody>{dataset.selectedColumns.map(c => <tr key={c.name}><td>{c.name}</td><td>{c.type}</td><td>{c.nullable ? 'Sí' : 'No'}</td><td>{c.generated ? 'Sí' : 'No'}</td><td>{c.comment || '—'}</td></tr>)}</tbody></table></div>}
          {tab === 1 && <><h3>Linaje de procedencia técnica</h3><ol className="dataset-lineage"><li>Fuente: {dataset.origin.sourceName}</li><li>Observación: {dataset.origin.observationId}</li><li>Objeto: {dataset.origin.schema}.{dataset.origin.object}</li><li>Dataset: {dataset.name}</li></ol>{dataset.preparation && <><h3>Preparación declarada (no ejecutada)</h3><p>{dataset.preparation.processReference || 'Proceso pendiente'}</p><ul>{dataset.preparation.inputOrigins.map(o => <li key={JSON.stringify(o)}>{o.schema}.{o.object} · {o.observationId}</li>)}</ul></>}</>}
          {tab === 2 && <><p>No demuestra unicidad ni granularidad del dataset: estas restricciones pertenecen al objeto de origen, incluso si se seleccionó solo parte de una clave compuesta.</p>{dataset.sourceConstraints.map(c => <article key={c.name} className="dataset-constraint"><strong>{c.kind.toUpperCase()} · {c.name}</strong><p>({c.columns.join(', ')})</p>{c.kind === 'f' && <p>→ {c.referencedSchema}.{c.referencedTable} ({c.referencedColumns.join(', ')})</p>}</article>)}{!dataset.sourceConstraints.length && <p>Sin restricciones observadas.</p>}</>}
        </div></section></div>
      <aside><section className="source-card source-pad"><h2>Gobernanza declarada</h2><dl className="dataset-properties">{Object.entries(dataset.governance).map(([field, value]) => <div key={field}><dt>{metadataLabels[field]}</dt><dd>{value || 'Sin declarar'}</dd></div>)}</dl><p>Frescura: sin evaluar</p><p>Calidad: sin evaluar</p>{dataset.missingMetadata.length > 0 && <><h3>Pendientes de completitud</h3><ul>{dataset.missingMetadata.map(field => <li key={field}>{metadataLabels[field]}</li>)}</ul></>}{dataset.medallion && <><h3>Medallion declarado</h3><dl className="dataset-properties">{Object.entries(dataset.medallion).map(([field, value]) => <div key={field}><dt>{metadataLabels[`medallion.${field}`]}</dt><dd>{value || 'Sin declarar'}</dd></div>)}</dl></>}</section><div className="dataset-warning">Semántica de negocio sin definir: registrar no crea KPI ni publica modelos.</div><button className="source-button" disabled>Definir elementos semánticos · US-003</button></aside>
    </div>
  </>
}
