import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { SemanticCatalogWorkspace } from './SemanticCatalogWorkspace'
import { domain, repository } from './testFixtures'

it('opens a new measure with the chosen domain without inventing persisted metadata', async () => {
  const repo = repository()
  vi.spyOn(repo, 'me').mockResolvedValue({scopes: ['semantic:read', 'semantic:write']})
  vi.spyOn(repo, 'all').mockResolvedValue([domain])
  render(<SemanticCatalogWorkspace repository={repo} path="/catalogo-semantico/components/nuevo" search="?kind=measure&domainId=d" />)
  expect(await screen.findByLabelText('Tipo')).toHaveValue('measure')
  expect(screen.getByLabelText('Dominio')).toHaveValue('d')
  expect(screen.getByLabelText('Nombre')).toHaveValue('')
})

it('keeps the selected domain when opening a new KPI', async () => {
  const repo = repository()
  vi.spyOn(repo, 'me').mockResolvedValue({scopes: ['semantic:read', 'semantic:write']})
  vi.spyOn(repo, 'all').mockResolvedValue([domain])
  render(<SemanticCatalogWorkspace repository={repo} path="/catalogo-semantico/kpi-definitions/nuevo" search="?domainId=d" />)
  expect(await screen.findByLabelText('Dominio')).toHaveValue('d')
})
