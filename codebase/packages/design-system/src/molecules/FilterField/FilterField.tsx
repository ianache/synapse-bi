import type { ReactNode, SelectHTMLAttributes } from 'react'
export function FilterField({ label, children, ...props }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) { return <label>{label}<select {...props} aria-label={label}>{children}</select></label> }
