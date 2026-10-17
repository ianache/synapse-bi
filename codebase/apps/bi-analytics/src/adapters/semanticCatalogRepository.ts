import { ApiRepository } from './apiRepository'
import type { CatalogFilters, CatalogPage, Component, Consumer, Domain, InputMap, KpiDefinition, RecordMap, ResourceKind, SaveComponent, SaveDomain, SaveKpiDefinition } from '../domain/semanticCatalog'
const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}

export class SemanticCatalogRepository {
  constructor(private readonly api = new ApiRepository(env.VITE_API_AUTH === 'development', undefined, 'data-admin')) {}
  list = <K extends ResourceKind>(kind: K, filters: CatalogFilters = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)) })
    return this.api.request<CatalogPage<RecordMap[K]>>(`/semantic-catalog/${kind}?${query}`, {signal})
  }
  get = <K extends ResourceKind>(kind: K, id: string, signal?: AbortSignal) => this.api.request<RecordMap[K]>(`/semantic-catalog/${kind}/${encodeURIComponent(id)}`, {signal})
  all = async <K extends ResourceKind>(kind: K, filters: CatalogFilters = {}, signal?: AbortSignal): Promise<RecordMap[K][]> => {
    const items: RecordMap[K][] = []
    while (items.length < 10000) {
      const page = await this.list(kind, {...filters, limit: 100, offset: items.length}, signal)
      items.push(...page.items)
      if (items.length >= page.total) return items
      if (!page.items.length) throw new Error('La paginación del catálogo no avanzó.')
    }
    throw new Error('El selector excede 10000 elementos. Acota el catálogo antes de editar.')
  }
  create = <K extends ResourceKind>(kind: K, body: InputMap[K], key: string) => this.api.request<RecordMap[K]>(`/semantic-catalog/${kind}`, {
    method: 'POST', headers: {'Idempotency-Key': key}, body: JSON.stringify(body),
  })
  createDomain = (body: SaveDomain, key: string): Promise<Domain> => this.create('domains', body, key)
  createComponent = (body: SaveComponent, key: string): Promise<Component> => this.create('components', body, key)
  createKpi = (body: SaveKpiDefinition, key: string): Promise<KpiDefinition> => this.create('kpi-definitions', body, key)
  update = <K extends ResourceKind>(kind: K, item: RecordMap[K], body: InputMap[K]) => this.api.request<RecordMap[K]>(`/semantic-catalog/${kind}/${encodeURIComponent(item.id)}`, {
    method: 'PUT', headers: {'If-Match': `"${item.version}"`}, body: JSON.stringify(body),
  })
  copyComponent = (id: string, name: string, key: string) => this.api.request<Component>(`/semantic-catalog/components/${encodeURIComponent(id)}/copies`, {
    method: 'POST', headers: {'Idempotency-Key': key}, body: JSON.stringify({name}),
  })
  consumers = (id: string, offset = 0, signal?: AbortSignal) => this.api.request<CatalogPage<Consumer>>(`/semantic-catalog/components/${encodeURIComponent(id)}/consumers?limit=25&offset=${offset}`, {signal})
  me = (signal?: AbortSignal) => this.api.request<{scopes: string[]}>('/me', {signal})
}
