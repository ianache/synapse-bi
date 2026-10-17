import type { ReactNode } from 'react'
import { Icon } from '@bi-analytics/design-system'

export function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function AppLink({ to, children, ...props }: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string; children: ReactNode }) {
  return <a {...props} href={to} onClick={event => {
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(to) }
  }}>{children}</a>
}

export function SynapseShell({ children, active, breadcrumb }: { children: ReactNode; active: 'explore' | 'dashboards' | 'sources' | 'datasets' | 'semantic'; breadcrumb: string }) {
  const administration = active === 'sources' || active === 'datasets' || active === 'semantic'
  return <div className="synapse bi-root">
    <a href="#workspace" className="synapse-skip">Saltar al contenido</a>
    <aside className="synapse-sidebar" aria-label="Espacio de trabajo">
      <AppLink to="/explorar" className="synapse-brand"><span className="synapse-logo"><Icon name="chart" size={22} /></span><span><strong>Synapse BI</strong><small>Enterprise Analytics</small></span><span className="suite-tag">AI SUITE</span></AppLink>
      <nav aria-label="Navegación principal">
        <AppLink to="/" aria-current={window.location.pathname === '/' ? 'page' : undefined}><Icon name="home" />Inicio</AppLink>
        <AppLink to="/explorar" aria-current={active === 'explore' && window.location.pathname !== '/' ? 'page' : undefined}><Icon name="chart" />Explorar KPI</AppLink>
        <AppLink to="/dashboards" aria-current={active === 'dashboards' ? 'page' : undefined}><Icon name="grid" />Dashboards</AppLink>
        <AppLink to="/catalogo-semantico" aria-current={active === 'semantic' ? 'page' : undefined}><Icon name="database" />Catálogo semántico</AppLink>
        <span className="synapse-nav-future"><Icon name="receipt" />Glosario<small>Próximamente</small></span>
        <span className="synapse-nav-future"><Icon name="layers" />Lineage<small>Próximamente</small></span>
        <AppLink to="/fuentes" aria-current={active === 'sources' ? 'page' : undefined}><Icon name="server" />Fuentes de datos</AppLink>
        <AppLink to="/datasets" aria-current={active === 'datasets' ? 'page' : undefined}><Icon name="database" />Datasets</AppLink>
      </nav>
      <div className="synapse-tenant"><Icon name="building" size={18} /><span><strong>Corporación Global S.A.</strong><small>Espacio de demostración</small></span></div>
    </aside>
    <div className="synapse-body">
      <header className="synapse-topbar"><div className="synapse-breadcrumb"><AppLink to="/">Inicio</AppLink><span aria-hidden="true">/</span>{breadcrumb}</div><span className="synapse-demo">{administration ? 'Administración · Metadatos técnicos' : 'Vista previa · Datos de ejemplo'}</span><div className="synapse-profile"><span className="synapse-avatar">{administration ? 'AD' : 'AR'}</span><span><strong>{administration ? 'Administración de datos' : 'Ana Rivas'}</strong><small>{administration ? 'Conexiones y esquema' : 'Analista de negocio'}</small></span></div></header>
      <main id="workspace" tabIndex={-1} className="synapse-main">{children}</main>
    </div>
  </div>
}
