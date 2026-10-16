import { publishedKpis } from '../domain/kpis'

export interface LocalDashboard {
  id: string
  name: string
  owner: string
  updated: string
  visualizations: number
  shared: boolean
  editable: boolean
  kpiIds: string[]
  version?: number
  modelVersions?: Record<string, number>
}

const storageKey = 'synapse-bi.demo-dashboards.v1'
export const initialDashboards: LocalDashboard[] = [
  { id: 'ventas-q3', name: 'Ventas Q3 Ejecutivo', owner: 'Ana Rivas', updated: 'Hace 1 día', visualizations: 8, shared: true, editable: true, kpiIds: [] },
  { id: 'finanzas', name: 'Resumen financiero mensual', owner: 'Finanzas', updated: 'Hace 3 h', visualizations: 12, shared: true, editable: true, kpiIds: [] },
  { id: 'comercial', name: 'Seguimiento comercial', owner: 'Equipo de Ventas', updated: 'Hace 2 días', visualizations: 6, shared: true, editable: true, kpiIds: [] },
  { id: 'personal', name: 'Mi análisis', owner: 'Ana Rivas', updated: 'Hace 20 min', visualizations: 2, shared: false, editable: true, kpiIds: [] },
]

function isDashboard(value: unknown): value is LocalDashboard {
  if (!value || typeof value !== 'object') return false
  const d = value as Partial<LocalDashboard>
  return typeof d.id === 'string' && /^[a-zA-Z0-9-]+$/.test(d.id) && typeof d.name === 'string' && !!d.name.trim() && typeof d.owner === 'string' && typeof d.updated === 'string' && typeof d.visualizations === 'number' && Number.isFinite(d.visualizations) && d.visualizations >= 0 && typeof d.shared === 'boolean' && typeof d.editable === 'boolean' && Array.isArray(d.kpiIds) && d.kpiIds.every(id => publishedKpis.some(kpi => kpi.id === id))
}

export function loadDashboards(): LocalDashboard[] {
  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (Array.isArray(parsed) && parsed.length && parsed.every(isDashboard) && new Set(parsed.map(d => d.id)).size === parsed.length) return parsed
  } catch { /* Invalid/unavailable browser storage falls back to demo fixtures. */ }
  return initialDashboards.map(d => ({ ...d, kpiIds: [] }))
}

export function saveDashboards(dashboards: LocalDashboard[]) {
  // Let the caller report errors and retain the user's selection for retry.
  window.localStorage.setItem(storageKey, JSON.stringify(dashboards))
}
