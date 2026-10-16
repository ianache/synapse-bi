import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useCallback } from 'react'
import { useDatasetResource } from './useDatasetResource'

it('ignores late responses of the previous resource even if transport ignores abort', async () => {
  const resolve: Record<string, (value: string) => void> = {}
  const hook = renderHook(({ id }) => useDatasetResource(useCallback(() => new Promise<string>(r => { resolve[id] = r }), [id]), id), { initialProps: { id: 'old' } })
  hook.rerender({ id: 'new' })
  act(() => resolve.new('current'))
  await waitFor(() => expect(hook.result.current.data).toBe('current'))
  act(() => resolve.old('stale'))
  expect(hook.result.current.data).toBe('current')
  expect(hook.result.current.loading).toBe(false)
})
