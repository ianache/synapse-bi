import {useEffect,useRef,type ReactNode} from 'react'
export function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) {
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const element=ref.current;const previous=document.activeElement as HTMLElement|null;element?.showModal();return()=>{element?.close();previous?.focus()}},[])
 return <dialog ref={ref} className="bi-modal" aria-label={title} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose()}}>{children}</dialog>
}
