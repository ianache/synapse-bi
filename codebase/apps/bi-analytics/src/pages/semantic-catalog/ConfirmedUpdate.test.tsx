import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { DomainForm } from './DomainForm'
import { ComponentForm } from './ComponentForm'
import { KpiDefinitionForm } from './KpiDefinitionForm'
import { domain, measure, kpi, repository } from './testFixtures'

it.each(['domain', 'component', 'kpi'] as const)('keeps confirmed %s update even if a follow-up read is unavailable', async kind => {
  const repo = repository(), done = vi.fn()
  const initial = kind === 'domain' ? domain : kind === 'component' ? {...measure, protected: false} : kpi
  const confirmed = {...initial, version: 2}
  const update = vi.spyOn(repo, 'update').mockResolvedValue(confirmed)
  const get = vi.spyOn(repo, 'get').mockRejectedValue(new TypeError('Refresh unavailable'))
  if (kind === 'domain') render(<DomainForm repository={repo} initial={domain} onSaved={done} />)
  else if (kind === 'component') render(<ComponentForm repository={repo} domains={[domain]} initial={{...measure, protected: false}} onSaved={done} />)
  else render(<KpiDefinitionForm repository={repo} domains={[domain]} components={[measure]} initial={kpi} onSaved={done} />)
  await userEvent.click(screen.getByRole('button', {name: 'Guardar borrador'}))
  await waitFor(() => expect(done).toHaveBeenCalledWith(confirmed))
  expect(update).toHaveBeenCalledOnce()
  expect(get).not.toHaveBeenCalled()
  expect(screen.queryByText('Reintentar guardado')).not.toBeInTheDocument()
})
