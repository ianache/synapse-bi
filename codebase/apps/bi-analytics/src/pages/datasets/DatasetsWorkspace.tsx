import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { SourcesRepository } from '../../adapters/sourcesRepository'
import { useCallback } from 'react'
import { useDatasetResource } from '../../hooks/useDatasetResource'
import type { Origin } from '../../domain/datasets'
import { SynapseShell } from '../../components/SynapseShell'
import { DatasetList } from './DatasetList'
import { DatasetDetail } from './DatasetDetail'
import { DatasetForm } from './DatasetForm'
import '../kpi-workspace.css'
import '../sources.css'
import '../sources-accessibility.css'
import './datasets.css'
import './stitch-datasets.css'
import './stitch-registration.css'

const defaultRepository = new DatasetsRepository()
const sourceRepository = new SourcesRepository()
function EditDataset({ id, repository }: { id: string; repository: DatasetsRepository }) {
  const resource = useDatasetResource(useCallback(signal => repository.get(id, signal), [id, repository]), id)
  if (resource.loading) return <p role="status">Cargando dataset para editar…</p>
  if (resource.error || !resource.data) return <div role="alert" className="dataset-error">{resource.error?.message}<button className="source-button" onClick={resource.refresh}>Reintentar</button></div>
  return <DatasetForm key={`${id}/${resource.data.version}`} repository={repository} sourceRepository={sourceRepository} dataset={resource.data} />
}
export function DatasetsWorkspace({ path, search, repository = defaultRepository }: { path: string; search: string; repository?: DatasetsRepository }) {
  const parts = path.split('/').filter(Boolean)
  const query = new URLSearchParams(search)
  const initial = Object.fromEntries(['sourceId', 'observationId', 'schema', 'object'].map(key => [key, query.get(key) ?? ''])) as unknown as Origin
  const initialOrigin = Object.values(initial).every(Boolean) ? initial : undefined
  const id = parts[1] ? decodeURIComponent(parts[1]) : ''
  return <SynapseShell active="datasets" breadcrumb="Datasets"><div className="sources-workspace datasets-workspace">{parts.length === 1 ? <DatasetList repository={repository} />
    : parts[1] === 'nuevo' && parts.length === 2 ? <DatasetForm key={path + search} repository={repository} sourceRepository={sourceRepository} initialOrigin={initialOrigin} />
    : parts[2] === 'editar' && parts.length === 3 ? <EditDataset key={id} id={id} repository={repository} />
    : parts.length === 2 ? <DatasetDetail key={id} id={id} repository={repository} /> : <div role="alert">Pantalla no disponible.</div>}</div></SynapseShell>
}
