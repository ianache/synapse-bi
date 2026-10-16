import { afterEach, expect, it, vi } from 'vitest'
import { ApiRepository, ApiRequestError } from './apiRepository'
import { DatasetsRepository } from './datasetsRepository'
import { draft, dataset } from '../pages/datasets/testFixtures'

afterEach(() => vi.unstubAllGlobals())
it('encodes identifiers and server filters and sends stable creation key and update version', async () => {
  const requests: { url: string; init: RequestInit }[] = []
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => { requests.push({ url, init }); return new Response(JSON.stringify(dataset)) })
  const storage = vi.spyOn(Storage.prototype, 'setItem')
  const repo = new DatasetsRepository(new ApiRepository(false, async () => 'test-token'))
  await repo.get('a/b')
  await repo.list({ q: 'café &', completeness: 'incomplete', limit: 10, offset: 20 })
  await repo.create(draft, 'same-key')
  await repo.create(draft, 'same-key')
  await repo.update(dataset, draft)
  expect(requests[0].url).toBe('/api/v1/datasets/a%2Fb')
  const query = new URL(requests[1].url, 'http://local').searchParams
  expect([query.get('q'), query.get('offset'), query.get('completeness')]).toEqual(['café &', '20', 'incomplete'])
  expect((requests[2].init.headers as Record<string, string>)['Idempotency-Key']).toBe('same-key')
  expect((requests[3].init.headers as Record<string, string>)['Idempotency-Key']).toBe('same-key')
  expect((requests[4].init.headers as Record<string, string>)['If-Match']).toBe('"1"')
  expect(storage).not.toHaveBeenCalled()
  storage.mockRestore()
})
it('preserves safe typed errors without arbitrary server details', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: { code: 'metadata_incomplete', message: 'Completa metadatos', details: { missingMetadata: ['owner', 'injected'], secret: 'hidden' } } }), { status: 422 }))
  const repo = new DatasetsRepository(new ApiRepository(false, async () => 'test-token'))
  const error = await repo.create(draft, 'k').catch(e => e)
  expect(error).toBeInstanceOf(ApiRequestError)
  expect([error.status, error.code, error.missingMetadata]).toEqual([422, 'metadata_incomplete', ['owner']])
  expect(JSON.stringify(error)).not.toContain('hidden')
})
