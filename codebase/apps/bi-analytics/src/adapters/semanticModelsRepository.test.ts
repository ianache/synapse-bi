import { afterEach, expect, it, vi } from 'vitest'
import { ApiRepository } from './apiRepository'
import { SemanticModelsRepository } from './semanticModelsRepository'

afterEach(() => vi.unstubAllGlobals())

it('serializes model selection, safe retry key, preview digest and optimistic headers', async () => {
  const calls: {url: string; init: RequestInit}[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({url, init}); return new Response(JSON.stringify({id: 'draft'}))
  })
  const repo = new SemanticModelsRepository(new ApiRepository(false, async () => 'token'))
  await repo.create({name: 'Logística', domainId: 'domain', kpiIds: []}, 'stable')
  await repo.preview('model/id', {id: 'd/id', revision: 2}, ['k'])
  await repo.update('model/id', {id: 'd/id', revision: 2}, ['k'], 'a'.repeat(64))
  expect(calls[0].url).toBe('/api/v1/semantic-models')
  expect(calls[0].init.headers).toMatchObject({'Idempotency-Key': 'stable'})
  expect(JSON.parse(calls[0].init.body as string)).toEqual({name: 'Logística', domainId: 'domain', kpiIds: []})
  expect(calls[1].url).toBe('/api/v1/semantic-models/model%2Fid/drafts/d%2Fid/preview')
  expect(calls[1].init.headers).toMatchObject({'If-Match': '"2"'})
  expect(JSON.parse(calls[2].init.body as string)).toEqual({kpiIds: ['k'], candidateDigest: 'a'.repeat(64)})
  expect(calls[2].init.method).toBe('PUT')
})

it('keeps pagination, comparison and abort on read requests', async () => {
  const calls: {url: string; init: RequestInit}[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    calls.push({url, init}); return new Response(JSON.stringify({items: [], total: 0}))
  })
  const repo = new SemanticModelsRepository(new ApiRepository(false, async () => 'token'))
  const controller = new AbortController()
  await repo.list({domainId: 'd', q: 'Entrega', limit: 25, offset: 25}, controller.signal)
  await repo.compare('m', 'first', 'last', controller.signal)
  expect(calls[0].url).toContain('domainId=d&q=Entrega&limit=25&offset=25')
  expect(calls[0].init.signal).toBe(controller.signal)
  expect(calls[1].url).toBe('/api/v1/semantic-models/m/compare?leftDraftId=first&rightDraftId=last')
})

it('preserves safe API errors without substituting mock models', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({error: {code: 'capture_changed', message: 'Vuelve a comparar'}}), {status: 409}))
  const repo = new SemanticModelsRepository(new ApiRepository(false, async () => 'token'))
  await expect(repo.preview('m', {id: 'd', revision: 1}, [])).rejects.toMatchObject({status: 409, code: 'capture_changed'})
})
