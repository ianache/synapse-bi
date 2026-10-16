import { ApiRepository } from './apiRepository'
import type { Observation } from '../domain/observations'
export type { Column, Constraint, SchemaObject, Observation } from '../domain/observations'
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

export interface ConnectionFields {
  host: string; port: number; database: string; username: string
  tlsMode: 'disable' | 'verify-full'; laboratory: boolean; schemas: string[]
}
export interface Source extends ConnectionFields {
  id: string; name: string; description: string; status: 'connected' | 'attention'
  testedAt: string | null; createdAt: string; version: number; credentialConfigured: boolean
}
export interface Probe { testId: string; validUntil: string; serverVersion: number; schemas: string[] }
export type SaveSource = ConnectionFields & { name: string; description: string; password: string; testId: string }

export class SourcesRepository {
  constructor(private readonly api = new ApiRepository(env.VITE_API_AUTH === 'development', undefined, 'data-admin')) {}
  list = (signal?: AbortSignal) => this.api.request<{ items: Source[] }>('/sources', { signal })
  get = (id: string, signal?: AbortSignal) => this.api.request<Source>(`/sources/${encodeURIComponent(id)}`, { signal })
  test = (body: ConnectionFields & { password: string }) => this.api.request<Probe>('/sources/test', { method: 'POST', body: JSON.stringify(body) })
  save = (body: SaveSource, source?: Source) => this.api.request<Source>(source ? `/sources/${encodeURIComponent(source.id)}/connection` : '/sources', {
    method: source ? 'PUT' : 'POST', headers: source ? { 'If-Match': `"${source.version}"` } : {}, body: JSON.stringify(body),
  })
  retest = (id: string) => this.api.request(`/sources/${encodeURIComponent(id)}/test`, { method: 'POST' })
  observe = (id: string) => this.api.request<Observation>(`/sources/${encodeURIComponent(id)}/observations`, { method: 'POST' })
  history = (id: string, signal?: AbortSignal) => this.api.request<{ items: Observation[] }>(`/sources/${encodeURIComponent(id)}/observations`, { signal })
  observation = (id: string, observationId: string, signal?: AbortSignal) => this.api.request<Observation>(`/sources/${encodeURIComponent(id)}/observations/${encodeURIComponent(observationId)}`, { signal })
}
