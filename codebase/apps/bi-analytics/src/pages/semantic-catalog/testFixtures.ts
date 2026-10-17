import { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { ApiRepository } from '../../adapters/apiRepository'
import type { Domain, Component, KpiDefinition } from '../../domain/semanticCatalog'
afterEach(() => { cleanup(); vi.restoreAllMocks() })
export const metadata = {id: 'd', version: 1, createdAt: '2026-10-17T00:00:00Z', updatedAt: '2026-10-17T00:00:00Z', status: 'draft' as const, governanceValidation: 'pending' as const,
  completeness: 'incomplete' as const, missingMetadata: ['owner'], warnings: []}
export const domain: Domain = {...metadata, name: 'Logística', description: '', owner: null}
export const measure: Component = {...metadata, id: 'm', name: 'Tiempo', domainId: 'd', kind: 'measure', definition: null, grain: null,
  unit: null, aggregation: null, synonyms: [], binding: null, bindingSnapshot: null, bindingStatus: 'absent', protected: true, consumerCount: 2, copyOriginId: null}
export const kpi: KpiDefinition = {...metadata, id: 'k', name: 'Entrega puntual', domainId: 'd', measureIds: ['m'], dimensionIds: []}
export const repository = () => new SemanticCatalogRepository(new ApiRepository(false, async () => 'token'))
