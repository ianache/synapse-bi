import { useEffect, useRef, type InputHTMLAttributes } from 'react'
export type ChoiceProps = InputHTMLAttributes<HTMLInputElement> & {indeterminate?:boolean}
export function Checkbox({indeterminate=false,className='',...props}: ChoiceProps) {
 const ref=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(ref.current) ref.current.indeterminate=indeterminate},[indeterminate])
 return <input {...props} ref={ref} type="checkbox" aria-checked={indeterminate?'mixed':undefined} className={`bi-choice ${className}`} />
}
export function Radio({indeterminate:_,className='',...props}: ChoiceProps) {
 return <input {...props} type="radio" className={`bi-choice ${className}`} />
}
