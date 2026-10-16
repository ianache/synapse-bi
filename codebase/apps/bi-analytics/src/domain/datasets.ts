import type { Column, Constraint } from './observations'

export interface Origin { sourceId: string; observationId: string; schema: string; object: string }
export interface Governance { owner: string | null; classification: string | null; freshnessExpectation: string | null; loadReference: string | null }
export interface Preparation { processReference: string | null; inputOrigins: Origin[] }
export interface Medallion { schemaDescription: string | null; partitionPolicy: string | null; retentionPolicy: string | null; minimumQuality: string | null; tenantPolicy: string | null }
export interface SaveDataset {
  name: string; description: string; kind: 'direct' | 'prepared'; saveAs: 'draft' | 'registered'; origin: Origin
  selectedColumns: string[]; governance: Governance; preparation: Preparation | null; medallion: Medallion | null
}
export interface DatasetOrigin extends Origin { sourceName: string; kind: string; observedAt: string; sourceVersion: number; currentSourceVersion: number }
export interface DatasetSummary {
  id: string; name: string; kind: 'direct' | 'prepared'; registrationStatus: 'draft' | 'registered'; completeness: 'complete' | 'incomplete'
  missingMetadata: string[]; governanceValidation: 'pending'; origin: DatasetOrigin; version: number; createdAt: string; updatedAt: string; createdBy: string
}
export interface Dataset extends DatasetSummary {
  description: string; selectedColumns: Column[]; sourceConstraints: Constraint[]; governance: Governance; preparation: Preparation | null; medallion: Medallion | null
  freshness: { status: 'not_evaluated' }; quality: { status: 'not_evaluated' }
  lineage: { output: Origin; datasetId: string; inputOrigins: Origin[]; processReference: string | null }
}
export interface DatasetPage { items: DatasetSummary[]; total: number; limit: number; offset: number }
export interface DatasetFilters { q?: string; kind?: 'direct' | 'prepared'; registrationStatus?: 'draft' | 'registered'; completeness?: 'complete' | 'incomplete'; limit?: number; offset?: number }

export const metadataLabels: Record<string, string> = { owner: 'Responsable declarado', classification: 'Clasificación declarada', freshnessExpectation: 'Expectativa de frescura', loadReference: 'Referencia de carga',
  'preparation.processReference': 'Referencia del proceso', 'preparation.inputOrigins': 'Orígenes de entrada',
  'medallion.schemaDescription': 'Descripción del esquema', 'medallion.partitionPolicy': 'Política de particiones', 'medallion.retentionPolicy': 'Política de retención', 'medallion.minimumQuality': 'Calidad mínima declarada', 'medallion.tenantPolicy': 'Política de tenant' }
export const writable = (scopes: string[]) => ['datasets:read', 'datasets:write', 'sources:read'].every(scope => scopes.includes(scope))
export const datasetPath = (id: string) => `/datasets/${encodeURIComponent(id)}`
