import {useState,type ReactNode} from 'react'
import {Button,Input,Switch,Checkbox,Badge,Avatar,Icon} from '../../atoms'
import {ActionSearch,KpiCard,ListItem} from '../../molecules'
import {AdvancedDataTable} from '../../organisms/AdvancedDataTable/AdvancedDataTable'
import {ProfileCard} from '../../organisms/ProfileCard/ProfileCard'
import {BottomNav} from '../../organisms/BottomNav/BottomNav'
import type {DataTableColumn} from '../../organisms/DataTable/DataTable'
import {Modal} from '../../patterns/Modal'
import {NavigationPreview} from './NavigationPreview'

function Panel({title,tag,wide,children}:{title:string;tag?:string;wide?:boolean;children:ReactNode}) {
 return <article className={'bi-kit-panel'+(wide?' wide':'')}><header className="bi-kit-panel-head"><h3>{title}</h3>{tag&&<small>{tag}</small>}</header>{children}</article>
}
function Section({title,description,children,id}:{title:string;description:string;children:ReactNode;id?:string}) {
 return <section className="bi-kit-section" id={id}><header className="bi-kit-section-title"><h2><span className="bi-kit-dot"/>{title}</h2><span>{description}</span></header>{children}</section>
}
type Transaction={id:string;name:string;email:string;date:string;time:string;amount:number;status:string}
const initialRows:Transaction[]=[
 {id:'TX-901',name:'Ana Rivas',email:'ana.rivas@cloud.com',date:'24 May 2025',time:'14:10:22',amount:520,status:'Pagado'},
 {id:'TX-902',name:'Marcos Soler',email:'m.soler@corp.net',date:'24 May 2025',time:'12:45:10',amount:1180.5,status:'Pendiente'},
 {id:'TX-903',name:'Laura Paz',email:'laura.p@logistics.es',date:'23 May 2025',time:'19:20:05',amount:89,status:'Pagado'},
 {id:'TX-904',name:'Diego Rivera',email:'diego.r@innovate.org',date:'22 May 2025',time:'09:15:40',amount:2450,status:'Cancelado'},
 {id:'TX-905',name:'Elena Morales',email:'elena.m@digital.io',date:'21 May 2025',time:'18:02:11',amount:730.25,status:'Pagado'},
 {id:'TX-906',name:'Pablo Torres',email:'p.torres@cloud.com',date:'20 May 2025',time:'10:30:00',amount:325,status:'Pendiente'},
 {id:'TX-907',name:'Sofía García',email:'sofia@cloud.com',date:'19 May 2025',time:'08:40:00',amount:840,status:'Pagado'},
 {id:'TX-908',name:'Luis Medina',email:'luis@cloud.com',date:'18 May 2025',time:'16:20:00',amount:120,status:'Cancelado'}
]
export function ComponentKitShowcase() {
 const [notice,setNotice]=useState(''),[active,setActive]=useState('#inicio'),[rows,setRows]=useState(initialRows)
 const [dialog,setDialog]=useState<Transaction|null>(null),[create,setCreate]=useState(false)
 const columns:DataTableColumn<Transaction>[]=[
  {key:'name',label:'CLIENTE / USUARIO',render:(_,r)=><div className="bi-table-user"><Avatar name={r.name} size="sm" style={{background:r.status==='Pagado'?'#fef2f2':'#f1f5f9',color:r.status==='Pagado'?'#991b1b':'#475569'}}/><div><strong>{r.name}</strong><small>{r.email} · ID: #{r.id}</small></div></div>},
  {key:'date',label:'FECHA & HORA',render:(_,r)=><div className="bi-table-date">{r.date}<small>{r.time} hrs</small></div>},
  {key:'amount',label:'MONTO (USD)',render:v=><strong>{Number(v).toLocaleString('en-US',{style:'currency',currency:'USD'})}</strong>},
  {key:'status',label:'ESTADO DE PAGO',render:v=><Badge tone={v==='Pagado'?'success':v==='Pendiente'?'warning':'error'}>{v==='Pagado'?'✓':v==='Pendiente'?'◷':'×'} {String(v)}</Badge>},
  {key:'id',label:'ACCIONES',render:(_,r)=><div className="bi-table-actions"><button aria-label={'Detalle de '+r.name} onClick={()=>setDialog(r)}><Icon name="eye"/></button><button aria-label={'Descargar comprobante de '+r.name} onClick={()=>{const url=URL.createObjectURL(new Blob([r.id+'\n'+r.name+'\nUSD '+r.amount],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=r.id+'.txt';a.click();URL.revokeObjectURL(url)}}><Icon name="download"/></button></div>}
 ]
 return <div className="bi-root bi-kit theme-light">
  <header className="bi-kit-header"><div className="bi-kit-logo">AD</div><div><h1>Biblioteca Atómica de Componentes</h1><p>Atomic Design System · Guía de Interfaz & Organismos</p></div><div className="bi-kit-status">● Sistema Activo v2.0 <span style={{color:'#94a3b8',marginLeft:8}}>Desktop & Web</span></div></header>
  <main className="bi-kit-main">
   <aside className="bi-kit-intro"><Icon name="layers" size={28} style={{color:'#991b1b',flexShrink:0}}/><div><strong>METODOLOGÍA ATÓMICA</strong><p>Estructura de componentes modulares conformada por <b>Átomos</b> (tokens y controles indivisibles), <b>Moléculas</b> (uniones funcionales) y <b>Organismos</b> (módulos completos y tablas de datos con ordenamiento y paginación).</p></div><a href="#organismo-tabla">▦ Ir a Organismo Tabla</a></aside>
   <Section title="1. ÁTOMOS (ATOMS)" description="Elementos indivisibles"><div className="bi-kit-grid">
    <Panel title="Botones (Buttons)" tag="Tokens de Acción" wide><div className="bi-kit-buttons"><Button><Icon name="check"/> Botón Primario (#991b1b)</Button><Button variant="secondary"><Icon name="arrow"/> Secundario (#374151)</Button><Button variant="outline"><Icon name="bookmark"/> Outline</Button><Button variant="tonal">Tonal Red</Button></div></Panel>
    <Panel title="Inputs & Campos de Texto" tag="Estados de Foco" wide><div className="bi-kit-inputs"><label>Campo estándar<Input placeholder="Escribe aquí…"/></label><label>Estado activo / foco<Input defaultValue="Texto ingresado" data-focus="true"/></label></div></Panel>
    <Panel title="Interruptores & Switches"><div className="bi-kit-control-row"><div>Notificaciones push<small>Alertas en tiempo real</small></div><Switch aria-label="Notificaciones push" defaultChecked/></div><div className="bi-kit-control-row"><div>Modo silencioso<small>Desactivar sonido</small></div><Switch aria-label="Modo silencioso"/></div></Panel>
    <Panel title="Casillas de Selección (Checkboxes)"><div className="bi-kit-choices"><label><Checkbox defaultChecked/>Acepto términos y condiciones</label><label><Checkbox/>Recordar sesión</label><label><Checkbox indeterminate/>Selección parcial</label></div></Panel>
    <Panel title="Badges & Avatares"><div className="bi-kit-badges"><Badge tone="primary">● Primario</Badge><Badge tone="slate">● Gris 700</Badge><Badge tone="success">✓ Pagado</Badge><Badge tone="warning">◷ Pendiente</Badge></div><div className="bi-kit-avatars"><small>Avatares:</small><Avatar name="María González" size="sm"/><Avatar name="Usuario" size="sm" style={{background:'#374151'}}/><Avatar name="Empresa" size="sm" style={{background:'#f1f5f9',color:'#374151'}}/></div></Panel>
   </div></Section>
   <Section title="2. MOLÉCULAS (MOLECULES)" description="Combinaciones funcionales"><div className="bi-kit-grid">
    <Panel title="Búsqueda con Acción" tag="Search Molecule"><p style={{fontSize:12,color:'#94a3b8',margin:'0 0 16px'}}>Input con icono integrado y botón secundario de activación.</p><ActionSearch onSubmit={value=>setNotice(value?'Búsqueda: '+value:'Introduce un término para buscar')}/></Panel>
    <Panel title="Tarjetas de Métricas (KPIs)" tag="Stat Card"><div className="bi-kpi-grid"><KpiCard label="Ingresos" value="$14,250" trend="+12%" icon={<span style={{color:'#991b1b'}}>$</span>}/><KpiCard label="Activos" value="1,280" detail="98 online" icon={<Icon name="users" size={14}/>}/></div></Panel>
    <Panel title="Fila de Lista (ListItem)" tag="Navigation Cell"><ListItem title="Factura #4029" subtitle="Hoy, 14:32" meta="$340.00" leading={<Icon name="receipt"/>}/><ListItem title="Envío #1184" subtitle="En ruta" leading={<Icon name="box"/>} onClick={()=>setNotice('Envío #1184 · En ruta')}/></Panel>
   </div></Section>
   <Section title="3. ORGANISMOS (ORGANISMS)" description="5 Componentes" id="organismo-tabla"><div style={{marginBottom:20}}><AdvancedDataTable title="Tabla de Datos Avanzada con Ordenamiento (Asc/Desc) y Paginación" total={rows.length} rows={rows} columns={columns} onCreate={()=>setCreate(true)}/></div><NavigationPreview/><div className="bi-kit-grid"><div style={{gridColumn:'span 2'}} className="bi-profile-span"><ProfileCard name="Carlos Rodríguez" role="Diseñador de Producto · Lead UI/UX" description="Especialista en sistemas de diseño escalables, Atomic Design y metodologías de tokens accesibles para web y móvil." onViewProfile={()=>setNotice('Carlos Rodríguez · Diseñador de Producto · Lead UI/UX')}/></div><article className="bi-kit-panel" style={{gridColumn:'span 4'}}><header className="bi-kit-panel-head"><h3>Navegación Móvil Inferior (Bottom Bar)</h3><small>Navigation Organism</small></header><p style={{fontSize:12,color:'#94a3b8'}}>Estructura con navegación fija para dispositivos móviles y botón flotante central de acción rápida.</p><div className="bi-nav-preview"><BottomNav fixed={false} items={[{label:'Inicio',href:'#inicio',icon:'home'},{label:'Métricas',href:'#metricas',icon:'chart'},{label:'Avisos',href:'#avisos',icon:'bell'},{label:'Perfil',href:'#perfil',icon:'user'}]} activeHref={active} onNavigate={setActive} onAction={()=>setCreate(true)}/></div></article></div></Section>
   <footer className="bi-kit-footer">Atomic Design System Kit · Darkred 700 (#991b1b) & Gris 700 (#374151)<br/>Guía de Componentes Básicos y Organismos</footer>
  </main>
  {notice&&<div role="status" className="bi-toast">{notice}<button aria-label="Cerrar aviso" onClick={()=>setNotice('')}>×</button></div>}
  {(dialog||create)&&<Modal title={create?'Nueva transacción':'Detalle de transacción'} onClose={()=>{setDialog(null);setCreate(false)}}><h2>{create?'Nueva transacción':dialog?.id}</h2>{create?<form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);setRows([...rows,{id:'TX-'+(901+rows.length),name:String(data.get('name')),email:String(data.get('email')),amount:Number(data.get('amount')),status:'Pendiente',date:'16 Oct 2026',time:'00:00:00'}]);setCreate(false);setNotice('Transacción creada')}}><label>Cliente<Input name="name" required autoFocus/></label><label>Email<Input name="email" type="email" required/></label><label>Monto (USD)<Input name="amount" type="number" min="0.01" step="0.01" required/></label><Button type="submit">Guardar transacción</Button></form>:<><p>{dialog?.name}</p><p>{dialog?.email}</p><p>USD {dialog?.amount} · {dialog?.status}</p></>}<Button variant="outline" onClick={()=>{setDialog(null);setCreate(false)}}>Cerrar</Button></Modal>}
 </div>
}
