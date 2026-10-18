import {useRef, type MouseEvent} from 'react'
import {Icon} from '../../atoms/Icon/Icon'
import {useMenubarDrawer} from './useMenubarDrawer'
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
export function Menubar({id, brand, groups, activeItemId, quickAction, utilityActions, organization, className = '', onNavigate, mobileOpen, onMobileClose}: MenubarProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const {isMobile} = useMenubarDrawer({open: mobileOpen, panelRef: ref, onClose: onMobileClose})
  const closeForNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && !event.defaultPrevented && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) onMobileClose()
  }
  const content = <>
    {isMobile && <button type="button" className="bi-navigation-close" aria-label="Cerrar navegación" onClick={onMobileClose}>×</button>}
    <NavigationLink className="bi-navigation-brand" href={brand.href} onNavigate={onNavigate} onClick={closeForNavigation}>
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
          : <NavigationLink key={item.id} className="bi-navigation-item" href={item.href!} onNavigate={onNavigate} onClick={closeForNavigation}
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
  </>
  if (isMobile) return <dialog ref={ref} id={id} className={'bi-menubar bi-menubar-drawer ' + className}
    aria-label="Navegación principal" aria-modal="true" tabIndex={-1}
    onCancel={event => {event.preventDefault(); onMobileClose()}}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const rect = event.currentTarget.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onMobileClose()
    }}>{content}</dialog>
  return <aside id={id} className={'bi-menubar ' + className} aria-label="Espacio de trabajo">{content}</aside>
}
