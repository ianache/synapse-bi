import {useEffect, useRef, useState, type RefObject} from 'react'

// Native dialogs supply browser top-layer/inert semantics. Own only this scroll lock.
let scrollLock: {count: number; original: string; observer?: MutationObserver} | undefined
function lockScroll() {
  if (!scrollLock) scrollLock = {count: 0, original: document.body.style.overflow}
  const lock = scrollLock
  lock.observer?.disconnect()
  lock.count++
  document.body.style.overflow = 'hidden'
  return () => {
    lock.count--
    const restore = () => {
      if (lock.count || document.querySelector('dialog[open]')) return
      lock.observer?.disconnect()
      if (document.body.style.overflow === 'hidden') document.body.style.overflow = lock.original
      if (scrollLock === lock) scrollLock = undefined
    }
    restore()
    if (scrollLock === lock && !lock.count) {
      lock.observer = new MutationObserver(restore)
      lock.observer.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['open']})
    }
  }
}
export function useMenubarDrawer({open, panelRef, onClose}: {
  open: boolean; panelRef: RefObject<HTMLElement | null>; onClose: () => void
}): {isMobile: boolean} {
  const [isMobile, setMobile] = useState(() => typeof window.matchMedia === 'function' ? !window.matchMedia('(min-width: 1024px)').matches : false)
  const latest = useRef({open, onClose})
  latest.current = {open, onClose}
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(min-width: 1024px)')
    const change = () => {
      setMobile(!query.matches)
      if (query.matches && latest.current.open) latest.current.onClose()
    }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!isMobile || !open) return
    const dialog = panelRef.current as HTMLDialogElement | null
    if (!dialog) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    const unlock = lockScroll()
    const otherDialog = () => [...document.querySelectorAll('dialog[open]')].some(el => el !== dialog)
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hidden && !el.closest('[hidden],[inert]'))
    const first = () => focusable()[0] ?? dialog
    first().focus()
    const keydown = (event: KeyboardEvent) => {
      if (otherDialog()) return
      if (event.key === 'Escape') {event.preventDefault(); event.stopPropagation(); latest.current.onClose(); return}
      if (event.key !== 'Tab') return
      const items = focusable(), start = items[0], end = items.at(-1)
      if (!start) {event.preventDefault(); dialog.focus(); return}
      if (event.shiftKey && (document.activeElement === start || document.activeElement === dialog)) {event.preventDefault(); end?.focus()}
      else if (!event.shiftKey && document.activeElement === end) {event.preventDefault(); start.focus()}
    }
    const focus = (event: FocusEvent) => {if (!otherDialog() && event.target instanceof Node && !dialog.contains(event.target)) first().focus()}
    document.addEventListener('keydown', keydown, true)
    document.addEventListener('focusin', focus)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      document.removeEventListener('focusin', focus)
      dialog.close()
      unlock()
      if (!otherDialog() && previous?.isConnected) previous.focus()
    }
  }, [isMobile, open, panelRef])
  return {isMobile}
}
