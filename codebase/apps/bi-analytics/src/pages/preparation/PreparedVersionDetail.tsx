import { useCallback, useState } from 'react'
import type { CdcHistoryEvent, CurrentSalesState, PreparationRepository, PreparationVersion } from '../../adapters/preparationRepository'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import { AppLink } from '../../components/SynapseShell'

type VersionData = { version: PreparationVersion | undefined; inputName: string | undefined; history: CdcHistoryEvent[]; current: CurrentSalesState[] }
const datasets = new DatasetsRepository()
export function PreparedVersionDetail({ datasetId, versionId, repository, preparedDatasetName }: { datasetId: string; versionId: string; repository: PreparationRepository; preparedDatasetName?: string }) {
  const [tab, setTab] = useState<'history' | 'current'>('history')
  const load = useCallback(async (signal: AbortSignal): Promise<VersionData> => {
    const [versions, history, current] = await Promise.all([
      repository.versions(datasetId, signal), repository.history(datasetId, versionId, signal), repository.currentState(datasetId, versionId, signal),
    ])
    const version = versions.items.find(item => item.versionId === versionId)
    const input = version ? await datasets.get(version.inputDatasetId, signal).catch(() => undefined) : undefined
    return { version, inputName: input ? `${input.origin.schema}.${input.origin.object}` : undefined, history: history.items, current: current.items }
  }, [datasetId, versionId, repository])
  const resource = useDatasetResource(load, `${datasetId}/${versionId}`)
  if (resource.loading) return <p role="status" className="prep-loading">Cargando versión preparada…</p>
  if (resource.error || !resource.data) return <div role="alert" className="prep-error">{resource.error?.message ?? 'No se encontró la versión.'}<button onClick={resource.refresh}>Reintentar carga</button></div>
  const { version, inputName, history, current } = resource.data
  return <>
    <header className="prep-version-header"><AppLink to="/datasets/preparacion-cdc/ejecuciones">← Volver a ejecuciones</AppLink><span className="prep-eyebrow">US-007 · PREPARACIÓN CDC · DETALLE DE VERSIÓN</span><h1>Detalle de versión <span className="prep-api-tag">{version ? `v${version.versionNumber}` : 'Provisto por API'}</span></h1><p>Trazabilidad de capturas de cambios (CDC) e inspección del estado consolidado.</p></header>
    <section className="prep-lineage"><h2>⛓ Linaje de preparación</h2><div className="prep-lineage-nodes"><article><small>DATASET DE ENTRADA</small><strong>{inputName ?? version?.inputDatasetId ?? 'Provisto por API'}</strong><span>Origen registrado</span></article><b aria-hidden="true">→</b><article><small>PROCESO CDC</small><strong>{processLabel(version?.processId)}</strong><span>Configuración versionada</span></article><b aria-hidden="true">→</b><article><small>DATASET PREPARADO</small><strong>{preparedDatasetName ?? datasetId}</strong><span>Versión {version ? `v${version.versionNumber}` : 'provista por API'}</span></article></div></section>
    <section className="prep-version-metadata"><h2>Metadatos de versión</h2><dl><div><dt>Dataset de entrada</dt><dd>{inputName ?? version?.inputDatasetId ?? 'Provisto por API'}</dd></div><div><dt>Proceso y configuración</dt><dd>{processLabel(version?.processId)}</dd></div><div><dt>Ejecución</dt><dd>{version?.runId ?? 'Provisto por API'}</dd></div><div><dt>Rango CDC consumido</dt><dd>{version?.sourceRangeStart != null && version.sourceRangeEnd != null ? `${version.sourceRangeStart} – ${version.sourceRangeEnd}` : 'No aplica o no disponible'}</dd></div><div><dt>Fecha de creación</dt><dd>{version ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(version.createdAt)) : 'Provisto por API'}</dd></div></dl></section>
    <section className="prep-version-data"><div role="tablist" aria-label="Datos de versión" className="prep-tabs"><button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>◷ Historial CDC</button><button role="tab" aria-selected={tab === 'current'} onClick={() => setTab('current')}>◉ Estado vigente</button></div>
      <div className="prep-immutability">♢ <span><strong>Regla de inmutabilidad:</strong> Las bajas lógicas y registros revocados permanecen de forma definitiva en el historial y no aparecen en el estado vigente.</span></div>
      {tab === 'history' ? <div className="prep-data-panel"><h3>Registro inmutable de transacciones</h3><p>Todas las inserciones, modificaciones y bajas quedan retenidas cronológicamente en el historial.</p><div className="prep-record-table-wrap"><table><thead><tr><th>Operación</th><th>Clave de negocio</th><th>Fecha de evento</th><th>Posición de origen</th><th>Ambigüedad temporal</th></tr></thead><tbody>{history.map((event, index) => <tr key={`${event.source_event_id}-${index}`}><td>{event.operation}</td><td>{event.business_key}</td><td>{date(event.event_timestamp)}</td><td>{event.source_position ?? '—'}</td><td>{event.timestamp_ambiguous ? 'Sí' : 'No'}</td></tr>)}</tbody></table></div>{history.length === 0 && <div className="prep-empty-small"><span>⌛</span><strong>Sin eventos registrados</strong><p>Los eventos CDC aparecerán aquí tras sincronizarse desde el origen.</p></div>}</div>
        : <div className="prep-data-panel"><h3>Consolidación de estado vigente</h3><p>Vista deduplicada de las ventas tras aplicar las operaciones CDC aceptadas.</p><div className="prep-record-table-wrap"><table><thead><tr><th>Clave de negocio</th><th>Imagen de venta</th><th>Último evento</th></tr></thead><tbody>{current.map(row => <tr key={row.business_key}><td>{row.business_key}</td><td><code>{JSON.stringify(row.after_image)}</code></td><td>{row.last_event_id}</td></tr>)}</tbody></table></div>{current.length === 0 && <div className="prep-empty-small"><span>◇</span><strong>Sin registros vigentes</strong><p>No hay eventos aceptados para esta versión.</p></div>}</div>}
    </section>
  </>
}
function processLabel(processId?: string) { return processId === 'sales-cdc-v1' ? 'Pipeline CDC / Captura' : processId ?? 'Provisto por API' }
function date(value?: string | null) { return value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
