import {useState, type ReactNode} from 'react'
import {Menubar} from '../../organisms/Menubar/Menubar'
import {Mainbar} from '../../organisms/Mainbar/Mainbar'
import type {MainbarProps} from '../../organisms/navigation/types'
import './layout.css'

export function DashboardLayout({navigation, onNavigate, children, mainbar, activeHref}: {
  navigation: {label: string; href: string}[]; onNavigate?: (href: string) => void; children: ReactNode;
  mainbar?: Pick<MainbarProps,'breadcrumbs'|'actions'|'profile'>; activeHref?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return <div className="dashboard-layout bi-root bi-navigation-layout bi-shell-layout">
    <Menubar id="dashboard-navigation" brand={{label:'Synapse BI',subtitle:'Semantic Intelligence',badge:'Enterprise',href:'/'}}
      groups={[{id:'general',label:'General',items:navigation.map(item => ({...item,id:item.href}))}]}
      activeItemId={activeHref} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}
      onNavigate={onNavigate}/>
    <div className="bi-shell-body">
      <Mainbar breadcrumbs={mainbar?.breadcrumbs ?? [{id:'dashboard',label:'BI Analytics'}]} actions={mainbar?.actions}
        profile={mainbar?.profile} menubarId="dashboard-navigation" mobileMenuOpen={mobileOpen}
        onMobileMenuToggle={() => setMobileOpen(value => !value)} onNavigate={onNavigate}/>
      <main className="bi-dashboard-content">{children}</main>
    </div>
  </div>
}
