import type {IconName} from '../../atoms/Icon/Icon'

export type NavigationItem = {id: string; label: string; icon?: IconName} & (
  {href: string; unavailableReason?: never} | {href?: never; unavailableReason: string}
)
export type NavigationGroup = {id: string; label: string; items: NavigationItem[]}
export type ShellAction = {id: string; label: string; icon?: IconName} & (
  {onAction: () => void; unavailableReason?: never} | {onAction?: never; unavailableReason: string}
)
export type BreadcrumbItem = {id: string; label: string; href?: string}
export type MenubarProps = {
  id: string
  brand: {label: string; subtitle?: string; badge?: string; href: string}
  groups: NavigationGroup[]
  activeItemId?: string
  quickAction?: ShellAction
  utilityActions?: ShellAction[]
  organization?: {name: string; description?: string}
  mobileOpen: boolean
  onMobileClose: () => void
  onNavigate?: (href: string) => void
  className?: string
}
export type MainbarProps = {
  breadcrumbs: BreadcrumbItem[]
  actions?: ShellAction[]
  profile?: {name: string; description?: string; initials?: string; onAction?: () => void; unavailableReason?: string}
  menubarId: string
  mobileMenuOpen: boolean
  onMobileMenuToggle: () => void
  onNavigate?: (href: string) => void
  className?: string
}
