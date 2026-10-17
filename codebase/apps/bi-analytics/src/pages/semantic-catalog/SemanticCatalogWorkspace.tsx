import { useCallback } from 'react'
import { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import type { ResourceKind } from '../../domain/semanticCatalog'
import { catalogPath, semanticWritable } from '../../domain/semanticCatalog'
import { useSemanticCatalogResource } from '../../hooks/useSemanticCatalogResource'
import { SynapseShell, navigate } from '../../components/SynapseShell'
import { CatalogList } from './CatalogList'
import { DomainForm } from './DomainForm'
import { ComponentForm } from './ComponentForm'
import { KpiDefinitionForm } from './KpiDefinitionForm'
import { SemanticDetail } from './SemanticDetail'
import '../kpi-workspace.css'
import '../sources.css'
import '../sources-accessibility.css'
import './semantic-catalog.css'

const defaultRepository = new SemanticCatalogRepository()
function Editor({repository, kind, id}: {repository: SemanticCatalogRepository; kind: ResourceKind; id?: string}) {
  const options = useSemanticCatalogResource(useCallback(async signal => {
    const [domains, components, domain, component, kpi] = await Promise.all([
      repository.all('domains', {}, signal), kind === 'kpi-definitions' ? repository.all('components', {}, signal) : Promise.resolve([]),
      id && kind === 'domains' ? repository.get('domains', id, signal) : Promise.resolve(undefined),
      id && kind === 'components' ? repository.get('components', id, signal) : Promise.resolve(undefined),
      id && kind === 'kpi-definitions' ? repository.get('kpi-definitions', id, signal) : Promise.resolve(undefined),
    ])
    return {domains, components, domain, component, kpi}
  }, [repository, kind, id]), `${kind}/${id ?? 'new'}`)
  if (options.loading) return <p role="status">Cargando formulario…</p>
  if (options.error || !options.data) return <div role="alert">{options.error?.message}<button className="source-button" onClick={options.refresh}>Reintentar</button></div>
  const values = options.data
  return kind === 'domains' ? <DomainForm repository={repository} initial={values.domain} onSaved={saved => navigate(catalogPath(kind, saved.id))} />
    : kind === 'components' ? <ComponentForm repository={repository} domains={values.domains} initial={values.component} onSaved={saved => navigate(catalogPath(kind, saved.id))} />
    : <KpiDefinitionForm repository={repository} domains={values.domains} components={values.components} initial={values.kpi} onSaved={saved => navigate(catalogPath(kind, saved.id))} />
}
export function SemanticCatalogWorkspace({path, search: _search, repository = defaultRepository}: {path: string; search: string; repository?: SemanticCatalogRepository}) {
  const me = useSemanticCatalogResource(useCallback(signal => repository.me(signal), [repository]), 'semantic-permissions')
  const parts = path.split('/').filter(Boolean), kind = parts[1], id = parts[2] ? decodeURIComponent(parts[2]) : undefined
  const known = kind === 'domains' || kind === 'components' || kind === 'kpi-definitions'
  const canWrite = semanticWritable(me.data?.scopes ?? [])
  return <SynapseShell active="semantic" breadcrumb="Catálogo semántico"><div className="sources-workspace semantic-workspace">
    <div className="semantic-banner" role="note">Definiciones en borrador. Guardar no publica ni ejecuta fórmulas.</div>
    {me.loading ? <p role="status">Comprobando permisos…</p> : me.error ? <div role="alert">{me.error.message}<button className="source-button" onClick={me.refresh}>Reintentar</button></div>
      : !me.data?.scopes.includes('semantic:read') ? <div role="alert">No tienes permiso para consultar el catálogo semántico.</div>
      : parts.length === 1 ? <CatalogList repository={repository} canWrite={canWrite} />
      : !known || !id || parts.length > 4 || (parts[3] && parts[3] !== 'editar') ? <div role="alert">Pantalla no disponible.</div>
      : id === 'nuevo' || parts[3] === 'editar' ? canWrite ? <Editor key={`${kind}/${id}`} repository={repository} kind={kind} id={id === 'nuevo' ? undefined : id} /> : <div role="alert">No tienes permiso para editar.</div>
      : <SemanticDetail key={`${kind}/${id}`} repository={repository} kind={kind} id={id} canWrite={canWrite} />}
  </div></SynapseShell>
}
