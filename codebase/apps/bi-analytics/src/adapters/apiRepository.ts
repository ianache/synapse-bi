import type { PublishedKpi } from '../domain/kpis'
import type { LocalDashboard } from './localDashboards'
import { metadataLabels } from '../domain/datasets'

export class ApiRequestError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly missingMetadata: string[] = []) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export interface QueryResult {
  kpiId: string
  modelVersion: number
  unit: string
  status: 'success' | 'empty'
  rows: { dimension: string | null; value: string | null }[]
  metadata: { dataMode: 'synthetic' | 'connected'; sourceUpdatedAt: string | null; queriedAt: string; quality: { status: string; score: number | null } }
}

export interface QueryPeriod { startDate: string; endDate: string; channel?: string }

export class ApiRepository {
  private token: Promise<string> | undefined
  private creationKeys = new Map<string, string>()
  constructor(private readonly developmentAuth = false, private readonly getAccessToken?: () => Promise<string>, private readonly developmentPersona = 'analyst') {}

  private accessToken() {
    if (!this.token) {
      if (this.getAccessToken) this.token = this.getAccessToken()
      else if (this.developmentAuth) {
        this.token = fetch('/api/v1/auth/dev-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ persona: this.developmentPersona }) })
          .then(async response => {
            if (!response.ok) throw new Error('No se pudo iniciar la sesión de desarrollo del backend.')
            const body = await response.json()
            if (typeof body.accessToken !== 'string') throw new Error('Respuesta de autenticación no válida.')
            return body.accessToken as string
          })
      } else this.token = Promise.reject(new Error('Configura un proveedor de sesión OIDC para conectar esta interfaz a la API.'))
      this.token.catch(() => { this.token = undefined })
    }
    return this.token
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.accessToken()
    const response = await fetch(`/api/v1${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers } })
    if (!response.ok) {
      if (response.status === 401) this.token = undefined
      const body = await response.json().catch(() => null)
      const missing = body?.error?.code === 'metadata_incomplete' && Array.isArray(body?.error?.details?.missingMetadata)
        ? body.error.details.missingMetadata.filter((field: unknown): field is string => typeof field === 'string' && Object.hasOwn(metadataLabels, field) && field !== 'loadReference') : []
      throw new ApiRequestError(response.status, typeof body?.error?.code === 'string' ? body.error.code : 'api_error', body?.error?.message ?? `La API respondió con error ${response.status}.`, missing)
    }
    return response.json() as Promise<T>
  }

  private async all<T>(path: string, signal?: AbortSignal): Promise<T[]> {
    const items: T[] = []
    for (let offset = 0; offset <= 10000; offset += 100) {
      const page = await this.request<{ items: T[]; total: number }>(`${path}?limit=100&offset=${offset}`, { signal })
      items.push(...page.items)
      if (items.length >= page.total) return items
      if (!page.items.length) throw new Error('La paginación de la API no avanzó.')
    }
    throw new Error('El catálogo excede el alcance de esta vista; utiliza una consulta paginada.')
  }

  async load(signal?: AbortSignal) {
    const [kpis, dashboards] = await Promise.all([this.all<PublishedKpi>('/kpis', signal), this.all<LocalDashboard>('/dashboards', signal)])
    return { kpis, dashboards }
  }

  async createDashboard(name: string) {
    const key = this.creationKeys.get(name) ?? crypto.randomUUID()
    this.creationKeys.set(name, key)
    const result = await this.request<LocalDashboard>('/dashboards', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ name }) })
    this.creationKeys.delete(name)
    return result
  }

  addKpi(dashboard: LocalDashboard, kpi: PublishedKpi) {
    return this.request<LocalDashboard>(`/dashboards/${encodeURIComponent(dashboard.id)}/widgets/${encodeURIComponent(kpi.id)}`, { method: 'PUT', headers: { 'If-Match': `"${dashboard.version}"` }, body: JSON.stringify({ kpiId: kpi.id, modelVersion: kpi.modelVersion }) })
  }

  query(kpi: PublishedKpi, modelVersion: number, period: QueryPeriod, signal?: AbortSignal) {
    return this.request<QueryResult>('/queries', { method: 'POST', signal, body: JSON.stringify({ kpiId: kpi.id, modelVersion, ...period }) })
  }
}
