import { useCallback, useState } from 'react'
import { DatasetsRepository } from '../../adapters/datasetsRepository'
import type { Binding } from '../../domain/semanticCatalog'
import { useSemanticCatalogResource } from '../../hooks/useSemanticCatalogResource'

const datasets = new DatasetsRepository()
export function BindingPicker({value, onChange}: {value: Binding; onChange: (value: Binding) => void}) {
  const [q, setQ] = useState(''), [offset, setOffset] = useState(0)
  const list = useSemanticCatalogResource(useCallback(signal => datasets.list({q, offset, limit: 100}, signal), [q, offset]), `binding-datasets/${q}/${offset}`)
  const selected = useSemanticCatalogResource(useCallback(signal => value.datasetId ? datasets.get(value.datasetId, signal) : Promise.resolve(undefined), [value.datasetId]), value.datasetId)
  return <div className="semantic-binding">
    <p>Selecciona un dataset visible y una columna. No se leen filas ni se infiere grano.</p>
    <label>Buscar dataset<input type="search" maxLength={100} value={q} onChange={e => {setQ(e.target.value); setOffset(0)}} /></label>
    {(list.error || selected.error) && <p role="alert">{list.error?.message ?? selected.error?.message}</p>}
    <label>Dataset<select aria-label="Dataset" required value={value.datasetId} onChange={e => onChange({datasetId: e.target.value, column: ''})}>
      <option value="">Seleccionar dataset</option>{value.datasetId && !list.data?.items.some(d => d.id === value.datasetId) && <option value={value.datasetId}>Vinculación histórica</option>}
      {list.data?.items.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select></label>
    <div className="semantic-actions"><button type="button" className="source-button" disabled={!offset} onClick={() => setOffset(offset - 100)}>Datasets anteriores</button><button type="button" className="source-button" disabled={!list.data || offset + list.data.items.length >= list.data.total} onClick={() => setOffset(offset + 100)}>Más datasets</button></div>
    <label>Columna<select aria-label="Columna" required value={value.column} onChange={e => onChange({...value, column: e.target.value})}>
      <option value="">Seleccionar columna</option>{value.column && !selected.data?.selectedColumns.some(c => c.name === value.column) && <option value={value.column}>{value.column} (histórica)</option>}
      {selected.data?.selectedColumns.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
    </select></label>
  </div>
}
