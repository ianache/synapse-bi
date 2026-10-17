import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CatalogList } from './CatalogList'
import { repository } from './testFixtures'

it('shows an empty state without fabricated examples or computed KPI values', async () => {
  const repo = repository()
  vi.spyOn(repo, 'list').mockResolvedValue({items: [], total: 0, limit: 25, offset: 0})
  render(<CatalogList repository={repo} canWrite={true} />)
  expect(await screen.findByText('Todavía no hay elementos.')).toBeInTheDocument()
  expect(screen.getByRole('link', {name: 'Crear dominio'})).toBeInTheDocument()
  expect(screen.queryByText('Logística')).not.toBeInTheDocument()
})
