import type { HTMLAttributes } from 'react'
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {tone?: 'primary'|'slate'|'success'|'warning'|'error'|'neutral'}
export function Badge({tone = 'neutral', className = '', ...props}: BadgeProps) {
 return <span {...props} className={`bi-badge ${className}`} data-tone={tone} />
}
