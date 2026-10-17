import { ApiRepository } from './apiRepository'
import type {CreateModel, DraftSummary, ModelComparison, ModelDetailRecord, ModelDraft, ModelFilters, ModelItem, ModelPage, ModelPreview, SemanticModel} from '../domain/semanticModels'

const env = (import.meta as ImportMeta & {env?: Record<string, string | undefined>}).env ?? {}
const base = '/semantic-models'
const path = (id: string) => `${base}/${encodeURIComponent(id)}`
const draftPath = (id: string, draftId: string) => `${path(id)}/drafts/${encodeURIComponent(draftId)}`
export class SemanticModelsRepository {
  constructor(private readonly api = new ApiRepository(env.VITE_API_AUTH === 'development', undefined, 'data-admin')) {}
  list = (filters: ModelFilters = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {if (value !== undefined && value !== '') query.set(key, String(value))})
    return this.api.request<ModelPage<ModelItem>>(`${base}?${query}`, {signal})
  }
  create = (body: CreateModel, key: string) => this.api.request<ModelDetailRecord>(base, {method: 'POST', headers: {'Idempotency-Key': key}, body: JSON.stringify(body)})
  get = (id: string, signal?: AbortSignal) => this.api.request<ModelDetailRecord>(path(id), {signal})
  drafts = (id: string, offset = 0, signal?: AbortSignal) => this.api.request<ModelPage<DraftSummary>>(`${path(id)}/drafts?limit=25&offset=${offset}`, {signal})
  getDraft = (id: string, draftId: string, signal?: AbortSignal) => this.api.request<ModelDraft>(draftPath(id, draftId), {signal})
  clone = (model: Pick<SemanticModel, 'id' | 'revision'>, sourceDraftId: string, key: string) => this.api.request<ModelDraft>(`${path(model.id)}/drafts`, {
    method: 'POST', headers: {'Idempotency-Key': key, 'If-Match': `"${model.revision}"`}, body: JSON.stringify({sourceDraftId}),
  })
  preview = (id: string, draft: Pick<ModelDraft, 'id' | 'revision'>, kpiIds: string[], signal?: AbortSignal) => this.api.request<ModelPreview>(`${draftPath(id, draft.id)}/preview`, {
    method: 'POST', signal, headers: {'If-Match': `"${draft.revision}"`}, body: JSON.stringify({kpiIds}),
  })
  update = (id: string, draft: Pick<ModelDraft, 'id' | 'revision'>, kpiIds: string[], candidateDigest: string) => this.api.request<ModelDraft>(draftPath(id, draft.id), {
    method: 'PUT', headers: {'If-Match': `"${draft.revision}"`}, body: JSON.stringify({kpiIds, candidateDigest}),
  })
  compare = (id: string, leftDraftId: string, rightDraftId: string, signal?: AbortSignal) => this.api.request<ModelComparison>(`${path(id)}/compare?${new URLSearchParams({leftDraftId, rightDraftId})}`, {signal})
  me = (signal?: AbortSignal) => this.api.request<{scopes: string[]}>('/me', {signal})
}
