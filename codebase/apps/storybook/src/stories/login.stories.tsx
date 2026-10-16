import type {Meta,StoryObj} from '@storybook/react'
import {SynapseLogin,platformServices} from '@bi-analytics/design-system'
const meta={id:'synapse-login',title:'Pages/Synapse Login',component:SynapseLogin,parameters:{layout:'fullscreen'},tags:['autodocs']} satisfies Meta<typeof SynapseLogin>
export default meta
export const SinConfigurar:StoryObj<typeof meta>={args:{onLogin:async()=>{throw new Error('El acceso SSO aún no está configurado.')},services:platformServices}}
export const ReferenciaVisual:StoryObj<typeof meta>={args:{onLogin:async()=>{throw new Error('Vista de diseño: configura el acceso SSO en la aplicación.')},services:platformServices.map((s,i)=>({...s,status:'operational',latencyMs:[12,24,18,35,8,5][i]})),previewStatus:true}}
export const Incidencia:StoryObj<typeof meta>={args:{onLogin:async()=>{throw new Error('El proveedor de identidad no está disponible. Intenta más tarde.')},services:platformServices.map(s=>({...s,status:s.id==='keycloak'?'unavailable':'operational'})),previewStatus:true}}
