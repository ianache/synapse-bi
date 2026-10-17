import type {ModelDetailRecord, ModelDraft, ModelPreview} from '../../domain/semanticModels'
export {domain, measure, kpi, repository as catalogRepository} from '../semantic-catalog/testFixtures'
const stamp = '2026-10-17T10:00:00Z'
export const draft: ModelDraft = {id: 'draft', modelId: 'model', sequence: 1, revision: 1, status: 'draft', semanticVersion: null,
  kpiIds: ['k'], capture: {domain: {id: 'd', name: 'Logística', version: 1}, kpis: [{id: 'k', version: 1, name: 'Entrega puntual', domainId: 'd', formula: 'SUM(tiempo)', measureIds: ['m'], dimensionIds: []}],
    components: [{id: 'm', version: 1, name: 'Tiempo', domainId: 'd', kind: 'measure', bindingSnapshot: null}]},
  captureDigest: 'a'.repeat(64), capturedAt: stamp, createdBy: 'admin', createdAt: stamp, updatedAt: stamp,
  parentDraftId: null, completeness: 'incomplete', missingMetadata: ['kpis.k.owner']}
export const detail: ModelDetailRecord = {model: {id: 'model', domainId: 'd', name: 'Modelo propio', description: '', createdBy: 'admin', createdAt: stamp, updatedAt: stamp, revision: 1}, draft}
export const preview: ModelPreview = {candidateDigest: 'b'.repeat(64), candidateCapture: {...draft.capture, kpis: [{...draft.capture.kpis[0], definition: 'Nueva definición'}]},
  changes: [{kind: 'kpi', id: 'k', field: 'definition', change: 'modified', before: null, after: 'Nueva definición'}], checkedAt: stamp, baseRevision: 1}
