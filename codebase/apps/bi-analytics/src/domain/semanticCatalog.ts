export type ResourceKind = 'domains' | 'components' | 'kpi-definitions'
export interface DraftMetadata {
  id: string; version: number; createdAt: string; updatedAt: string; status: 'draft'; governanceValidation: 'pending'
  completeness: 'complete' | 'incomplete'; missingMetadata: string[]
  warnings: ('binding_dataset_changed' | 'binding_column_removed' | 'binding_unavailable')[]
}
export interface SaveDomain { name: string; description?: string; owner?: string | null }
export interface Binding { datasetId: string; column: string }
export interface SaveComponent {
  name: string; domainId: string; kind: 'dimension' | 'measure'; definition?: string | null; grain?: string | null
  unit?: string | null; aggregation?: string | null; synonyms?: string[]; binding?: Binding | null
}
export interface SaveKpiDefinition {
  name: string; domainId: string; definition?: string | null; formula?: string | null; unit?: string | null; grain?: string | null
  owner?: string | null; steward?: string | null; classification?: string | null; accessPolicy?: string | null
  freshnessExpectation?: string | null; qualityExpectation?: string | null; filters?: string | null; nullPolicy?: string | null
  returnPolicy?: string | null; lateDataPolicy?: string | null; validFrom?: string | null; validTo?: string | null
  dimensionIds?: string[]; measureIds?: string[]
}
export interface Domain extends DraftMetadata, SaveDomain {}
export interface Component extends DraftMetadata, SaveComponent {
  copyOriginId: string | null; protected: boolean; consumerCount: number
  bindingStatus: 'absent' | 'current' | 'dataset_changed' | 'column_removed' | 'unavailable'
  bindingSnapshot: ({ datasetVersion: number; sourceId: string; observationId: string; schema: string; object: string; columnType: string } & Binding) | null
}
export interface KpiDefinition extends DraftMetadata, SaveKpiDefinition {}
export interface RecordMap { domains: Domain; components: Component; 'kpi-definitions': KpiDefinition }
export interface InputMap { domains: SaveDomain; components: SaveComponent; 'kpi-definitions': SaveKpiDefinition }
export type CatalogRecord = RecordMap[ResourceKind]
export interface CatalogPage<T> { items: T[]; total: number; limit: number; offset: number }
export interface CatalogFilters { q?: string; domainId?: string; kind?: 'dimension' | 'measure'; limit?: number; offset?: number }
export interface Consumer { id: string; name: string; version: number; domainId: string }
export const catalogPath = (kind: ResourceKind, id: string) => `/catalogo-semantico/${kind}/${encodeURIComponent(id)}`
export const semanticLabels: Record<string, string> = {
  description: 'Descripción', owner: 'Responsable declarado', definition: 'Definición', grain: 'Grano', binding: 'Vinculación a datos', unit: 'Unidad',
  aggregation: 'Agregación declarada', formula: 'Fórmula documentada', steward: 'Steward declarado', classification: 'Clasificación', accessPolicy: 'Política de acceso',
  freshnessExpectation: 'Expectativa de frescura', qualityExpectation: 'Expectativa de calidad', filters: 'Filtros', nullPolicy: 'Política de nulos',
  returnPolicy: 'Política de devoluciones', lateDataPolicy: 'Política de datos tardíos', validFrom: 'Vigencia desde', validTo: 'Vigencia hasta',
  dimensionIds: 'Dimensiones', measureIds: 'Medidas',
}
export const semanticWritable = (scopes: string[]) => ['semantic:read', 'semantic:write'].every(s => scopes.includes(s))
