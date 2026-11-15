import { cleanup, fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PreparationRunDetail } from './PreparationRunDetail'

afterEach(() => cleanup())

describe('manual CDC retry editor', () => {
  it('requires a non-empty JSON array of event objects before retrying', async () => {
    const retry = vi.fn().mockResolvedValue({ id: 'run-next' })
    const repository = { run: vi.fn().mockResolvedValue({
      id: 'run-1', pipelineId: 'pipe-1', datasetId: 'dataset-1', processId: 'process-1', origin: 'manual',
      status: 'quality_rejected', startedAt: '2026-11-02T10:00:00Z', endedAt: null, eventCount: 1,
      insertCount: 0, updateCount: 0, deleteCount: 0, rejectedCount: 1, qualityResults: { checks: [] },
      publishedVersion: null, latestSuccessfulVersion: null, retryOfRunId: null,
    }), retry }
    render(<PreparationRunDetail runId="run-1" repository={repository as never} onChanged={() => undefined} />)
    await screen.findByRole('heading', { name: 'Lote no publicado' })
    fireEvent.click(screen.getByRole('button', { name: '↻ Reintentar manualmente' }))
    fireEvent.change(screen.getByLabelText('Eventos CDC (JSON)'), { target: { value: '{no}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar reintento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El JSON no es válido')
    expect(retry).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Eventos CDC (JSON)'), { target: { value: '[{"sourceEventId":"evt-2","businessKey":7,"operation":"insert","eventTimestamp":"2026-11-02T10:01:00Z","afterImage":{}}]' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar reintento' }))
    expect(retry).toHaveBeenCalledWith('run-1', [{ sourceEventId: 'evt-2', businessKey: 7, operation: 'insert', eventTimestamp: '2026-11-02T10:01:00Z', afterImage: {} }])
  })

  it('closes the JSON editor after the retry is accepted', async () => {
    const repository = {
      run: vi.fn().mockResolvedValue({
        id: 'run-1', pipelineId: 'pipe-1', datasetId: 'dataset-1', processId: 'process-1', origin: 'manual',
        status: 'technical_failure', startedAt: '2026-11-02T10:00:00Z', endedAt: '2026-11-02T10:01:00Z', eventCount: 1,
        insertCount: 0, updateCount: 0, deleteCount: 0, rejectedCount: 0, qualityResults: { checks: [] },
        publishedVersion: null, latestSuccessfulVersion: null, retryOfRunId: null,
      }),
      retry: vi.fn().mockResolvedValue({ id: 'run-next' }),
    }
    render(<PreparationRunDetail runId="run-1" repository={repository as never} onChanged={() => undefined} />)
    fireEvent.click(await screen.findByRole('button', { name: /Reintentar manualmente/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(screen.getByLabelText('Eventos CDC (JSON)'), { target: { value: '[{"sourceEventId":"evt-3","businessKey":8,"operation":"insert","eventTimestamp":"2026-11-02T10:01:00Z","afterImage":{}}]' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar reintento' }))
    await waitForElementToBeRemoved(dialog)
    expect(repository.retry).toHaveBeenCalledOnce()
  })
})
