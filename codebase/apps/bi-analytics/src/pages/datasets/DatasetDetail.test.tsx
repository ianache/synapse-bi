import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import { DatasetDetail } from './DatasetDetail'
import { dataset } from './testFixtures'

it('shows historical source, pending governance and constraints without claiming dataset uniqueness', async () => {
  const repo = new DatasetsRepository()
  vi.spyOn(repo, 'get').mockResolvedValue(dataset)
  vi.spyOn(repo, 'me').mockResolvedValue({ scopes: ['datasets:read'] })
  render(<DatasetDetail id="d1" repository={repo} />)
  await screen.findByRole('heading', { name: 'Ventas' })
  expect(screen.getByText(/Instantánea histórica/)).toBeInTheDocument()
  expect(screen.getByText('Validación de gobierno pendiente')).toBeInTheDocument()
  expect(screen.getByText('Frescura: sin evaluar')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('tab', { name: 'Restricciones del origen' }))
  expect(screen.getByText(/tenant_id, sales_line_key/)).toBeInTheDocument()
  expect(screen.getByText(/No demuestra unicidad/)).toBeInTheDocument()
  expect(screen.queryByText(/^Aprobado$/)).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Editar metadatos' })).not.toBeInTheDocument()
})
