import type {ReactNode} from 'react'
import {Icon} from '../../atoms/Icon/Icon'
export type ListItemProps = {title:string;subtitle?:string;meta?:string;leading?:ReactNode;trailing?:ReactNode;onClick?:()=>void}
export function ListItem({title,subtitle,meta,leading,trailing,onClick}:ListItemProps) {
 const content=<><span className="bi-list-icon">{leading}</span><span className="bi-list-copy"><strong>{title}</strong><small>{subtitle}</small></span>{meta?<span className="bi-list-meta">{meta}</span>:trailing??<Icon name="chevron" size={14}/>}</>
 return onClick?<button className="bi-list-item" data-interactive="true" onClick={onClick} type="button">{content}</button>:<div className="bi-list-item">{content}</div>
}
