import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiRepository } from './apiRepository'

afterEach(() => vi.unstubAllGlobals())

describe('API repository', () => {
  it('uses explicit development auth once, then a bearer header and paginates', async () => {
    const mock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ accessToken: 'development-token' })))
      .mockImplementation(async (url: string) => new Response(JSON.stringify({ items: [{ id: url.includes('kpis') ? 'k1' : 'd1' }], total: 1 })))
    vi.stubGlobal('fetch', mock)
    const repository = new ApiRepository(true)
    const data = await repository.load()
    expect(data.kpis).toHaveLength(1)
    expect(data.dashboards).toHaveLength(1)
    expect(mock.mock.calls.filter(([url]) => url === '/api/v1/auth/dev-session')).toHaveLength(1)
    expect(mock.mock.calls.find(([url]) => url.includes('/kpis'))?.[1].headers.Authorization).toBe('Bearer development-token')
  })

  it('propagates API failures instead of returning local fixtures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify({ error: { message: 'Acceso denegado' } }), { status: 403 })))
    const repository = new ApiRepository(false, async () => 'oidc-token')
    await expect(repository.load()).rejects.toThrow('Acceso denegado')
  })

  it('requires an identity provider unless development auth was explicitly enabled', async () => {
    const mock = vi.fn()
    vi.stubGlobal('fetch', mock)
    await expect(new ApiRepository().load()).rejects.toThrow('proveedor de sesión OIDC')
    expect(mock).not.toHaveBeenCalled()
  })

  it('reuses creation idempotency keys after an ambiguous network failure', async () => {
    const mock = vi.fn().mockRejectedValueOnce(new Error('Network failure')).mockResolvedValueOnce(new Response(JSON.stringify({ id: 'new' })))
    vi.stubGlobal('fetch', mock)
    const repository = new ApiRepository(false, async () => 'oidc-token')
    await expect(repository.createDashboard('Ventas')).rejects.toThrow('Network failure')
    await repository.createDashboard('Ventas')
    expect(mock.mock.calls[0][1].headers['Idempotency-Key']).toBe(mock.mock.calls[1][1].headers['Idempotency-Key'])
  })
})
