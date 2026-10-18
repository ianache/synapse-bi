import {Icon} from '../../atoms/Icon/Icon'
import {NavigationLink} from '../navigation/NavigationLink'
import type {MenubarProps, ShellAction} from '../navigation/types'
import '../navigation/navigation.css'

function UtilityAction({action, primary = false}: {action: ShellAction; primary?: boolean}) {
  const unavailable = Boolean(action.unavailableReason) || !action.onAction
  return <button type="button" className={primary ? 'bi-navigation-cta' : 'bi-navigation-utility'}
    disabled={unavailable} title={action.unavailableReason} onClick={action.onAction}>
    {action.icon && <Icon name={action.icon}/>}<span>{action.label}{unavailable && ' · no disponible'}</span>
  </button>
}
export function Menubar({id, brand, groups, activeItemId, quickAction, utilityActions, organization, className = '', onNavigate}: MenubarProps) {
  return <aside id={id} className={'bi-menubar ' + className} aria-label="Espacio de trabajo">
    <NavigationLink className="bi-navigation-brand" href={brand.href} onNavigate={onNavigate}>
      <span className="bi-navigation-logo"><Icon name="shapes" size={18}/></span>
      <span className="bi-navigation-brand-copy"><span><strong>{brand.label}</strong>{brand.badge && <small>{brand.badge}</small>}</span>
        {brand.subtitle && <span className="bi-navigation-subtitle">{brand.subtitle}</span>}</span>
    </NavigationLink>
    {quickAction && <UtilityAction action={quickAction} primary/>}
    <nav aria-label="Navegación principal" className="bi-navigation-groups">{groups.map(group =>
      <section key={group.id} className="bi-navigation-group" aria-label={group.label}>
        <h2>{group.label}</h2>
        {group.items.map(item => item.unavailableReason
          ? <span key={item.id} className="bi-navigation-item bi-navigation-unavailable" aria-disabled="true" title={item.unavailableReason}>
            {item.icon && <Icon name={item.icon}/>}<span>{item.label} · no disponible</span></span>
          : <NavigationLink key={item.id} className="bi-navigation-item" href={item.href!} onNavigate={onNavigate}
            aria-current={item.id === activeItemId ? 'page' : undefined}>
            {item.icon && <Icon name={item.icon}/>}<span>{item.label}</span>
            {item.id === activeItemId && <span className="bi-navigation-active-dot" aria-hidden="true"/>}
          </NavigationLink>)}
      </section>)}</nav>
    {(utilityActions?.length || organization) ? <div className="bi-navigation-footer">
      {utilityActions?.map(action => <UtilityAction key={action.id} action={action}/>)}
      {organization && <div className="bi-navigation-organization"><Icon name="building"/><span><strong>{organization.name}</strong>
        {organization.description && <small>{organization.description}</small>}</span></div>}
    </div> : null}
  </aside>
}
