import type {ReactNode} from 'react'
export type KpiCardProps = {label:string;value:string|number;detail?:string;trend?:string;icon?:ReactNode}
export function KpiCard({label,value,detail,trend,icon}:KpiCardProps) {
 return <article className="bi-kpi" aria-label={label}><div className="bi-kpi-label"><span>{label}</span><span aria-hidden="true">{icon}</span></div><strong>{value}</strong><small>{trend? '↑ '+trend : '●'} {detail}</small></article>
}
