import { useState } from 'react'
import type { Component, Domain, KpiDefinition, SaveKpiDefinition } from '../../domain/semanticCatalog'
import { semanticLabels } from '../../domain/semanticCatalog'
import type { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import { DraftForm, TextField } from './DraftForm'

const fields = ['definition', 'formula', 'unit', 'grain', 'owner', 'steward', 'classification', 'accessPolicy', 'freshnessExpectation', 'qualityExpectation', 'filters', 'nullPolicy', 'returnPolicy', 'lateDataPolicy', 'validFrom', 'validTo'] as const
function input(item?: KpiDefinition): SaveKpiDefinition {
  return {name: item?.name ?? '', domainId: item?.domainId ?? '', dimensionIds: item?.dimensionIds ?? [], measureIds: item?.measureIds ?? [],
    ...Object.fromEntries(fields.map(field => [field, item?.[field] ?? null]))}
}
export function KpiDefinitionForm({repository, domains, components, initial, onSaved, defaultDomainId = ''}: {repository: SemanticCatalogRepository; domains: Domain[]; components: Component[]; initial?: KpiDefinition; onSaved: (item: KpiDefinition) => void; defaultDomainId?: string}) {
  const [body, setBody] = useState(() => initial ? input(initial) : {...input(), domainId: defaultDomainId})
  return <DraftForm body={body} initial={initial} title={initial ? 'Editar definición KPI' : 'Crear definición KPI'} onSaved={onSaved}
    reload={initial ? () => repository.get('kpi-definitions', initial.id) : undefined} onReload={item => setBody(input(item))}
    save={async (draft, key, version) => { if (initial) return repository.update('kpi-definitions', {...initial, version: version!}, draft); const saved = await repository.createKpi(draft, key); return repository.get('kpi-definitions', saved.id) }}>
    <TextField label="Nombre" value={body.name} required maxLength={100} onChange={name => setBody({...body, name})} />
    <label>Dominio<select aria-label="Dominio" required disabled={!!initial} value={body.domainId} onChange={e => setBody({...body, domainId: e.target.value, dimensionIds: [], measureIds: []})}><option value="">Seleccionar dominio</option>{domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <fieldset><legend>Componentes reutilizables (opcionales en borrador)</legend>{components.filter(c => c.domainId === body.domainId).map(c => {
      const field = c.kind === 'dimension' ? 'dimensionIds' : 'measureIds', selected = body[field] ?? []
      return <label className="semantic-check" key={c.id}><input type="checkbox" aria-label={c.name} checked={selected.includes(c.id)} onChange={e => setBody({...body, [field]: e.target.checked ? [...selected, c.id] : selected.filter(id => id !== c.id)})} />{c.name} · {c.kind === 'dimension' ? 'Dimensión' : 'Medida'} · {c.completeness === 'complete' ? 'Documentación completa' : 'Documentación incompleta'}</label>
    })}</fieldset>
    <p>Texto documentado — sin ejecutar. Los nombres escritos no crean referencias automáticamente.</p>
    {fields.map(field => <TextField key={field} label={semanticLabels[field]} value={body[field]} maxLength={field === 'formula' ? 8000 : ['definition', 'filters', 'nullPolicy', 'returnPolicy', 'lateDataPolicy'].includes(field) ? 2000 : 500}
      multiline={['definition', 'formula', 'filters', 'nullPolicy', 'returnPolicy', 'lateDataPolicy'].includes(field)} onChange={value => setBody({...body, [field]: value || null})} />)}
    <p>Vigencias: fecha/hora RFC3339 con zona, por ejemplo 2026-10-17T00:00:00Z. Hasta es opcional.</p>
  </DraftForm>
}
