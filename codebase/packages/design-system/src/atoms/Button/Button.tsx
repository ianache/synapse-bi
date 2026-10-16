import type { ButtonHTMLAttributes } from 'react'
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'tonal'; loading?: boolean }
export function Button({ variant = 'primary', loading = false, children, className = '', ...props }: ButtonProps) {
  return <button {...props} type={props.type ?? 'button'} className={`bi-button ${className}`} data-variant={variant} aria-busy={loading || undefined} aria-label={props['aria-label'] ?? (typeof children === 'string' ? children : undefined)}>{loading ? <><span aria-hidden="true">◌</span> {children}</> : children}</button>
}
