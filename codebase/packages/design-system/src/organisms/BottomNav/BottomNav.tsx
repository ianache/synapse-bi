import {Icon,type IconName} from '../../atoms/Icon/Icon'
export type BottomNavItem = {label:string;href:string;icon?:string}
export type BottomNavProps = {items:BottomNavItem[];activeHref?:string;onNavigate?:(href:string)=>void;actionLabel?:string;onAction?:()=>void;fixed?:boolean}
export function BottomNav({items,activeHref,onNavigate,actionLabel='Crear',onAction,fixed=true}:BottomNavProps) {
 const midpoint=Math.ceil(items.length/2)
 const links=items.map(item=><a key={item.href} href={item.href} aria-current={activeHref===item.href?'page':undefined} onClick={e=>{if(onNavigate){e.preventDefault();onNavigate(item.href)}}}><Icon name={(['home','chart','bell','user'].includes(item.icon??'')?item.icon:'user') as IconName} size={20}/>{item.label}</a>)
 return <nav className="bi-bottom-nav" aria-label="Mobile navigation" style={fixed?{position:'fixed',bottom:0,left:0,right:0,zIndex:20}:undefined}>{links.slice(0,midpoint)}<button type="button" className="bi-nav-action" aria-label={actionLabel} onClick={onAction}>+</button>{links.slice(midpoint)}</nav>
}
