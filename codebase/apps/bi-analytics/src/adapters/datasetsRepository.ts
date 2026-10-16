import { ApiRepository } from './apiRepository'
import type { Dataset, DatasetFilters, DatasetPage, SaveDataset } from '../domain/datasets'
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

export class DatasetsRepository {
  constructor(private readonly api = new ApiRepository(env.VITE_API_AUTH === 'development', undefined, 'data-admin')) {}
  list = (filters: DatasetFilters = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
    return this.api.request<DatasetPage>(`/datasets?${query}`, { signal })
  }
  get = (id: string, signal?: AbortSignal) => this.api.request<Dataset>(`/datasets/${encodeURIComponent(id)}`, { signal })
  create = (body: SaveDataset, key: string) => this.api.request<Dataset>('/datasets', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) })
  update = (dataset: Dataset, body: SaveDataset) => this.api.request<Dataset>(`/datasets/${encodeURIComponent(dataset.id)}`, { method: 'PUT', headers: { 'If-Match': `"${dataset.version}"` }, body: JSON.stringify(body) })
  me = (signal?: AbortSignal) => this.api.request<{ scopes: string[] }>('/me', { signal })
}
