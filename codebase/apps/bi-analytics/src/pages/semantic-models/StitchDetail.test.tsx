import {render, screen} from '@testing-library/react'
import {expect, it, vi} from 'vitest'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {ModelDetail} from './ModelDetail'
import {detail, draft} from './testFixtures'

it('shows the saved version history below captured content without hiding the capture when history fails', async () => {
  const repository = new SemanticModelsRepository()
  vi.spyOn(repository, 'drafts').mockRejectedValue(new Error('Historial temporalmente no disponible'))
  render(<ModelDetail repository={repository} detail={detail} canWrite />)
  expect(screen.getByRole('heading', {name: 'Historial de versiones'})).toBeInTheDocument()
  await screen.findByRole('alert')
  expect(screen.getByText('SUM(tiempo)')).toBeInTheDocument()
  expect(screen.getByText(`Borrador ${draft.sequence} · revisión ${draft.revision}`)).toBeInTheDocument()
})
