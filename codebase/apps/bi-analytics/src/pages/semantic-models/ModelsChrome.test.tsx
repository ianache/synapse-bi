import {render, screen, within} from '@testing-library/react'
import {expect, it} from 'vitest'
import {CaptureSummary, ModelNotice} from './ModelsChrome'
import {SynapseShell} from '../../components/SynapseShell'
import {draft} from './testFixtures'

it('exposes captured dependency identifiers and physical lineage without inventing a source', () => {
  render(<CaptureSummary capture={{...draft.capture, components: [{...draft.capture.components[0], id: 'measure-ops', bindingSnapshot: {
    datasetId: 'dataset-ops', datasetVersion: 4, sourceId: 'source-ops', observationId: 'observation-ops', schema: 'gold', object: 'operations', column: 'duration', columnType: 'numeric',
  }}]}} />)
  const summary = within(screen.getByRole('complementary', {name: 'Resumen de la captura'}))
  expect(summary.getByText('measure-ops', {exact: false})).toBeInTheDocument()
  expect(summary.getByText('gold.operations.duration', {exact: false})).toBeInTheDocument()
  expect(summary.getByText('Dataset dataset-ops · revisión 4')).toBeInTheDocument()
  expect(summary.queryByText('Retail Gold · Laboratorio')).not.toBeInTheDocument()
})
it('identifies the governance warning separately from save actions', () => {
  render(<ModelNotice />)
  const notice = within(screen.getByRole('note'))
  expect(notice.getByText('Aviso normativo de gobernanza')).toBeInTheDocument()
  expect(notice.getByText('Guardar no publica, certifica ni calcula.')).toBeInTheDocument()
  expect(notice.queryByRole('button')).not.toBeInTheDocument()
})
it('keeps the models navigation grouped as Stitch governance without exposing fake operations', () => {
  render(<SynapseShell active="models" breadcrumb="Modelos semánticos"><p>Contenido</p></SynapseShell>)
  const nav = within(screen.getByRole('navigation', {name: 'Navegación principal'}))
  expect(nav.getByText('General')).toBeInTheDocument()
  expect(nav.getByText('Gobernanza & Semántica')).toBeInTheDocument()
  expect(nav.getByRole('link', {name: 'Modelos semánticos'})).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('button', {name: 'Configuración · no disponible'})).toBeDisabled()
  expect(screen.queryByRole('button', {name: 'Exportar'})).not.toBeInTheDocument()
})
