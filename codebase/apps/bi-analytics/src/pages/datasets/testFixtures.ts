import type { Dataset, SaveDataset } from '../../domain/datasets'

export const draft: SaveDataset = { name: 'Ventas', description: '', kind: 'direct', saveAs: 'draft',
  origin: { sourceId: 's1', observationId: 'o1', schema: 'gold', object: 'fact_sales' }, selectedColumns: ['tenant_id'],
  governance: { owner: null, classification: null, freshnessExpectation: null, loadReference: null }, preparation: null, medallion: null }
export const dataset: Dataset = { id: 'd1', name: 'Ventas', description: '', kind: 'direct', registrationStatus: 'draft', completeness: 'incomplete',
  missingMetadata: ['owner', 'classification', 'freshnessExpectation'], governanceValidation: 'pending',
  origin: { ...draft.origin, sourceName: 'Laboratorio', kind: 'table', observedAt: '2026-10-16T00:00:00Z', sourceVersion: 1, currentSourceVersion: 2 },
  selectedColumns: [{ name: 'tenant_id', position: 1, type: 'text', nullable: false, generated: false, comment: null }],
  sourceConstraints: [{ name: 'sales_pk', kind: 'p', columns: ['tenant_id', 'sales_line_key'], referencedSchema: null, referencedTable: null, referencedColumns: [] }],
  governance: draft.governance, preparation: null, medallion: null, freshness: { status: 'not_evaluated' }, quality: { status: 'not_evaluated' },
  lineage: { output: draft.origin, datasetId: 'd1', inputOrigins: [], processReference: null }, version: 1,
  createdAt: '2026-10-16T00:00:00Z', updatedAt: '2026-10-16T00:00:00Z', createdBy: 'technical-admin' }
