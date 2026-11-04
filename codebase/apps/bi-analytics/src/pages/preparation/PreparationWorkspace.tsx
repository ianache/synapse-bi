import { useCallback, useEffect, useState } from 'react'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { PreparationRepository } from '../../adapters/preparationRepository'
import { SourcesRepository } from '../../adapters/sourcesRepository'
import { SynapseShell } from '../../components/SynapseShell'
import { Icon } from '@bi-analytics/design-system'
import { PipelineConfiguration } from './PipelineConfiguration'
import { PreparationRuns } from './PreparationRuns'
import { PreparationRunDetail } from './PreparationRunDetail'
import { PreparedVersionDetail } from './PreparedVersionDetail'
import './preparation.css'

const preparations = new PreparationRepository()
const sources = new SourcesRepository()
const datasets = new DatasetsRepository()

export function PreparationWorkspace({ path, search = '' }: { path: string; search?: string }) {
  const parts = path.split('/').filter(Boolean).slice(2)
  const [revision, setRevision] = useState(0)
  const [preparedDatasetName, setPreparedDatasetName] = useState<string>()
  const preparedDatasetId = parts[0] === 'datasets' && parts[1] ? decodeURIComponent(parts[1]) : undefined
  useEffect(() => {
    if (!preparedDatasetId) { setPreparedDatasetName(undefined); return }
    setPreparedDatasetName(undefined)
    const controller = new AbortController()
    datasets.get(preparedDatasetId, controller.signal).then(dataset => setPreparedDatasetName(dataset.name)).catch(() => setPreparedDatasetName(undefined))
    return () => controller.abort()
  }, [preparedDatasetId])
  const refresh = () => setRevision(value => value + 1)
  const loadPipelines = useCallback((signal: AbortSignal) => preparations.pipelines(signal), [revision])
  const loadSources = useCallback((signal: AbortSignal) => sources.list(signal), [])
  const loadDatasets = useCallback((signal: AbortSignal) => datasets.list({ registrationStatus: 'registered', limit: 100 }, signal), [])
  let page
  if (parts[0] === 'ejecuciones' && parts[1]) page = <PreparationRunDetail runId={decodeURIComponent(parts[1])} repository={preparations} onChanged={refresh} />
  else if (parts[0] === 'datasets' && parts[2] === 'versiones' && parts[3]) page = <PreparedVersionDetail datasetId={decodeURIComponent(parts[1])} versionId={decodeURIComponent(parts[3])} repository={preparations} preparedDatasetName={preparedDatasetName} />
  else if (parts[0] === 'ejecuciones') page = <PreparationRuns repository={preparations} loadPipelines={loadPipelines} initialPipelineId={new URLSearchParams(search).get('pipeline_id') ?? ''} key={revision} />
  else page = <PipelineConfiguration repository={preparations} loadPipelines={loadPipelines} loadSources={loadSources} loadDatasets={loadDatasets} onCreated={refresh} />
  const breadcrumbs = buildPreparationBreadcrumbs(path, preparedDatasetName)
  const breadcrumb = breadcrumbs[breadcrumbs.length - 1]?.label ?? 'Preparaci\u00f3n CDC'
  return <SynapseShell active="datasets" breadcrumb={breadcrumb} className="synapse-preparation" mobileBrand={{label:'Synapse BI', subtitle:'Enterprise Data'}} breadcrumbs={breadcrumbs}>
    <div className="prep-mobile-breadcrumb" aria-label="Ruta de navegaci\u00f3n">{breadcrumbs.map((item, index) => <span key={item.id}>{index > 0 && <> {'\u203a'} </>}{item.label}</span>)}</div><div className="preparation-workspace" data-revision={revision}>{page}<PreparationMobileNav /></div></SynapseShell>
}


export function buildPreparationBreadcrumbs(path: string, preparedDatasetName?: string) {
  const parts = path.split('/').filter(Boolean).slice(2)
  const trail = [
    { id: 'home', label: 'Inicio', href: '/' },
    { id: 'datasets', label: 'Datasets', href: '/datasets' },
    { id: 'cdc', label: 'Preparaci\u00f3n CDC', href: '/datasets/preparacion-cdc' },
  ]
  if (parts[0] === 'ejecuciones' && parts[1]) return [...trail, { id: 'runs', label: 'Historial de ejecuciones', href: '/datasets/preparacion-cdc/ejecuciones' }, { id: 'run-detail', label: 'Detalle de ejecuci\u00f3n' }]
  if (parts[0] === 'ejecuciones') return [...trail, { id: 'runs', label: 'Historial de ejecuciones' }]
  if (parts[0] === 'datasets' && parts[2] === 'versiones' && parts[3]) return [
    trail[0], trail[1], { id: 'prepared-dataset', label: preparedDatasetName ?? 'Dataset preparado', href: `/datasets/${encodeURIComponent(parts[1])}` },
    { id: 'versions', label: 'Versiones' },
    { id: 'version-detail', label: 'Detalle de versi\u00f3n' },
  ]
  return trail
}

function PreparationMobileNav() {
  return <nav className="prep-mobile-nav" aria-label="Navegación principal">
    <AppNav to="/" label="Inicio" icon="home" />
    <AppNav to="/explorar" label="Explorar KPI" icon="chart" />
    <AppNav to="/dashboard" label="Dashboards" icon="grid" />
    <AppNav to="/catalogo-semantico" label="Catálogo" icon="bookmark" />
    <button type="button" disabled aria-label="Más · no disponible"><Icon name="more" size={20} /><span>Más</span></button>
  </nav>
}

function AppNav({to,label,icon,current=false}: {to:string;label:string;icon:'home'|'chart'|'grid'|'bookmark';current?:boolean}) {
  return <a href={to} aria-current={current ? 'page' : undefined} onClick={event => { if(event.button===0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey){event.preventDefault(); window.history.pushState({},'',to); window.dispatchEvent(new PopStateEvent('popstate'))} }}><Icon name={icon} size={20}/><span>{label}</span></a>
}
