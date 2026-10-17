import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { SemanticDetail } from './SemanticDetail'
import { measure, repository } from './testFixtures'

it('shows protected component, consumers and stale binding without editable original', async () => {
  const repo = repository()
  vi.spyOn(repo, 'get').mockResolvedValue({...measure, bindingStatus: 'column_removed', warnings: ['binding_column_removed']})
  vi.spyOn(repo, 'consumers').mockResolvedValue({items: [{id: 'k', name: 'Entrega puntual', version: 1, domainId: 'd'}], total: 1, limit: 25, offset: 0})
  render(<SemanticDetail repository={repo} kind="components" id="m" canWrite={true} />)
  expect(await screen.findByText('Tiempo')).toBeInTheDocument()
  expect(screen.getByText(/Vinculación desactualizada/)).toBeInTheDocument()
  expect(screen.queryByRole('link', {name: 'Editar'})).not.toBeInTheDocument()
  expect(screen.getByRole('button', {name: 'Crear copia'})).toBeInTheDocument()
})
