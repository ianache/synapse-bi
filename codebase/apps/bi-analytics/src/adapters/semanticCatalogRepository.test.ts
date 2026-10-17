import { afterEach, expect, it, vi } from 'vitest'
import { ApiRepository } from './apiRepository'
import { SemanticCatalogRepository } from './semanticCatalogRepository'

afterEach(() => vi.unstubAllGlobals())

it('loads all selector pages rather than dropping referenced components after the first page', async () => {
  const seen: string[] = []
  vi.stubGlobal('fetch', async (url: string) => {
    seen.push(url)
    const offset = new URL(url, 'http://test').searchParams.get('offset')
    return new Response(JSON.stringify({items: [{id: offset === '0' ? 'first' : 'last'}], total: 2, limit: 100, offset: Number(offset)}))
  })
  const repo = new SemanticCatalogRepository(new ApiRepository(false, async () => 'token'))
  expect((await repo.all('components')).map(item => item.id)).toEqual(['first', 'last'])
  expect(seen).toHaveLength(2)
})

it('serializes contract routes, stable creation key and update preconditions', async () => {
  const calls: {url: string; init: RequestInit}[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({url, init})
    return new Response(JSON.stringify({id: 'd', name: 'Logística', version: 2}), {status: 200})
  })
  const repository = new SemanticCatalogRepository(new ApiRepository(false, async () => 'token'))
  const item = await repository.createDomain({name: 'Logística'}, 'same-key')
  await repository.update('domains', item, {name: 'Operaciones'})
  await repository.list('components', {domainId: 'd', q: 'Tiempo', limit: 10})
  expect(calls[0].url).toBe('/api/v1/semantic-catalog/domains')
  expect(calls[0].init.headers).toMatchObject({'Idempotency-Key': 'same-key', Authorization: 'Bearer token'})
  expect(JSON.parse(calls[0].init.body as string)).toEqual({name: 'Logística'})
  expect(calls[1].init.headers).toMatchObject({'If-Match': '"2"'})
  expect(calls[2].url).toContain('domainId=d&q=Tiempo&limit=10')
})

it('preserves the key for an uncertain retry and surfaces safe API errors', async () => {
  const headers: HeadersInit[] = []
  let attempts = 0
  vi.stubGlobal('fetch', async (_: string, init: RequestInit) => {
    headers.push(init.headers!)
    if (!attempts++) throw new TypeError('Network lost')
    return new Response(JSON.stringify({error: {code: 'permission_denied', message: 'Sin permiso'}}), {status: 403})
  })
  const repository = new SemanticCatalogRepository(new ApiRepository(false, async () => 'token'))
  await expect(repository.copyComponent('m', 'Copia', 'stable')).rejects.toThrow('Network lost')
  await expect(repository.copyComponent('m', 'Copia', 'stable')).rejects.toMatchObject({status: 403, code: 'permission_denied'})
  expect(headers[0]).toMatchObject({'Idempotency-Key': 'stable'})
  expect(headers[1]).toMatchObject({'Idempotency-Key': 'stable'})
})
