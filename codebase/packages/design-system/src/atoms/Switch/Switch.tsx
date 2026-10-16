import type { InputHTMLAttributes } from 'react'
export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string }
export function Switch({label, className = '', ...props}: SwitchProps) {
 const control = <input {...props} type="checkbox" role="switch" className={`bi-switch ${className}`} />
 return label ? <label style={{display:'inline-flex',alignItems:'center',gap:8}}>{control}{label}</label> : control
}
