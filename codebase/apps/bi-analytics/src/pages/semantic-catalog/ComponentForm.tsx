import { useState } from 'react'
import type { Component, Domain, SaveComponent } from '../../domain/semanticCatalog'
import type { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import { DraftForm, TextField } from './DraftForm'
import { BindingPicker } from './BindingPicker'

const input = (item?: Component): SaveComponent => ({name: item?.name ?? '', domainId: item?.domainId ?? '', kind: item?.kind ?? 'dimension', definition: item?.definition ?? null,
  grain: item?.grain ?? null, unit: item?.unit ?? null, aggregation: item?.aggregation ?? null, synonyms: item?.synonyms ?? [],
  ...(item?.bindingStatus === 'unavailable' ? {} : {binding: item?.binding ?? null})})
export function ComponentForm({repository, domains, initial, onSaved, defaultKind = 'dimension', defaultDomainId = ''}: {repository: SemanticCatalogRepository; domains: Domain[]; initial?: Component; onSaved: (item: Component) => void; defaultKind?: 'dimension' | 'measure'; defaultDomainId?: string}) {
  const [body, setBody] = useState(() => initial ? input(initial) : {...input(), kind: defaultKind, domainId: defaultDomainId})
  const [synonymText, setSynonymText] = useState(initial?.synonyms?.join('; ') ?? '')
  return <DraftForm body={body} initial={initial} title={initial ? 'Editar componente' : 'Crear componente'} protected={initial?.protected} onSaved={onSaved}
    reload={initial ? () => repository.get('components', initial.id) : undefined} onReload={item => {setBody(input(item)); setSynonymText(item.synonyms?.join('; ') ?? '')}}
    save={async (draft, key, version) => { if (initial) return repository.update('components', {...initial, version: version!}, draft); const saved = await repository.createComponent(draft, key); return repository.get('components', saved.id) }}>
    <TextField label="Nombre" value={body.name} required maxLength={100} onChange={name => setBody({...body, name})} />
    <label>Dominio<select aria-label="Dominio" required disabled={!!initial} value={body.domainId} onChange={e => setBody({...body, domainId: e.target.value})}><option value="">Seleccionar dominio</option>{domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
    <label>Tipo<select aria-label="Tipo" disabled={!!initial} value={body.kind} onChange={e => setBody({...body, kind: e.target.value === 'measure' ? 'measure' : 'dimension', unit: null, aggregation: null})}><option value="dimension">Dimensión</option><option value="measure">Medida</option></select></label>
    <TextField label="Definición" value={body.definition} multiline maxLength={2000} onChange={definition => setBody({...body, definition: definition || null})} />
    <TextField label="Grano" value={body.grain} onChange={grain => setBody({...body, grain: grain || null})} />
    {body.kind === 'measure' && <><TextField label="Unidad" value={body.unit} onChange={unit => setBody({...body, unit: unit || null})} /><TextField label="Agregación declarada" value={body.aggregation} onChange={aggregation => setBody({...body, aggregation: aggregation || null})} /></>}
    <TextField label="Sinónimos (separados por punto y coma)" value={synonymText} maxLength={2100} onChange={value => {setSynonymText(value); setBody({...body, synonyms: value.split(';').map(v => v.trim()).filter(Boolean)})}} />
    {initial?.bindingStatus === 'unavailable' ? <p>Origen no visible. Se conserva sin cambios al guardar los metadatos semánticos.</p> : <label className="semantic-check"><input type="checkbox" checked={!!body.binding} onChange={e => setBody({...body, binding: e.target.checked ? {datasetId: '', column: ''} : null})} />Declarar vínculo a datos (opcional)</label>}
    {body.binding && <BindingPicker value={body.binding} onChange={binding => setBody({...body, binding})} />}
    {initial?.bindingStatus && !['current', 'absent'].includes(initial.bindingStatus) && <p role="status">Vinculación desactualizada o no disponible. Guardar otros campos conserva su historia.</p>}
  </DraftForm>
}
