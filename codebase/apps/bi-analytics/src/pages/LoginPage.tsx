import {useEffect} from 'react'
import {SynapseLogin} from '@bi-analytics/design-system'
import {resolveEndpoint} from '../auth/loginConfig'
import {useServiceHealth} from '../hooks/useServiceHealth'

const env=(import.meta as ImportMeta&{env?:Record<string,string|undefined>}).env??{}
export function LoginPage() {
 useEffect(()=>{const previous=document.title;document.title='Synapse BI · Inicio de sesión';return()=>{document.title=previous}},[])
 let loginUrl:string|undefined,statusUrl:string|undefined,configurationError:string|undefined
 try{loginUrl=resolveEndpoint(env.VITE_AUTH_LOGIN_URL,window.location.origin);statusUrl=resolveEndpoint(env.VITE_SERVICE_STATUS_URL,window.location.origin)}catch(reason){configurationError=reason instanceof Error?reason.message:'Configuración inválida.'}
 const health=useServiceHealth(statusUrl)
 async function login(){
  if(configurationError)throw new Error(configurationError)
  if(!loginUrl)throw new Error('El acceso SSO aún no está configurado. Contacta al administrador de la plataforma.')
  window.location.assign(loginUrl)
 }
 return <SynapseLogin onLogin={login} version={env.VITE_APP_VERSION??'1.0.0'} services={health.services} statusError={configurationError??health.error} updatedAt={health.updatedAt}/>
}
