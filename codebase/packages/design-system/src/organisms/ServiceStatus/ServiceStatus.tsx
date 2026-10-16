import {useEffect,useId,useRef,useState} from 'react'
import {Icon,type IconName} from '../../atoms/Icon/Icon'

export type ServiceHealth = {id:string;name:string;status:'operational'|'degraded'|'unavailable'|'unknown';latencyMs?:number}
export const platformServices:ServiceHealth[]=[
 {id:'portal',name:'Portal Web',status:'unknown'},
 {id:'bff',name:'BFF (API)',status:'unknown'},
 {id:'keycloak',name:'Keycloak IAM',status:'unknown'},
 {id:'backend',name:'Backend Core & ML',status:'unknown'},
 {id:'database',name:'Database Cluster',status:'unknown'},
 {id:'vault',name:'HashiCorp Vault',status:'unknown'},
]
const icons:Record<string,IconName>={portal:'monitor',bff:'server',keycloak:'key',backend:'server',database:'database',vault:'lock'}
const labels={operational:'Operacional',degraded:'Degradado',unavailable:'No disponible',unknown:'Sin verificar'}

export function ServiceStatus({services=platformServices,updatedAt,error,preview=false}:{services?:ServiceHealth[];updatedAt?:string;error?:string;preview?:boolean}) {
 const [open,setOpen]=useState(false)
 const id=useId(),ref=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null)
 const allUp=services.length>0&&services.every(s=>s.status==='operational')
 const hasIncident=services.some(s=>s.status==='degraded'||s.status==='unavailable')
 const overall=allUp?'operational':hasIncident?'degraded':'unknown'
 useEffect(()=>{
  if(!open)return
  const outside=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))setOpen(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);trigger.current?.focus()}}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape)
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}
 },[open])
 return <div className="synapse-status" ref={ref} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
  <button type="button" className="synapse-status-trigger" ref={trigger} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><span className="synapse-status-dot" data-status={overall}/><span>{allUp?'Sistemas Operativos':hasIncident?'Incidencia de servicios':'Estado de servicios'}</span><Icon name="chevron" size={13} style={{transform:open?'rotate(-90deg)':'rotate(90deg)'}}/></button>
  {open&&<section id={id} className="synapse-status-popup" aria-label="Estado de servicios"><header><strong><span className="synapse-status-dot" data-status={overall}/> ESTADO DE SERVICIOS</strong><span className="synapse-status-summary" data-status={overall}>{allUp?'100% UP':hasIncident?'INCIDENCIA':'SIN VERIFICAR'}</span></header>{preview&&<p className="synapse-status-note">Datos de ejemplo de la vista de diseño.</p>}<ul>{services.map(service=><li key={service.id}><span><Icon name={icons[service.id]??'server'} size={15}/>{service.name}</span><span>{service.latencyMs!==undefined&&<small>{service.latencyMs}ms</small>}<span className="synapse-status-dot" data-status={service.status} role="img" aria-label={service.name+': '+labels[service.status]} title={labels[service.status]}/></span></li>)}</ul>{error&&<p role="status" className="synapse-status-note">{error}</p>}<footer>{updatedAt?'Actualizado: '+new Date(updatedAt).toLocaleTimeString('es-PE'):'Sin comprobación en vivo'}<button type="button" onClick={()=>{setOpen(false);trigger.current?.focus()}}>Cerrar</button></footer></section>}
 </div>
}
