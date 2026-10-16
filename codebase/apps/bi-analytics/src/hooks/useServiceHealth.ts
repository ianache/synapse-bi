import {useEffect,useState} from 'react'
import {platformServices,type ServiceHealth} from '@bi-analytics/design-system'

export function parseServiceHealth(payload:unknown):ServiceHealth[] {
 if(!payload||typeof payload!=='object'||!('services' in payload)||!Array.isArray(payload.services))throw new Error('Respuesta de estado inválida')
 const values=payload.services
 return platformServices.map(service=>{
  const source=values.find(item=>item&&typeof item==='object'&&item.id===service.id)
  const status=source&&['operational','degraded','unavailable','unknown'].includes(source.status)?source.status:'unknown'
  return {...service,status,latencyMs:typeof source?.latencyMs==='number'&&Number.isFinite(source.latencyMs)&&source.latencyMs>=0?source.latencyMs:undefined}
 })
}

export function useServiceHealth(endpoint?:string) {
 const [state,setState]=useState<{services:ServiceHealth[];updatedAt?:string;error?:string}>({services:platformServices})
 useEffect(()=>{
  setState({services:platformServices})
  if(!endpoint)return
  let active=true,pending=false,controller:AbortController|undefined
  async function refresh(){
   if(pending)return
   pending=true;controller=new AbortController()
   const timeout=setTimeout(()=>controller?.abort(),10000)
   try{
    const response=await fetch(endpoint!,{signal:controller.signal,credentials:'same-origin',headers:{Accept:'application/json'}})
    if(!response.ok)throw new Error('Estado no disponible')
    const services=parseServiceHealth(await response.json())
    if(active)setState({services,updatedAt:new Date().toISOString()})
   }catch{if(active)setState({services:platformServices,error:'No se pudo verificar el estado de los servicios.'})}
   finally{clearTimeout(timeout);pending=false}
  }
  void refresh()
  const interval=setInterval(()=>void refresh(),30000)
  return()=>{active=false;clearInterval(interval);controller?.abort()}
 },[endpoint])
 return state
}
