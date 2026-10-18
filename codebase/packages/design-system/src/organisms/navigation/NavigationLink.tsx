import type {AnchorHTMLAttributes} from 'react'

export function NavigationLink({href, onNavigate, onClick, ...props}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string; onNavigate?: (href: string) => void
}) {
  return <a {...props} href={href} onClick={event => {
    onClick?.(event)
    if (!event.defaultPrevented && onNavigate && event.button === 0 && !event.metaKey && !event.ctrlKey &&
        !event.shiftKey && !event.altKey && (!props.target || props.target === '_self') && !props.download &&
        href.startsWith('/') && !href.startsWith('//')) {
      event.preventDefault()
      onNavigate(href)
    }
  }}/>
}
