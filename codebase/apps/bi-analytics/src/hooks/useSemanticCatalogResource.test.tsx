import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { useSemanticCatalogResource } from './useSemanticCatalogResource'

it('aborts old resource on navigation and does not apply an out of order response', async () => {
  let resolveOld!: (value: string) => void
  let oldSignal!: AbortSignal
  const old = (signal: AbortSignal) => { oldSignal = signal; return new Promise<string>(resolve => { resolveOld = resolve }) }
  const current = async () => 'new domain'
  const hook = renderHook(({load, id}) => useSemanticCatalogResource(load, id), {initialProps: {load: old, id: 'old'}})
  hook.rerender({load: current, id: 'new'})
  await waitFor(() => expect(hook.result.current.data).toBe('new domain'))
  await act(async () => resolveOld('obsolete'))
  expect(oldSignal.aborted).toBe(true)
  expect(hook.result.current.data).toBe('new domain')
})
