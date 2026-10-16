import type { ReactNode } from 'react'
export function FilterBar({ children }: { children: ReactNode }) { return <div role="group" aria-label="Filters" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{children}</div> }
