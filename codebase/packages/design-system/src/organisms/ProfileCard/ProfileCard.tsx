import {Avatar} from '../../atoms/Avatar/Avatar'
import {Badge} from '../../atoms/Badge/Badge'
import {Button} from '../../atoms/Button/Button'
export type ProfileCardProps = {name:string;role:string;description?:string;membership?:string;onViewProfile?:()=>void}
export function ProfileCard({name,role,description,membership='Pro Member',onViewProfile}:ProfileCardProps) {
 return <article className="bi-profile"><Avatar name={name} size="lg"/><h3>{name}</h3><p style={{margin:0}}>{role}</p><Badge tone="primary">{membership}</Badge><p>{description}</p><Button onClick={onViewProfile}>Ver Perfil Completo</Button></article>
}
