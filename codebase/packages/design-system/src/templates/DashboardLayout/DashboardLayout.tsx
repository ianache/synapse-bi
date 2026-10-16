import type { ReactNode } from 'react'
import { Sidebar } from '../../organisms/Sidebar/Sidebar'
import { TopBar } from '../../organisms/TopBar/TopBar'

export function DashboardLayout({ navigation, onNavigate, children }: { navigation: { label: string; href: string }[]; onNavigate?: (href: string) => void; children: ReactNode }) {
  return <div className="dashboard-layout" style={{ background: 'var(--bi-color-bg)', color: 'var(--bi-color-text)' }}><Sidebar><nav aria-label="Main navigation">{navigation.map((item) => <a key={item.href} href={item.href} onClick={(event) => { if (onNavigate) { event.preventDefault(); onNavigate(item.href) } }} style={{ display: 'block', padding: '0.5rem' }}>{item.label}</a>)}</nav></Sidebar><main><TopBar><h1>BI Analytics</h1></TopBar><div style={{ padding: '1.5rem' }}>{children}</div></main></div>
}
