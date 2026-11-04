import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreparedVersionDetail } from './PreparedVersionDetail'

vi.mock('../../adapters/datasetsRepository', () => ({
  DatasetsRepository: class { get = vi.fn().mockResolvedValue({ origin: { schema: 'gold', object: 'fact_sales' } }) },
}))
afterEach(() => cleanup())

describe('prepared version lineage', () => {
  it('renders dataset and process names instead of their identifiers', async () => {
    const repository = {
      versions: vi.fn().mockResolvedValue({ items: [{ datasetId: 'dataset-1', versionId: 'version-2', versionNumber: 2, inputDatasetId: 'input-1', processId: 'sales-cdc-v1', processConfig: {}, runId: 'run-1', sourceRangeStart: null, sourceRangeEnd: null, eventCount: 1, createdAt: '2026-11-03T12:00:00Z' }] }),
      history: vi.fn().mockResolvedValue({ items: [] }), currentState: vi.fn().mockResolvedValue({ items: [] }),
    }
    render(<PreparedVersionDetail datasetId="dataset-1" versionId="version-2" repository={repository as never} preparedDatasetName="Ventas preparadas" />)
    expect(await screen.findByText('Ventas preparadas')).toBeTruthy()
    expect(screen.getAllByText('Pipeline CDC / Captura').length).toBeGreaterThan(0)
    expect(screen.queryByText('sales-cdc-v1')).toBeNull()
  })
})
