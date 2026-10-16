import type { HTMLAttributes } from 'react'

export function Text({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} style={{ margin: 0, ...props.style }}>{children}</p>
}
