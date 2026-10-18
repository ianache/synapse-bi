import {Icon} from '../../atoms/Icon/Icon'
import {NavigationLink} from '../navigation/NavigationLink'
import type {MainbarProps} from '../navigation/types'
import '../navigation/navigation.css'

export function Mainbar({breadcrumbs, actions = [], profile, menubarId, mobileMenuOpen, onMobileMenuToggle, onNavigate, className = ''}: MainbarProps) {
  const identity = profile?.name.trim() ? profile : undefined
  const profileContent = identity && <>
    <span className="bi-navigation-avatar" aria-hidden="true">{identity.initials ?? identity.name.trim().split(/\s+/).slice(0,2).map(word => Array.from(word)[0]).join('').toUpperCase()}</span>
    <span className="bi-navigation-profile-copy"><strong>{identity.name}</strong>{identity.description && <small>{identity.description}</small>}</span>
    {identity.onAction && !identity.unavailableReason && <Icon name="chevron" size={12} className="bi-navigation-profile-chevron"/>}
  </>
  return <header className={'bi-mainbar ' + className}>
    <button className="bi-navigation-toggle" type="button" aria-label={mobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
      aria-controls={menubarId} aria-expanded={mobileMenuOpen} onClick={onMobileMenuToggle}><Icon name="menu" size={18}/></button>
    <nav className="bi-navigation-breadcrumbs" aria-label="Ruta de navegación" tabIndex={0}>
      <ol>{breadcrumbs.map((item, index) => <li key={item.id}>
        {index > 0 && <Icon name="chevron" size={10}/>}
        {item.href && index < breadcrumbs.length - 1
          ? <NavigationLink href={item.href} onNavigate={onNavigate}>{index === 0 && <Icon name="home" size={12}/>}<span>{item.label}</span></NavigationLink>
          : <span aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{item.label}</span>}
      </li>)}</ol>
    </nav>
    <div className="bi-navigation-tools">
      {actions.map(action => {
        const unavailable = Boolean(action.unavailableReason) || !action.onAction
        const label = action.label + (unavailable ? ' · no disponible' : '')
        return <button key={action.id} type="button" className="bi-navigation-tool" aria-label={label}
          disabled={unavailable} title={action.unavailableReason ?? action.label} onClick={action.onAction}>
          {action.icon ? <Icon name={action.icon} size={14}/> : action.label}
        </button>
      })}
      {actions.length > 0 && <span className="bi-navigation-divider" aria-hidden="true"/>}
      {identity ? identity.onAction && !identity.unavailableReason
        ? <button className="bi-navigation-profile" type="button" onClick={identity.onAction} aria-label={'Perfil de ' + identity.name}>{profileContent}</button>
        : <div className="bi-navigation-profile" title={identity.unavailableReason}>{profileContent}</div>
        : <span className="bi-navigation-no-profile">Perfil no disponible</span>}
    </div>
  </header>
}
