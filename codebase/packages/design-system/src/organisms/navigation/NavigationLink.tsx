import type {AnchorHTMLAttributes} from 'react'

export function NavigationLink({href, onNavigate, onClick, ...props}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string; onNavigate?: (href: string) => void
}) {
  // Relative paths, queries and fragments are internal too. Keep explicit
  // schemes and network-path references native, including browser URL whitespace.
  const internal = !/^(?:[a-z][a-z\d+.-]*:|[\\/]{2})/i.test(href.trim().replace(/[\t\r\n]/g, ''))
  return <a {...props} href={href} onClick={event => {
    onClick?.(event)
    if (!event.defaultPrevented && onNavigate && event.button === 0 && !event.metaKey && !event.ctrlKey &&
        !event.shiftKey && !event.altKey && (!props.target || props.target === '_self') && !props.download &&
        internal) {
      event.preventDefault()
      onNavigate(href)
    }
  }}/>
}
