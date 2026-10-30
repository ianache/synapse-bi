import { Icon } from '@bi-analytics/design-system'
import './dashboard-interactive.css'

export function DashboardUnavailable() {
  return <section className="interactive-unavailable" aria-labelledby="dashboard-unavailable-title">
    <div className="interactive-unavailable-card">
      <span className="interactive-unavailable-icon"><Icon name="lock" size={32} /></span>
      <h1 id="dashboard-unavailable-title">No se puede acceder a este dashboard</h1>
      <p>El recurso solicitado no está disponible o no cuentas con los permisos necesarios para consultarlo.</p>
      <div className="interactive-unavailable-actions"><a href="/dashboards"><Icon name="arrow-left" size={18} />Volver a dashboards</a><a href="/"><Icon name="home" size={18} />Ir al inicio</a></div>
    </div>
  </section>
}
