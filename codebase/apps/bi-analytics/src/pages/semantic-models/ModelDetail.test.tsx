import {render, screen} from '@testing-library/react'
import {expect, it, vi} from 'vitest'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {ModelDetail} from './ModelDetail'
import {detail} from './testFixtures'

it('renders captured formula and unchecked catalog status without fetching the current catalog', () => {
  const repository = new SemanticModelsRepository()
  vi.spyOn(repository, 'drafts').mockResolvedValue({items: [], total: 0, limit: 25, offset: 0})
  const read = vi.spyOn(repository, 'preview')
  render(<ModelDetail repository={repository} detail={detail} canWrite />)
  expect(screen.getByText('SUM(tiempo)')).toBeInTheDocument()
  expect(screen.getByText('Cambios del catálogo: no comprobados')).toBeInTheDocument()
  expect(read).not.toHaveBeenCalled()
  expect(screen.queryByRole('button', {name: 'Publicar'})).not.toBeInTheDocument()
})
