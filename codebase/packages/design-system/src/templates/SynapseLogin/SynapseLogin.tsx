import {useState} from 'react'
import {Button} from '../../atoms/Button/Button'
import {Icon} from '../../atoms/Icon/Icon'
import {ServiceStatus,type ServiceHealth} from '../../organisms/ServiceStatus/ServiceStatus'
import './login.css'

export type SynapseLoginProps={onLogin:()=>void|Promise<void>;version?:string;services?:ServiceHealth[];statusError?:string;updatedAt?:string;previewStatus?:boolean;assetBase?:string}

export function SynapseLogin({onLogin,version='1.0.0',services,statusError,updatedAt,previewStatus=false,assetBase='/assets/login'}:SynapseLoginProps) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 async function login(){if(busy)return;setError('');setBusy(true);try{await onLogin()}catch(reason){setError(reason instanceof Error?reason.message:'No se pudo iniciar la autenticación. Inténtalo nuevamente.')}finally{setBusy(false)}}
 return <main className="bi-root synapse-login theme-light">
  <section className="synapse-login-panel" aria-label="Acceso a Synapse BI">
   <div className="synapse-login-content">
    <header className="synapse-brand"><div className="synapse-brand-logo"><img src={assetBase+'/synapse-logo.png'} alt=""/></div><div><div className="synapse-brand-name">Synapse<span>BI</span><small>AI SUITE</small></div><p>Enterprise Analytics & Intelligence</p></div></header>
    <div className="synapse-welcome"><h1>Bienvenido al portal analítico</h1><p>Inicia sesión a través de la identidad federada corporativa para acceder a tus cuadros de mando y modelos de IA en tiempo real.</p></div>
    <div className="synapse-login-action"><Button className="synapse-login-button" onClick={login} disabled={busy} loading={busy}><Icon name="key" size={20}/><span>{busy?'Redirigiendo a Red Hat Keycloak…':'Iniciar sesión con Red Hat Keycloak'}</span></Button>{error&&<p role="alert" className="synapse-login-error">{error}</p>}<div className="synapse-security"><Icon name="lock" size={16}/><p>Autenticación OpenID Connect (OIDC) protegida con MFA institucional y bóveda criptográfica.</p></div></div>
   </div>
   <footer className="synapse-login-footer"><div className="synapse-version"><span>Versión</span><strong>v{version}</strong></div><ServiceStatus services={services} error={statusError} updatedAt={updatedAt} preview={previewStatus}/></footer>
  </section>
  <section className="synapse-hero" aria-label="Plataforma BI Analytics con inteligencia artificial">
   <div className="synapse-hero-grid"/>
   <header className="synapse-hero-top"><div className="synapse-engine-pill"><span className="synapse-engine-dot"/><span>Motor Predictivo Activo: <strong>v4.2 Neural Analytics</strong></span><span className="synapse-pill-divider">|</span><span className="synapse-sla">99.98% Latency SLA</span></div><span className="synapse-telemetry">Telemetry Stream · Real-time</span></header>
   <div className="synapse-hero-center"><figure className="synapse-hero-window" aria-label="Ilustración de referencia: dashboard predictivo con datos demostrativos"><div className="synapse-window-bar"><div className="synapse-window-title"><span className="synapse-window-dots"><i/><i/><i/></span><span>synapse-bi.internal // predictive-copilot-engine</span></div><span className="synapse-live">LIVE TELEMETRY</span></div><img src={assetBase+'/analytics-ai.png'} alt="Visualización BI con gráficos predictivos y redes de inteligencia artificial" fetchPriority="high"/></figure></div>
   <footer className="synapse-capabilities"><div><h2>Modelado Predictivo</h2><p>Detección de patrones complejos y pronóstico de series temporales en segundos.</p></div><div><h2>Procesamiento Distribuido</h2><p>Integración de petabytes de telemetría y lago de datos con baja latencia.</p></div><div><h2>Gobernanza & Cifrado</h2><p>RBAC granular con HashiCorp Vault y autenticación estricta con Keycloak.</p></div></footer>
  </section>
 </main>
}
