import {useId, useState} from 'react'
import type {Meta, StoryObj} from '@storybook/react'
import {Mainbar, Menubar, type MainbarProps} from '@bi-analytics/design-system'
import {demoBrand, demoGroups, demoActions, demoProfile, NavigationPreview} from '../../../../packages/design-system/src/templates/ComponentKitShowcase/NavigationPreview'

function MainbarExample(args: MainbarProps) {
  const id=useId(), [open,setOpen]=useState(false)
  return <>{open ? <Menubar id={id} brand={demoBrand} groups={demoGroups} mobileOpen onMobileClose={()=>setOpen(false)}
    onNavigate={()=>setOpen(false)}/> : <span id={id} hidden/>}
    <Mainbar {...args} menubarId={id} mobileMenuOpen={open} onMobileMenuToggle={()=>setOpen(value=>!value)}/></>
}
const meta={title:'Organisms/Navigation/Mainbar',component:Mainbar,tags:['autodocs'],render:args=><MainbarExample {...args}/>,
  args:{breadcrumbs:[{id:'home',label:'Inicio'},{id:'governance',label:'Gobernanza semántica'},{id:'models',label:'Modelos semánticos'},{id:'detail',label:'Detalle de Relaciones'}],
    actions:demoActions,profile:demoProfile,menubarId:'example-navigation',mobileMenuOpen:false,onMobileMenuToggle:()=>undefined},
} satisfies Meta<typeof Mainbar>
export default meta
type Story=StoryObj<typeof meta>
export const Desktop: Story={}
export const LongBreadcrumbs: Story={args:{breadcrumbs:[{id:'home',label:'Inicio'},{id:'model',label:'Modelo / Operaciones regionales con nombre extendido'},{id:'detail',label:'Comparación de borradores y relaciones semánticas'}]}}
export const MissingProfile: Story={args:{profile:undefined}}
export const UnavailableActions: Story={args:{actions:demoActions}}
export const Combined: Story={render:()=><NavigationPreview/>}
