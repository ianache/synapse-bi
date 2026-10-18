import {useCallback, useEffect, useState} from 'react'
import type {ModelDetailRecord, ModelDraft} from '../../domain/semanticModels'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {SemanticCatalogRepository} from '../../adapters/semanticCatalogRepository'
import {useDatasetResource} from '../../hooks/useDatasetResource'
import {SynapseShell, navigate} from '../../components/SynapseShell'
import {draftPath, modelReadable, modelWritable} from '../../domain/semanticModels'
import {ModelList} from './ModelList'
import {ModelCreate} from './ModelCreate'
import {ModelDetail} from './ModelDetail'
import {ModelCompare} from './ModelCompare'
import {ModelError} from './ModelsChrome'
import '../kpi-workspace.css'
import '../sources.css'
import '../sources-accessibility.css'
import '../semantic-catalog/stitch-catalog.css'
import './semantic-models.css'

const defaultRepository = new SemanticModelsRepository(), defaultCatalog = new SemanticCatalogRepository()
function ExistingModel({repository, catalogRepository, modelId, draftId, compare, search, canWrite, confirmed, onConfirmed}: {repository: SemanticModelsRepository; catalogRepository: SemanticCatalogRepository; modelId: string; draftId?: string; compare: boolean; search: string; canWrite: boolean; confirmed?: ModelDetailRecord; onConfirmed: (value: ModelDetailRecord) => void}) {
  const [useConfirmed, setUseConfirmed] = useState(true)
  const resource = useDatasetResource(useCallback(async signal => {
    if (useConfirmed && !compare && confirmed?.model.id === modelId && (!draftId || confirmed.draft.id === draftId)) return {detail: confirmed, editable: true}
    const latest = await repository.get(modelId, signal)
    const draft = draftId && draftId !== latest.draft.id ? await repository.getDraft(modelId, draftId, signal) : latest.draft
    return {detail: {...latest, draft}, editable: draft.id === latest.draft.id}
  }, [repository, modelId, draftId, compare, confirmed, useConfirmed]), `model/${modelId}/${draftId ?? 'latest'}`)
  if (resource.loading) return <p role="status">Cargando modelo y captura…</p>
  if (resource.error || !resource.data) return <ModelError error={resource.error} retry={resource.refresh} />
  const {detail, editable} = resource.data
  const reload = () => {setUseConfirmed(false); resource.refresh()}
  const saved = (result: ModelDraft, model = {...detail.model, revision: detail.model.revision + 1, updatedAt: result.updatedAt}) => onConfirmed({model, draft: result})
  return compare ? <ModelCompare key={`${detail.draft.id}/${detail.draft.revision}/${search}`} repository={repository} catalogRepository={catalogRepository} detail={detail} editable={editable} canWrite={canWrite} search={search} onSaved={saved} />
    : <ModelDetail key={`${detail.draft.id}/${detail.draft.revision}`} repository={repository} detail={detail} editable={editable} canWrite={canWrite} onReload={reload} onSaved={saved} />
}
export function SemanticModelsWorkspace({path, search = '', repository = defaultRepository, catalogRepository = defaultCatalog}: {path: string; search?: string; repository?: SemanticModelsRepository; catalogRepository?: SemanticCatalogRepository}) {
  const [confirmed, setConfirmed] = useState<ModelDetailRecord>()
  useEffect(() => {setConfirmed(value => value && path !== draftPath(value.model.id, value.draft.id) ? undefined : value)}, [path])
  const onConfirmed = (result: ModelDetailRecord) => {setConfirmed(result); navigate(draftPath(result.model.id, result.draft.id))}
  const identity = useDatasetResource(useCallback(signal => repository.me(signal), [repository]), 'model-permissions')
  const parts = path.split('/').filter(Boolean)
  const readable = modelReadable(identity.data?.scopes ?? []), writable = modelWritable(identity.data?.scopes ?? [])
  const create = parts.length === 2 && parts[1] === 'nuevo'
  const existing = parts.length === 2 && parts[1] !== 'nuevo' || (parts[2] === 'borradores' && [4, 5].includes(parts.length) && (parts.length === 4 || parts[4] === 'comparar'))
  return <SynapseShell active="models" breadcrumb="Modelos semánticos"><div className="models-workspace" data-view={create ? "create" : parts[4] === "comparar" ? "compare" : existing ? "detail" : "list"}>
    {identity.loading ? <p role="status">Comprobando permisos…</p> : identity.error ? <ModelError error={identity.error} retry={identity.refresh} />
      : !readable ? <div role="alert" className="models-error">No tienes permiso para consultar modelos y capturas semánticas.</div>
      : parts.length === 1 ? <ModelList repository={repository} catalogRepository={catalogRepository} canWrite={writable} />
      : create ? writable ? <ModelCreate repository={repository} catalogRepository={catalogRepository} onSaved={onConfirmed} /> : <div role="alert">No tienes permiso para crear modelos.</div>
      : existing ? <ExistingModel key={`${parts[1]}/${parts[3] ?? ''}/${parts[4] ?? ''}`} repository={repository} catalogRepository={catalogRepository} modelId={parts[1]} draftId={parts[3]} compare={parts[4] === 'comparar'} search={search} canWrite={writable} confirmed={confirmed} onConfirmed={onConfirmed} /> : <div role="alert">Pantalla de modelos no disponible.</div>}
  </div></SynapseShell>
}
