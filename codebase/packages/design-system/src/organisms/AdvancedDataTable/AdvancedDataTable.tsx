import {useState} from 'react'
import {Button} from '../../atoms/Button/Button'
import {Icon} from '../../atoms/Icon/Icon'
import {Checkbox} from '../../atoms/Choice/Choice'
import {ActionSearch} from '../../molecules/ActionSearch/ActionSearch'
import type {DataTableColumn} from '../DataTable/DataTable'
export type AdvancedDataTableProps<T extends Record<string,unknown>> = {
 title:string;total:number;columns:DataTableColumn<T>[];rows:T[];page?:number;pageSize?:number;
 onPageChange?:(page:number)=>void;onPageSizeChange?:(size:number)=>void;onFilter?:(value:string)=>void;
 onExport?:()=>void;onCreate?:()=>void;loading?:boolean;empty?:boolean;error?:string
}
export function AdvancedDataTable<T extends Record<string,unknown>>({title,total,columns,rows,page,pageSize:initialSize=5,onPageChange,onPageSizeChange,onFilter,onExport,onCreate,loading,empty,error}:AdvancedDataTableProps<T>) {
 const [query,setQuery]=useState(''),[statusOnly,setStatusOnly]=useState(false)
 const [localPage,setLocalPage]=useState(1),[size,setSize]=useState(initialSize)
 const [sort,setSort]=useState<{key:string;desc:boolean}|null>(null)
 const [selected,setSelected]=useState<T[]>([])
 const remote=!!onPageChange
 const filtered=rows.filter(row=>(onFilter||Object.values(row).some(value=>String(value).toLowerCase().includes(query.toLowerCase())))&&(!statusOnly||row.status==='Pagado'))
 const sorted=sort?[...filtered].sort((a,b)=>{const av=a[sort.key],bv=b[sort.key];const order=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'es');return sort.desc?-order:order}):filtered
 const count=remote?total:sorted.length
 const pages=Math.max(1,Math.ceil(count/size))
 const current=Math.min(page??localPage,pages)
 const visible=remote?sorted:sorted.slice((current-1)*size,current*size)
 function go(next:number){setLocalPage(next);onPageChange?.(next)}
 function exportRows(){
  if(onExport){onExport();return}
  const quote=(value:unknown)=>'"'+String(value??'').replaceAll('"','""')+'"'
  const csv=[columns.map(c=>quote(c.label)).join(','),...sorted.map(row=>columns.map(c=>quote(row[c.key])).join(','))].join('\r\n')
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download='transacciones.csv';a.click();URL.revokeObjectURL(url)
 }
 return <section className="bi-table-card" aria-label={title}>
  <header className="bi-table-banner"><small><Icon name="grid" size={12}/> ORGANISMO PRINCIPAL · Data Table Component</small><h3>{title}</h3></header>
  <div className="bi-table-toolbar"><ActionSearch value={query} onChange={v=>{setQuery(v);setLocalPage(1)}} onSubmit={v=>{onFilter?.(v);setLocalPage(1)}}/><Button variant="outline" aria-pressed={statusOnly} onClick={()=>{setStatusOnly(!statusOnly);setLocalPage(1)}}><Icon name="filter"/> {statusOnly?'Sólo pagados':'Filtros'}</Button><div style={{flex:1}}/><Button variant="outline" onClick={exportRows}><Icon name="download"/> Exportar</Button>{onCreate&&<Button onClick={onCreate}><Icon name="plus"/> Nueva Transacción</Button>}</div>
  <div className="bi-table-scroll"><table className="bi-table"><caption style={{textAlign:'left',padding:'0 24px 12px',fontSize:11,color:'#64748b'}}>{count} registros totales{selected.length>0?' · '+selected.length+' seleccionados':''}</caption><thead><tr><th><Checkbox aria-label="Seleccionar página" checked={visible.length>0&&visible.every(row=>selected.includes(row))} indeterminate={visible.some(row=>selected.includes(row))&&!visible.every(row=>selected.includes(row))} onChange={e=>setSelected(e.target.checked?[...new Set([...selected,...visible])]:selected.filter(row=>!visible.includes(row)))}/></th>{columns.map(c=><th key={c.key} aria-sort={sort?.key===c.key?(sort.desc?'descending':'ascending'):'none'}><button onClick={()=>setSort({key:c.key,desc:sort?.key===c.key?!sort.desc:false})}>{c.label} {sort?.key===c.key?(sort.desc?'↓':'↑'):'↕'}</button></th>)}</tr></thead><tbody>
  {loading?<tr><td colSpan={columns.length+1}>Cargando…</td></tr>:error?<tr><td role="alert" colSpan={columns.length+1}>{error}</td></tr>:empty||!visible.length?<tr><td colSpan={columns.length+1}>Sin resultados</td></tr>:visible.map((row,i)=><tr key={String(row.id??i)}><td><Checkbox aria-label={'Seleccionar '+String(row.name??i+1)} checked={selected.includes(row)} onChange={e=>setSelected(e.target.checked?[...selected,row]:selected.filter(x=>x!==row))}/></td>{columns.map(c=><td key={c.key}>{c.render?c.render(row[c.key],row):String(row[c.key]??'')}</td>)}</tr>)}
  </tbody></table></div>
  <footer className="bi-table-footer"><span>Mostrando <strong>{count?((current-1)*size+1):0} - {Math.min(current*size,count)}</strong> de {count} resultados</span><label>Filas por pág: <select aria-label="Filas por página" value={size} onChange={e=>{const v=Number(e.target.value);setSize(v);go(1);onPageSizeChange?.(v)}}>{[5,10,25,50].map(n=><option key={n} value={n}>{n} por página</option>)}</select></label><nav className="bi-pagination" aria-label="Pagination"><button disabled={current===1} onClick={()=>go(current-1)}>‹ Anterior</button>{Array.from({length:pages},(_,i)=>i+1).filter(n=>n===1||n===pages||Math.abs(n-current)<=1).map((n,i,all)=><span key={n}>{i>0&&n-all[i-1]>1&&<span> … </span>}<button aria-current={n===current?'page':undefined} onClick={()=>go(n)}>{n}</button></span>)}<button disabled={current===pages} onClick={()=>go(current+1)}>Siguiente ›</button></nav></footer>
 </section>
}
