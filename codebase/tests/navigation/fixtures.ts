import {test as base, expect} from '@playwright/test'
import type {Domain, Component, KpiDefinition} from '../../apps/bi-analytics/src/domain/semanticCatalog'
import type {ModelDraft, SemanticModel, DraftSummary} from '../../apps/bi-analytics/src/domain/semanticModels'
import type {Source, Observation} from '../../apps/bi-analytics/src/adapters/sourcesRepository'
import {dataset} from '../../apps/bi-analytics/src/pages/datasets/testFixtures'

const stamp='2026-10-18T10:00:00Z'
const metadata={id:'d',version:1,createdAt:stamp,updatedAt:stamp,status:'draft' as const,governanceValidation:'pending' as const,
 completeness:'incomplete' as const,missingMetadata:['owner'],warnings:[]}
const domain:Domain={...metadata,name:'Logística de ejemplo',description:'Fixture de interfaz',owner:null}
const component:Component={...metadata,id:'m',name:'Tiempo de ejemplo',domainId:'d',kind:'measure',definition:null,grain:null,unit:null,
 aggregation:null,synonyms:[],binding:null,bindingSnapshot:null,bindingStatus:'absent',protected:true,consumerCount:1,copyOriginId:null}
const kpi:KpiDefinition={...metadata,id:'k',name:'Entrega de ejemplo',domainId:'d',formula:'SUM(tiempo)',measureIds:['m'],dimensionIds:[]}
const source:Source={id:'s1',name:'Fuente de ejemplo',description:'Fixture de interfaz',host:'fixture.invalid',port:5432,database:'navigation_demo',
 username:'reader_example',tlsMode:'disable',laboratory:true,schemas:['gold'],status:'connected',testedAt:stamp,createdAt:stamp,version:1,credentialConfigured:true}
const observation:Observation={id:'o1',sequence:1,sourceVersion:1,createdAt:stamp,status:'success',errorCode:null,tables:1,views:0,
 snapshot:{serverVersion:180000,schemas:['gold'],objects:[{schema:'gold',name:'fact_sales',kind:'table',comment:null,
 columns:dataset.selectedColumns,constraints:dataset.sourceConstraints}]}}
const draft:ModelDraft={id:'draft',modelId:'model',sequence:1,revision:1,status:'draft',semanticVersion:null,kpiIds:['k'],
 capture:{domain:{id:'d',name:domain.name,version:1},kpis:[{id:'k',version:1,name:kpi.name,domainId:'d',formula:kpi.formula,measureIds:['m'],dimensionIds:[]}],
 components:[{id:'m',version:1,name:component.name,domainId:'d',kind:'measure',bindingSnapshot:null}]},
 captureDigest:'a'.repeat(64),capturedAt:stamp,createdBy:'fixture-admin',createdAt:stamp,updatedAt:stamp,parentDraftId:null,
 completeness:'incomplete',missingMetadata:['kpis.k.owner']}
const model:SemanticModel={id:'model',domainId:'d',name:'Modelo de ejemplo',description:'Fixture de navegación',createdBy:'fixture-admin',createdAt:stamp,updatedAt:stamp,revision:1}
const summary:DraftSummary={id:'draft',sequence:1,revision:1,status:'draft',semanticVersion:null,capturedAt:stamp,updatedAt:stamp,kpiCount:1,componentCount:1}

export const test=base.extend<{fixtureApi:void}>({
 fixtureApi:[async ({page},use)=>{
   const unexpected:string[]=[]
   await page.route('**/api/v1/**',async route=>{
     const request=route.request(),url=new URL(request.url()),path=url.pathname.slice('/api/v1'.length)
     const send=(json:unknown)=>route.fulfill({status:200,json})
     if(request.method()==='POST' && path==='/auth/dev-session') return send({accessToken:'navigation-fixture-only',tokenType:'bearer',expiresIn:3600,mode:'development'})
     if(request.method()==='GET'){
       const paged=<T extends {name?:string;domainId?:string;kind?:string;completeness?:string;registrationStatus?:string}>(items:T[])=>{
         const filters=['domainId','kind','completeness','registrationStatus'] as const
         const selected=items.filter(item=>filters.every(key=>!url.searchParams.get(key)||item[key]===url.searchParams.get(key))
           && (!url.searchParams.get('q')||item.name?.toLowerCase().includes(url.searchParams.get('q')!.toLowerCase())))
         const offset=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??100)
         return send({items:selected.slice(offset,offset+limit),total:selected.length,limit,offset})
       }
       if(path==='/me') return send({subject:'fixture-admin',tenantId:'fixture',name:'Demostración',scopes:
         ['sources:read','sources:write','datasets:read','datasets:write','semantic:read','semantic:write','models:read','models:write'],authMode:'development',dataMode:'synthetic'})
       if(path==='/sources') return send({items:[source]})
       if(path==='/sources/s1') return send(source)
       if(path==='/sources/s1/observations') return send({items:[observation]})
       if(path==='/sources/s1/observations/o1') return send(observation)
       if(path==='/datasets') return paged([dataset])
       if(path==='/datasets/d1') return send(dataset)
       if(path==='/semantic-catalog/domains') return paged([domain])
       if(path==='/semantic-catalog/domains/d') return send(domain)
       if(path==='/semantic-catalog/components') return paged([component])
       if(path==='/semantic-catalog/components/m') return send(component)
       if(path==='/semantic-catalog/components/m/consumers') return paged([kpi])
       if(path==='/semantic-catalog/kpi-definitions') return paged([kpi])
       if(path==='/semantic-catalog/kpi-definitions/k') return send(kpi)
       if(path==='/semantic-models') return paged([{...model,latestDraft:summary}])
       if(path==='/semantic-models/model') return send({model,draft})
       if(path==='/semantic-models/model/drafts') return send({items:[summary],total:1,limit:25,offset:0})
       if(path==='/semantic-models/model/drafts/draft') return send(draft)
     }
     unexpected.push(request.method()+' '+url.pathname)
     await route.fulfill({status:501,json:{error:{code:'unhandled_navigation_fixture',message:'Unexpected request'}}})
   })
   await use()
   expect(unexpected,'No API request may escape the explicit fixture contract').toEqual([])
 },{auto:true}],
})
export {expect}

