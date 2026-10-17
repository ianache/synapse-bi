import type { Binding, Component, SaveComponent, SaveKpiDefinition } from './semanticCatalog'

export interface KpiCapture extends SaveKpiDefinition {id: string; version: number; dimensionIds: string[]; measureIds: string[]}
export interface ComponentCapture extends SaveComponent {id: string; version: number; binding?: Binding | null; bindingSnapshot: Component['bindingSnapshot']}
export interface Capture {domain: {id: string; name: string; version: number}; kpis: KpiCapture[]; components: ComponentCapture[]}
export interface SemanticModel {id: string; domainId: string; name: string; description: string; createdBy: string; createdAt: string; updatedAt: string; revision: number}
export interface DraftSummary {id: string; sequence: number; revision: number; status: 'draft'; semanticVersion: null; capturedAt: string; updatedAt: string; kpiCount: number; componentCount: number}
export interface ModelDraft {id: string; modelId: string; sequence: number; revision: number; status: 'draft'; semanticVersion: null; kpiIds: string[]; capture: Capture; captureDigest: string; capturedAt: string; createdBy: string; createdAt: string; updatedAt: string; parentDraftId: string | null; completeness: 'complete' | 'incomplete'; missingMetadata: string[]}
export interface ModelDetailRecord {model: SemanticModel; draft: ModelDraft}
export interface ModelItem extends SemanticModel {latestDraft: DraftSummary}
export interface ModelPage<T> {items: T[]; total: number; limit: number; offset: number}
export interface ModelFilters {q?: string; domainId?: string; limit?: number; offset?: number}
export interface CreateModel {name: string; description?: string; domainId: string; kpiIds: string[]}
export interface CaptureChange {kind: 'kpi' | 'component' | 'domain'; id: string; field: string; change: 'added' | 'removed' | 'modified'; before: unknown; after: unknown}
export interface ModelPreview {candidateDigest: string; candidateCapture: Capture; changes: CaptureChange[]; checkedAt: string; baseRevision: number}
export interface ModelComparison {left: DraftSummary; right: DraftSummary; changes: CaptureChange[]}
export const modelPath = (id: string) => `/modelos-semanticos/${encodeURIComponent(id)}`
export const draftPath = (modelId: string, draftId: string) => `${modelPath(modelId)}/borradores/${encodeURIComponent(draftId)}`
export const modelReadable = (scopes: string[]) => ['models:read', 'semantic:read', 'datasets:read', 'sources:read'].every(s => scopes.includes(s))
export const modelWritable = (scopes: string[]) => modelReadable(scopes) && ['models:write', 'semantic:write'].every(s => scopes.includes(s))
