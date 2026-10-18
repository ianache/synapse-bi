import {useId, useState} from 'react'
import {Mainbar, Menubar} from '../../organisms'
import type {NavigationGroup, ShellAction} from '../../organisms/navigation/types'
import './navigation-preview.css'

export const demoBrand = {label:'Synapse BI',subtitle:'Semantic Intelligence',badge:'Enterprise',href:'/'}
export const demoGroups: NavigationGroup[] = [
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
    {id:'glossary',label:'Glosario de negocio',icon:'bookmark',unavailableReason:'Ejemplo no operativo'},
    {id:'lineage',label:'Lineage analítico',icon:'layers',unavailableReason:'Ejemplo no operativo'},
  ]},
]
export const demoActions: ShellAction[] = [
  {id:'notifications',label:'Notificaciones',icon:'bell',unavailableReason:'Ejemplo sin servicio de notificaciones'},
  {id:'filters',label:'Filtros globales',icon:'sliders',unavailableReason:'Ejemplo sin filtros globales'},
  {id:'help',label:'Ayuda contextual',icon:'bookmark',unavailableReason:'Ejemplo sin ayuda integrada'},
]
export const demoProfile = {name:'Perfil de demostración',description:'Sin sesión real · catálogo UI',initials:'DM'}
export function NavigationPreview() {
  const id=useId(), [open,setOpen]=useState(false), [active,setActive]=useState('models')
  const selected=demoGroups.flatMap(group=>group.items).find(item=>item.id===active)!
  const select=(href:string)=>{
    const item=demoGroups.flatMap(group=>group.items).find(item=>item.href===href)
    if(item) setActive(item.id)
    setOpen(false)
  }
  return <section className="bi-navigation-demo" aria-label="Demostración de navegación">
    <h3>Demostración de navegación</h3>
    <p>Menubar lateral y Mainbar superior. Datos de ejemplo; la selección sólo cambia esta vista, no tu sesión.</p>
    <div className="bi-navigation-preview">
      <Menubar id={id} brand={demoBrand} groups={demoGroups} activeItemId={active} mobileOpen={open}
        onMobileClose={()=>setOpen(false)} onNavigate={select}
        quickAction={{id:'query',label:'Nueva consulta SQL/BI',icon:'plus',unavailableReason:'Ejemplo sin motor de consultas'}}
        utilityActions={[{id:'settings',label:'Configuración',icon:'sliders',unavailableReason:'Ejemplo no operativo'}]}
        organization={{name:'Organización de demostración',description:'Datos de ejemplo · sin tenant real'}}/>
      <div className="bi-navigation-preview-body">
        <Mainbar breadcrumbs={[{id:'kit',label:'Biblioteca UI'},{id:'current',label:selected.label}]} actions={demoActions}
          profile={demoProfile} menubarId={id} mobileMenuOpen={open} onMobileMenuToggle={()=>setOpen(value=>!value)}/>
        <div className="bi-navigation-preview-content"><h4>Canvas de ejemplo</h4><p role="status">Destino seleccionado: {selected.label}</p>
          <p>Las acciones no implementadas permanecen identificadas como no disponibles.</p></div>
      </div>
    </div>
  </section>
}
