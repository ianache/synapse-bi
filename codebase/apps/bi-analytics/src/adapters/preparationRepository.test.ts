import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiRepository } from './apiRepository'
import { PreparationRepository } from './preparationRepository'

afterEach(() => vi.unstubAllGlobals())

describe('PreparationRepository', () => {
  it('creates a pipeline using the selected registered source and dataset', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'pipe-1' }), { status: 201 }))
    vi.stubGlobal('fetch', fetcher)
    const repository = new PreparationRepository(new ApiRepository(false, async () => 'token'))

    await repository.createPipeline({ sourceId: 'source-1', inputDatasetId: 'dataset-1', preparedDatasetName: 'Ventas CDC', enabled: true })

    expect(fetcher).toHaveBeenCalledWith('/api/v1/preparation-pipelines', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ sourceId: 'source-1', inputDatasetId: 'dataset-1', preparedDatasetName: 'Ventas CDC', enabled: true }),
    }))
  })

  it('filters execution history by pipeline and retries a failed poll without a body', async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ items: [] }), { status: 200 })))
    vi.stubGlobal('fetch', fetcher)
    const repository = new PreparationRepository(new ApiRepository(false, async () => 'token'))

    await repository.runs('pipe/1')
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/preparation-runs?limit=100&offset=0&pipeline_id=pipe%2F1')
    await repository.retry('run-1', [{ sourceEventId: 'evt-2', businessKey: 7, operation: 'update' }])
    expect(fetcher.mock.calls[1][0]).toBe('/api/v1/preparation-runs/run-1/retry')
    expect(fetcher.mock.calls[1][1]).toEqual(expect.objectContaining({ method: 'POST', body: JSON.stringify({ events: [{ sourceEventId: 'evt-2', businessKey: 7, operation: 'update' }] }) }))
  })
})
