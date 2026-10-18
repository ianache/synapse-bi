import {test,expect} from './fixtures'
import AxeBuilder from '@axe-core/playwright'
import {mkdirSync} from 'node:fs'
import type {Page} from '@playwright/test'
const screens='test-results-navigation/screens'
const families=[
 ['Inicio','/'],['Explorar KPI','/explorar'],['Dashboards','/dashboards'],['Fuentes de datos','/fuentes'],
 ['Datasets','/datasets'],['Catálogo semántico','/catalogo-semantico'],['Modelos semánticos','/modelos-semanticos'],
] as const
async function settled(page:Page){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready)}
async function shot(page:Page,name:string){mkdirSync(screens,{recursive:true});await page.screenshot({path:screens+'/'+name+'.png',fullPage:true})}
async function bars(page:Page){
 await expect(page.locator('.bi-mainbar')).toHaveCount(1)
 await expect(page.locator('aside.bi-menubar')).toHaveCount(1)
 expect(await page.locator('aside.bi-menubar').evaluate(el=>el.getBoundingClientRect().width)).toBe(256)
 expect(await page.locator('.bi-mainbar').evaluate(el=>el.getBoundingClientRect().height)).toBe(64)
 expect(await page.locator('aside.bi-menubar').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(17, 24, 39)')
 await expect(page.locator('.bi-mainbar').getByRole('searchbox')).toHaveCount(0)
}
test('consistent_bars_after_direct_and_spa_navigation',async({page})=>{
 for(const [index,[,path]] of families.entries()){
   await page.goto(path);await settled(page);await bars(page)
   await expect(page.locator('.bi-menubar [aria-current=page]')).toHaveAttribute('href',path)
   await shot(page,'desktop-'+index)
 }
 for(const [label,path] of [...families].reverse()){
   await page.locator('aside.bi-menubar').getByRole('link',{name:label,exact:true}).click()
   await expect(page).toHaveURL(new RegExp(path==='/'?'/$':path+'$'))
   await settled(page);await bars(page)
 }
 const subroutes=['/fuentes/nueva','/fuentes/s1','/datasets/nuevo','/datasets/d1','/catalogo-semantico/kpi-definitions/k',
   '/modelos-semanticos/nuevo','/modelos-semanticos/model','/modelos-semanticos/model/borradores/draft/comparar','/dashboard']
 for(const [index,path] of subroutes.entries()){
   await page.goto(path);await settled(page);await bars(page)
   await expect(page.locator('main h1')).toHaveCount(1)
   await shot(page,'subroute-'+index)
 }
})
test('drawer_keyboard_and_business_modal_priority',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/modelos-semanticos/nuevo');await settled(page)
 const field=page.getByLabel('Nombre del modelo',{exact:true})
 await field.fill('Texto conservado / navegación')
 const toggle=page.getByRole('button',{name:'Abrir navegación',exact:true})
 await toggle.click()
 const drawer=page.locator('dialog.bi-menubar[open]')
 await expect(drawer).toBeVisible();await shot(page,'mobile-drawer')
 expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden')
 await page.keyboard.press('Shift+Tab')
 expect(await drawer.evaluate(el=>el.contains(document.activeElement))).toBe(true)
 await page.keyboard.press('Tab')
 expect(await drawer.evaluate(el=>el.contains(document.activeElement))).toBe(true)
 await page.evaluate(()=>{
   const modal=document.createElement('dialog');modal.id='test-business';modal.setAttribute('aria-label','Negocio de prueba')
   modal.innerHTML='<input aria-label="Dato de negocio">';document.body.append(modal);modal.showModal()
 })
 await page.getByRole('textbox',{name:'Dato de negocio'}).fill('Prioridad')
 await page.keyboard.press('Escape');await expect(drawer).toBeVisible()
 await page.evaluate(()=>document.getElementById('test-business')?.remove())
 await page.keyboard.press('Escape');await expect(drawer).toHaveCount(0)
 await expect(toggle).toBeFocused();await expect(field).toHaveValue('Texto conservado / navegación')
 await shot(page,'mobile-closed')
 await toggle.click();await page.mouse.click(380,400);await expect(drawer).toHaveCount(0)
 await page.setViewportSize({width:1023,height:900});await toggle.click();await expect(drawer).toBeVisible()
 await page.setViewportSize({width:1024,height:900});await expect(page.locator('aside.bi-menubar')).toBeVisible()
 expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden')
 await page.setViewportSize({width:1023,height:900});await expect(page.locator('dialog[open]')).toHaveCount(0)
 await expect(field).toHaveValue('Texto conservado / navegación')
})
test('long_breadcrumb_reflow_preserves_content',async({page})=>{
 await page.goto('/modelos-semanticos/model/borradores/draft/comparar');await settled(page)
 // Keep a slash-containing entity as one breadcrumb, not a fake route hierarchy.
 await page.locator('.bi-navigation-breadcrumbs [aria-current=page]').evaluate(el=>el.textContent='Ventas / Canal — Modelo semántico de nombre extremadamente largo')
 for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900})
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
   await expect(page.locator('main')).toBeVisible()
   await expect(page.locator('.bi-navigation-breadcrumbs [aria-current=page]')).toHaveCount(1)
   await shot(page,'reflow-'+width)
 }
 await page.addStyleTag({content:'.bi-mainbar{font-size:24px}.bi-mainbar li,.bi-mainbar [aria-current=page],.bi-navigation-no-profile{font-size:inherit}'})
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await shot(page,'reflow-text-200')
})
test('local_fonts_without_external_network',async({page})=>{
 const external:string[]=[],fonts:string[]=[]
 await page.route('**/*',async route=>{
   const url=new URL(route.request().url())
   if(url.hostname!=='127.0.0.1'){external.push(url.href);return route.abort()}
   if(url.pathname.endsWith('.woff2')) fonts.push(url.pathname)
   return route.fallback()
 })
 await page.goto('/modelos-semanticos');await settled(page)
 expect(external).toEqual([]);expect(fonts.length).toBeGreaterThan(0)
 expect(await page.locator('.bi-mainbar').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('US004 Plus Jakarta Sans')
 for(const width of [1440,390]){
   await page.setViewportSize({width,height:900})
   expect((await new AxeBuilder({page}).analyze()).violations).toEqual([])
 }
 await page.getByRole('button',{name:'Abrir navegación',exact:true}).click()
 expect((await new AxeBuilder({page}).include('dialog[open]').analyze()).violations).toEqual([])
})
test('login_has_no_operational_bars',async({page})=>{
 await page.goto('/login');await settled(page)
 await expect(page.locator('.bi-mainbar,.bi-menubar')).toHaveCount(0)
})
test('skip_link_clearance_tracks_growing_header',async({page})=>{
 await page.goto('/modelos-semanticos/model/borradores/draft/comparar');await settled(page)
 for(const enlarged of [false,true]){
   if(enlarged) await page.addStyleTag({content:'.bi-navigation-no-profile{font-size:36px}'})
   await page.evaluate(()=>window.scrollTo(0,400))
   await page.getByRole('link',{name:'Saltar al contenido'}).focus()
   await page.keyboard.press('Enter')
   await expect(page.locator('#workspace')).toBeFocused()
   await expect.poll(async()=>page.evaluate(()=>{
     const main=document.querySelector('#workspace')!, header=document.querySelector('.bi-mainbar')!
     return main.getBoundingClientRect().top>=header.getBoundingClientRect().bottom-1
   })).toBe(true)
 }
})
test('mobile_families_and_component_kit_reuse_the_organisms',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 for(const [index,[,path]] of families.entries()){
   await page.goto(path);await settled(page)
   await expect(page.locator('.bi-mainbar')).toHaveCount(1)
   await expect(page.locator('aside.bi-menubar,dialog[open]')).toHaveCount(0)
   expect(await page.locator('.bi-mainbar').evaluate(el=>el.getBoundingClientRect().right)).toBeLessThanOrEqual(390)
   await page.getByRole('button',{name:'Abrir navegación',exact:true}).click()
   await expect(page.locator('dialog[open] [aria-current=page]')).toHaveAttribute('href',path)
   await page.keyboard.press('Escape')
   await shot(page,'mobile-family-'+index)
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('/componentes');await settled(page)
 const preview=page.locator('.bi-navigation-demo')
 await expect(preview.getByRole('heading',{name:'Demostración de navegación'})).toBeVisible()
 await expect(preview.locator('.bi-mainbar')).toHaveCount(1)
 await expect(preview.locator('aside.bi-menubar')).toHaveCount(1)
 await preview.getByRole('link',{name:'Catálogo semántico',exact:true}).click()
 await expect(preview.locator('[aria-current=page]').first()).toHaveText('Catálogo semántico')
 await expect(page).toHaveURL(/\/componentes$/)
 await preview.scrollIntoViewIfNeeded();await shot(page,'component-kit')
})

