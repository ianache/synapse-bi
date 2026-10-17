import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { KpiDefinitionForm } from './KpiDefinitionForm'
import { domain, kpi, measure, repository } from './testFixtures'

it('documents formula without execution and selects explicit shared components', async () => {
  const repo = repository(), done = vi.fn()
  const create = vi.spyOn(repo, 'createKpi').mockResolvedValue(kpi)
  vi.spyOn(repo, 'get').mockResolvedValue(kpi)
  render(<KpiDefinitionForm repository={repo} domains={[domain]} components={[measure]} onSaved={done} />)
  await userEvent.type(screen.getByLabelText('Nombre'), 'Entrega puntual')
  await userEvent.selectOptions(screen.getByLabelText('Dominio'), 'd')
  await userEvent.click(screen.getByLabelText('Tiempo'))
  await userEvent.type(screen.getByLabelText('Fórmula documentada'), 'Tiempo / entregas')
  expect(screen.queryByRole('button', {name: /Ejecutar|Publicar/})).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(done).toHaveBeenCalled())
  expect(create.mock.calls[0][0]).toMatchObject({measureIds: ['m'], formula: 'Tiempo / entregas', dimensionIds: []})
})
