import type { InputHTMLAttributes } from 'react'
export function Input({className = '', ...props}: InputHTMLAttributes<HTMLInputElement>) {
 return <input {...props} className={`bi-input ${className}`} />
}
