import {useId, useState} from 'react'
import type {Meta, StoryObj} from '@storybook/react'
import {Menubar, type MenubarProps} from '@bi-analytics/design-system'
import {demoBrand, demoGroups} from '../../../../packages/design-system/src/templates/ComponentKitShowcase/NavigationPreview'

function MenubarExample(args: MenubarProps) {
  const id=useId(), [open,setOpen]=useState(args.mobileOpen), [active,setActive]=useState(args.activeItemId)
  return <><button type="button" onClick={()=>setOpen(true)}>Abrir menú de ejemplo</button>
    <Menubar {...args} id={id} activeItemId={active} mobileOpen={open} onMobileClose={()=>setOpen(false)}
      onNavigate={href=>{setActive(args.groups.flatMap(g=>g.items).find(item=>item.href===href)?.id);setOpen(false)}}/></>
}
const meta={title:'Organisms/Navigation/Menubar',component:Menubar,tags:['autodocs'],
  render:args=><MenubarExample {...args}/>,
  args:{id:'example-navigation',brand:demoBrand,groups:demoGroups,activeItemId:'models',mobileOpen:false,onMobileClose:()=>undefined,
    organization:{name:'Organización de demostración',description:'Sin tenant real'},
    quickAction:{id:'query',label:'Nueva consulta SQL/BI',icon:'plus',unavailableReason:'Ejemplo no operativo'}},
} satisfies Meta<typeof Menubar>
export default meta
type Story=StoryObj<typeof meta>
export const Desktop: Story={}
export const MobileDrawer: Story={args:{mobileOpen:true},parameters:{viewport:{defaultViewport:'mobile1'}}}
export const UnavailableActions: Story={args:{utilityActions:[{id:'settings',label:'Configuración',icon:'sliders',unavailableReason:'Ejemplo no operativo'}]}}
