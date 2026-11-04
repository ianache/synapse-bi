import { ApiRepository } from './apiRepository'
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

export interface PreparationPipeline {
  id: string; sourceId: string; inputDatasetId: string; preparedDatasetId: string; processId: string
  processConfig: Record<string, unknown>; enabled: boolean; createdAt: string; updatedAt: string
}
export interface PreparationVersion {
  datasetId: string; versionId: string; versionNumber: number; inputDatasetId: string; processId: string
  processConfig: Record<string, unknown>; runId: string; sourceRangeStart: number | null; sourceRangeEnd: number | null
  eventCount: number; createdAt: string
}
export interface PreparationRun {
  id: string; pipelineId: string; datasetId: string; processId: string; origin: 'manual' | 'poll'
  status: 'received' | 'processing' | 'published' | 'technical_failure' | 'quality_rejected'
  startedAt: string; endedAt: string | null; eventCount: number; insertCount: number; updateCount: number
  deleteCount: number; rejectedCount: number; qualityResults: { checks?: { code: string; passed: boolean; rejectedCount: number }[]; [key: string]: unknown }
  publishedVersion: PreparationVersion | null; latestSuccessfulVersion: PreparationVersion | null; retryOfRunId: string | null
  errorCode?: string | null; sanitizedError?: string | null
}
export interface CdcHistoryEvent {
  source_event_id: string; business_key: number; operation: 'insert' | 'update' | 'delete'; event_timestamp: string
  source_position: number | null; timestamp_ambiguous: boolean; after_image: Record<string, unknown> | null
}
export interface CurrentSalesState { business_key: number; after_image: Record<string, unknown>; last_event_id: string }
export interface PreparationPage<T> { items: T[]; total: number; limit: number; offset: number }
export interface CreatePreparationPipeline { sourceId: string; inputDatasetId: string; preparedDatasetName: string; enabled: boolean }

export class PreparationRepository {
  constructor(private readonly api = new ApiRepository(env.VITE_API_AUTH === 'development', undefined, 'data-admin')) {}
  pipelines = (signal?: AbortSignal) => this.api.request<{ items: PreparationPipeline[] }>('/preparation-pipelines', { signal })
  createPipeline = (body: CreatePreparationPipeline) => this.api.request<PreparationPipeline>('/preparation-pipelines', { method: 'POST', body: JSON.stringify(body) })
  runs = (pipelineId?: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ limit: '100', offset: '0' })
    if (pipelineId) query.set('pipeline_id', pipelineId)
    return this.api.request<PreparationPage<PreparationRun>>(`/preparation-runs?${query}`, { signal })
  }
  run = (id: string, signal?: AbortSignal) => this.api.request<PreparationRun>(`/preparation-runs/${encodeURIComponent(id)}`, { signal })
  retry = (id: string, events?: Record<string, unknown>[]) => this.api.request<PreparationRun>(`/preparation-runs/${encodeURIComponent(id)}/retry`, {
    method: 'POST', ...(events ? { body: JSON.stringify({ events }) } : {}),
  })
  versions = (datasetId: string, signal?: AbortSignal) => this.api.request<PreparationPage<PreparationVersion>>(`/prepared-datasets/${encodeURIComponent(datasetId)}/versions?limit=100&offset=0`, { signal })
  history = (datasetId: string, versionId: string, signal?: AbortSignal) => this.api.request<PreparationPage<CdcHistoryEvent>>(`/prepared-datasets/${encodeURIComponent(datasetId)}/versions/${encodeURIComponent(versionId)}/history?limit=500&offset=0`, { signal })
  currentState = (datasetId: string, versionId: string, signal?: AbortSignal) => this.api.request<PreparationPage<CurrentSalesState>>(`/prepared-datasets/${encodeURIComponent(datasetId)}/versions/${encodeURIComponent(versionId)}/current-state?limit=500&offset=0`, { signal })
}
