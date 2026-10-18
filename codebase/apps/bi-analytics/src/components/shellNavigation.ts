import type {NavigationGroup, ShellAction} from '@bi-analytics/design-system'
export type ShellSection = 'explore' | 'dashboards' | 'sources' | 'datasets' | 'semantic' | 'models'
const groups: NavigationGroup[] = [
  {id:'general',label:'General',items:[
    {id:'home',label:'Inicio',href:'/',icon:'home'},
    {id:'explore',label:'Explorar KPI',href:'/explorar',icon:'chart'},
    {id:'dashboards',label:'Dashboards',href:'/dashboards',icon:'grid'},
  ]},
  {id:'governance',label:'Gobernanza & Semántica',items:[
    {id:'sources',label:'Fuentes de datos',href:'/fuentes',icon:'database'},
    {id:'datasets',label:'Datasets',href:'/datasets',icon:'grid'},
    {id:'semantic',label:'Catálogo semántico',href:'/catalogo-semantico',icon:'bookmark'},
    {id:'models',label:'Modelos semánticos',href:'/modelos-semanticos',icon:'shapes'},
    {id:'glossary',label:'Glosario de negocio',icon:'bookmark',unavailableReason:'Módulo no implementado'},
    {id:'lineage',label:'Lineage analítico',icon:'layers',unavailableReason:'Módulo no implementado'},
  ]},
]
export function getShellNavigation(active: ShellSection, pathname: string): {groups: NavigationGroup[]; activeItemId?: string} {
  return {groups,activeItemId:active === 'explore' && pathname === '/' ? 'home' : active}
}
export const shellUtilities: ShellAction[] = [
  {id:'settings',label:'Configuración',icon:'sliders',unavailableReason:'Configuración global no implementada'},
  {id:'docs',label:'Ayuda & Documentación',icon:'bookmark',unavailableReason:'Documentación contextual no integrada'},
]
export const shellActions: ShellAction[] = [
  {id:'notifications',label:'Notificaciones',icon:'bell',unavailableReason:'Servicio de notificaciones no implementado'},
  {id:'filters',label:'Filtros globales',icon:'sliders',unavailableReason:'Filtros globales no implementados'},
  {id:'help',label:'Ayuda contextual',icon:'bookmark',unavailableReason:'Ayuda contextual no implementada'},
]
