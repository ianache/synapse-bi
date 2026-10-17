import {useCallback, useState} from 'react'
import type {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {useDatasetResource} from '../../hooks/useDatasetResource'
import {draftPath} from '../../domain/semanticModels'
import {AppLink} from '../../components/SynapseShell'
import {ModelError, modelDate} from './ModelsChrome'

export function ModelVersionHistory({repository, modelId, currentId}: {repository: SemanticModelsRepository; modelId: string; currentId: string}) {
  const [offset, setOffset] = useState(0)
  const history = useDatasetResource(useCallback(signal => repository.drafts(modelId, offset, signal), [repository, modelId, offset]), `history/${modelId}/${offset}`)
  return <section className="models-card"><h2>Historial de versiones</h2><p>Las versiones anteriores se preservan. Una revisión técnica no es una versión publicada.</p><ModelError error={history.error} retry={history.refresh} />{history.loading ? <p role="status">Cargando historial…</p> : history.data && <><div className="models-table-scroll" role="region" aria-label="Historial de borradores" tabIndex={0}><table><thead><tr><th>Versión de trabajo</th><th>Captura guardada</th><th>Contenido</th><th>Acciones</th></tr></thead><tbody>{history.data.items.map(row => <tr key={row.id}><td><strong>Borrador {row.sequence}</strong><small>Revisión técnica {row.revision}</small></td><td>{modelDate(row.capturedAt)}</td><td>{row.kpiCount} KPI · {row.componentCount} dependencias únicas</td><td><AppLink className="source-button" to={draftPath(modelId, row.id)}>Abrir borrador {row.sequence}</AppLink>{row.id !== currentId && <AppLink className="source-button" to={`${draftPath(modelId, currentId)}/comparar?${new URLSearchParams({mode: 'versions', leftDraftId: row.id, rightDraftId: currentId})}`}>Comparar con este borrador</AppLink>}</td></tr>)}</tbody></table></div><footer className="models-pagination"><span>{history.data.total} versiones de trabajo</span><button className="source-button" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 25))}>Anterior</button><button className="source-button" disabled={offset + history.data.items.length >= history.data.total} onClick={() => setOffset(offset + 25)}>Siguiente</button></footer></>}</section>
}
