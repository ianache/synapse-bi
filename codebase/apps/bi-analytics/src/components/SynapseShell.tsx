import {useEffect, useState, type ReactNode} from 'react'
import {Mainbar, Menubar, type BreadcrumbItem} from '@bi-analytics/design-system'
import {getShellNavigation, shellActions, shellUtilities, type ShellSection} from './shellNavigation'

export function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function AppLink({to, children, ...props}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {to: string; children: ReactNode}) {
  return <a {...props} href={to} onClick={event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {event.preventDefault(); navigate(to)}
  }}>{children}</a>
}

export function SynapseShell({children, active, breadcrumb, breadcrumbs}: {
  children: ReactNode; active: ShellSection; breadcrumb: string; breadcrumbs?: BreadcrumbItem[]
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = window.location.pathname
  useEffect(() => setMobileOpen(false), [pathname])
  const navigation = getShellNavigation(active, pathname)
  const environment = (import.meta as ImportMeta & {env?: Record<string,string>}).env
  const demo = environment?.VITE_API_AUTH === 'development' || environment?.VITE_DATA_SOURCE === 'fixture'
  const trail: BreadcrumbItem[] = breadcrumbs ?? (active === 'explore' && pathname === '/' ? [{id:'home',label:'Inicio'}] : [
    {id:'home',label:'Inicio',href:'/'},
    ...(['sources','datasets','semantic','models'].includes(active) ? [{id:'governance',label:'Gobernanza semántica'}] : []),
    {id:'location',label:breadcrumb},
  ])
  const context = active === 'models' ? 'Prototipo · Entorno Laboratorio' : active === 'semantic'
    ? 'Capa de definición en borrador' : ['sources','datasets'].includes(active)
    ? 'Administración · Metadatos técnicos' : 'Vista previa · Datos de ejemplo'
  return <div className={`synapse bi-root bi-navigation-layout bi-shell-layout${active === 'models' ? ' synapse-semantic synapse-models' : active === 'semantic' ? ' synapse-semantic' : active === 'datasets' ? ' synapse-datasets' : ''}`}>
    <a href="#workspace" className="synapse-skip">Saltar al contenido</a>
    <Menubar id="synapse-navigation" brand={{label:'Synapse BI',subtitle:'Semantic Intelligence',badge:'Enterprise',href:'/'}}
      {...navigation} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} onNavigate={navigate}
      quickAction={{id:'query',label:'Nueva consulta SQL/BI',icon:'plus',unavailableReason:'Motor de consultas no implementado'}}
      utilityActions={shellUtilities}
      organization={demo ? {name:'Espacio de demostración',description:'Sandbox · organización no configurada'} : undefined}/>
    <div className="synapse-body bi-shell-body">
      <Mainbar breadcrumbs={trail} actions={shellActions} menubarId="synapse-navigation" mobileMenuOpen={mobileOpen}
        onMobileMenuToggle={() => setMobileOpen(value => !value)} onNavigate={navigate}/>
      <main id="workspace" tabIndex={-1} className="synapse-main">
        <p className="bi-shell-context">{context}</p>{children}
      </main>
      {active === 'semantic' && <footer className="sc-app-footer"><span><strong>Synapse BI</strong> — Suite de Analítica de Datos y Gobernanza Empresarial</span><span>Módulo: US-003 Catálogo Semántico · Entorno local</span></footer>}
    </div>
  </div>
}
