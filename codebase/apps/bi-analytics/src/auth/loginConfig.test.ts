import {describe,it,expect} from 'vitest'
import {resolveEndpoint} from './loginConfig'
import {parseServiceHealth} from '../hooks/useServiceHealth'
describe('login configuration',()=>{
 it('leaves SSO unconfigured rather than inventing a session',()=>expect(resolveEndpoint('', 'http://localhost:5173')).toBeUndefined())
 it('resolves the configured BFF endpoint',()=>expect(resolveEndpoint('/auth/login','http://localhost:5173')).toBe('http://localhost:5173/auth/login'))
 it('rejects executable URLs and credentials in the URL',()=>{
  expect(()=>resolveEndpoint('javascript:alert(1)','http://localhost')).toThrow()
  expect(()=>resolveEndpoint('https://user:password@example.com','http://localhost')).toThrow()
 })
 it('does not mark missing or invalid health states as operational',()=>{
  const services=parseServiceHealth({services:[{id:'portal',status:'operational',latencyMs:12},{id:'keycloak',status:'invented',latencyMs:-1}]})
  expect(services.find(s=>s.id==='portal')?.status).toBe('operational')
  expect(services.find(s=>s.id==='keycloak')?.status).toBe('unknown')
  expect(services.find(s=>s.id==='bff')?.status).toBe('unknown')
  expect(services.find(s=>s.id==='keycloak')?.latencyMs).toBeUndefined()
 })
})
