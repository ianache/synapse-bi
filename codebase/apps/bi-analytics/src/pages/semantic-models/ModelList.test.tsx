import {render, screen} from '@testing-library/react'
import {expect, it, vi} from 'vitest'
import {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import {ModelList} from './ModelList'
import {catalogRepository, domain, detail, draft} from './testFixtures'

it('shows only server models and honest page counts without fake certification or export', async () => {
  const repository = new SemanticModelsRepository(), catalog = catalogRepository()
  vi.spyOn(catalog, 'all').mockResolvedValue([domain] as never)
  vi.spyOn(repository, 'list').mockResolvedValue({items: [{...detail.model, latestDraft: {...draft, kpiCount: 1, componentCount: 1}}], total: 51, limit: 25, offset: 0})
  render(<ModelList repository={repository} catalogRepository={catalog} canWrite />)
  expect(await screen.findByRole('link', {name: 'Abrir Modelo propio'})).toBeInTheDocument()
  expect(screen.getByText('51 modelos')).toBeInTheDocument()
  expect(screen.queryByRole('button', {name: /Exportar/})).not.toBeInTheDocument()
})
