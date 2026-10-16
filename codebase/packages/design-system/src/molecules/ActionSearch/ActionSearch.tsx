import {useState,type FormEvent} from 'react'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'
import { Icon } from '../../atoms/Icon/Icon'
export type ActionSearchProps = {value?:string;onChange?:(value:string)=>void;onSubmit:(value:string)=>void;placeholder?:string;label?:string;actionLabel?:string}
export function ActionSearch({value,onChange,onSubmit,placeholder='Buscar registros…',label='Buscar registros',actionLabel='Filtrar'}:ActionSearchProps) {
 const [internal,setInternal]=useState('')
 const current=value??internal
 function submit(event:FormEvent){event.preventDefault();onSubmit(current)}
 return <form className="bi-action-search" aria-label={label} onSubmit={submit}><Icon name="search" style={{color:'#94a3b8',flexShrink:0}}/><Input aria-label={label} value={current} placeholder={placeholder} onChange={e=>{setInternal(e.target.value);onChange?.(e.target.value)}}/><Button variant="secondary" type="submit">{actionLabel}</Button></form>
}
