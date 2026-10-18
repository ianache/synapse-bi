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

export function SynapseShell({ children, active, breadcrumb }: { children: ReactNode; active: 'explore' | 'dashboards' | 'sources' | 'datasets' | 'semantic' | 'models'; breadcrumb: string }) {
  const administration = active === 'sources' || active === 'datasets' || active === 'semantic' || active === 'models'
  const catalogAdministration = active === 'semantic' || active === 'datasets' || active === 'models'
  return <div className={`synapse bi-root${active === 'models' ? ' synapse-semantic synapse-models' : active === 'semantic' ? ' synapse-semantic' : active === 'datasets' ? ' synapse-datasets' : ''}`}>
    <a href="#workspace" className="synapse-skip">Saltar al contenido</a>
    <aside className="synapse-sidebar" aria-label="Espacio de trabajo">
      <AppLink to="/explorar" className="synapse-brand"><span className="synapse-logo"><Icon name={active === 'models' ? 'layers' : 'chart'} size={22} /></span><span><strong>Synapse BI</strong><small>{active === 'models' ? 'Enterprise Data' : 'Enterprise Analytics'}</small></span>{active !== 'models' && <span className="suite-tag">AI SUITE</span>}</AppLink>
      <nav aria-label="Navegación principal">
        {catalogAdministration && <button className="sc-new-query" disabled title="Nueva consulta no disponible en este incremento"><Icon name="plus" />Nueva consulta · no disponible</button>}
        {active === 'models' && <span className="sc-nav-section models-general">General</span>}
        <AppLink to="/" aria-current={window.location.pathname === '/' ? 'page' : undefined}><Icon name="home" />Inicio</AppLink>
        <AppLink to="/explorar" aria-current={active === 'explore' && window.location.pathname !== '/' ? 'page' : undefined}><Icon name="chart" />Explorar KPI</AppLink>
        <AppLink to="/dashboards" aria-current={active === 'dashboards' ? 'page' : undefined}><Icon name="grid" />Dashboards</AppLink>
        {catalogAdministration && <><span className="sc-nav-section">{active === 'models' ? 'Gobernanza semántica' : 'Administración de datos'}</span><AppLink to="/fuentes"><Icon name="server" />Fuentes de datos</AppLink><AppLink to="/datasets" aria-current={active === 'datasets' ? 'page' : undefined}><Icon name="database" />Datasets</AppLink></>}
        <AppLink to="/catalogo-semantico" aria-current={active === 'semantic' ? 'page' : undefined}><Icon name="database" />Catálogo semántico</AppLink>
        <AppLink to="/modelos-semanticos" aria-current={active === 'models' ? 'page' : undefined}><Icon name="layers" />Modelos semánticos</AppLink>
        <span className="synapse-nav-future"><Icon name="receipt" />Glosario<small>Próximamente</small></span>
        <span className="synapse-nav-future"><Icon name="layers" />Lineage<small>Próximamente</small></span>
        {!catalogAdministration && <><AppLink to="/fuentes" aria-current={active === 'sources' ? 'page' : undefined}><Icon name="server" />Fuentes de datos</AppLink>
        <AppLink to="/datasets"><Icon name="database" />Datasets</AppLink></>}
      </nav>
      {active === 'models' && <div className="models-sidebar-footer"><button disabled><Icon name="filter" />Configuración · no disponible</button><button disabled><Icon name="message" />Ayuda · no disponible</button></div>}
      <div className="synapse-tenant"><Icon name="building" size={18} /><span><strong>Corporación Global S.A.</strong><small>{active === 'models' ? 'Demostración · Sandbox' : 'Espacio de demostración'}</small></span></div>
    </aside>
    <div className="synapse-body">
      <header className="synapse-topbar"><div className="synapse-breadcrumb"><AppLink to="/">Inicio</AppLink><span aria-hidden="true">/</span>{(active === 'semantic' || active === 'models') && <>Gobernanza semántica<span aria-hidden="true">/</span></>}{active === 'datasets' && <>Administración de datos<span aria-hidden="true">/</span></>}{breadcrumb}{(active === 'semantic' || active === 'models') && <span className="sc-badge">{active === 'models' ? 'US-004' : 'US-003'}</span>}</div><span className="synapse-demo">{active === 'models' ? 'Prototipo · Entorno Laboratorio' : active === 'semantic' ? 'Capa de definición en borrador' : administration ? 'Administración · Metadatos técnicos' : 'Vista previa · Datos de ejemplo'}</span>{active === 'datasets' && <button className="ds-export" disabled title="Exportación no disponible en este incremento"><Icon name="download" size={14} />Exportar · no disponible</button>}{active === 'models' && <div className="models-topbar-tools"><button disabled aria-label="Notificaciones · no disponible" title="Notificaciones · no disponible"><Icon name="bell" size={18} /></button><button disabled aria-label="Ayuda técnica · no disponible" title="Ayuda técnica · no disponible"><Icon name="message" size={18} /></button><button disabled aria-label="Ajustes de vista · no disponible" title="Ajustes de vista · no disponible"><Icon name="filter" size={18} /></button></div>}<div className="synapse-profile"><span className="synapse-avatar">{administration ? 'AD' : 'AR'}</span><span><strong>{active === 'models' ? 'AD · Administrador de datos' : administration ? 'Administración de datos' : 'Ana Rivas'}</strong><small>{active === 'models' ? 'Data Engineering' : active === 'semantic' ? 'Rol técnico · Modelado Semántico' : administration ? 'Conexiones y esquema' : 'Analista de negocio'}</small></span></div></header>
      <main id="workspace" tabIndex={-1} className="synapse-main">{children}</main>
      {active === 'semantic' && <footer className="sc-app-footer"><span><strong>Synapse BI</strong> — Suite de Analítica de Datos y Gobernanza Empresarial</span><span>Módulo: US-003 Catálogo Semántico · Entorno local</span></footer>}
    </div>
  </div>
}
