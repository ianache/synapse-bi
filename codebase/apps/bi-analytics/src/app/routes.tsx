import { DashboardPage } from '../pages/DashboardPage'
import { createMockSemanticAdapter } from '../adapters/mockSemanticAdapter'
import {ComponentKitShowcase} from '@bi-analytics/design-system'
import {LoginPage} from '../pages/LoginPage'
import { useEffect, useState } from 'react'
import { KpiWorkspace } from '../pages/KpiWorkspace'
import { SourcesWorkspace } from '../pages/SourcesWorkspace'
import { DatasetsWorkspace } from '../pages/datasets/DatasetsWorkspace'
import { SemanticCatalogWorkspace } from '../pages/semantic-catalog/SemanticCatalogWorkspace'
import { SemanticModelsWorkspace } from '../pages/semantic-models/SemanticModelsWorkspace'
export function Routes() {
 const [location, setLocation] = useState({ path: window.location.pathname, search: window.location.search })
 const { path, search } = location
 useEffect(() => {
  const update = () => setLocation({ path: window.location.pathname, search: window.location.search })
  window.addEventListener('popstate', update)
  return () => window.removeEventListener('popstate', update)
 }, [])
 if(path==='/login')return <LoginPage/>
 if(path==='/componentes')return <ComponentKitShowcase/>
 if(path==='/dashboard')return <DashboardPage adapter={createMockSemanticAdapter()} />
 if(path === '/fuentes' || path.startsWith('/fuentes/'))return <SourcesWorkspace key={path} path={path} />
 if(path === '/datasets' || path.startsWith('/datasets/'))return <DatasetsWorkspace path={path} search={search} />
 if(path === '/catalogo-semantico' || path.startsWith('/catalogo-semantico/'))return <SemanticCatalogWorkspace path={path} search={search} />
 if(path === '/modelos-semanticos' || path.startsWith('/modelos-semanticos/'))return <SemanticModelsWorkspace path={path} search={search} />
 return <KpiWorkspace path={path} />
}
