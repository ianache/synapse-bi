import type { HTMLAttributes } from 'react'
export type AvatarProps = HTMLAttributes<HTMLSpanElement> & { name: string; src?: string; size?: 'sm'|'md'|'lg' }
export function Avatar({name,src,size='md',style,...props}: AvatarProps) {
 const dimension = size==='lg'?72:size==='sm'?30:38
 return <span {...props} role="img" aria-label={name} className="bi-avatar" style={{width:dimension,height:dimension,fontSize:size==='lg'?25:12,...style}}>{src?<img src={src} alt="" />:name.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase()}</span>
}
