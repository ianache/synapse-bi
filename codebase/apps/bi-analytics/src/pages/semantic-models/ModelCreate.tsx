import {useCallback, useEffect, useRef, useState} from 'react'
import type {SemanticModelsRepository} from '../../adapters/semanticModelsRepository'
import type {SemanticCatalogRepository} from '../../adapters/semanticCatalogRepository'
import type {Capture, ModelDetailRecord} from '../../domain/semanticModels'
import {useDatasetResource} from '../../hooks/useDatasetResource'
import {AppLink} from '../../components/SynapseShell'
import {CaptureSummary, ModelError, ModelNotice} from './ModelsChrome'

export function ModelCreate({repository, catalogRepository, onSaved}: {repository: SemanticModelsRepository; catalogRepository: SemanticCatalogRepository; onSaved: (result: ModelDetailRecord) => void}) {
  const [name, setName] = useState(''), [description, setDescription] = useState(''), [domainId, setDomainId] = useState(''), [selected, setSelected] = useState<string[]>([])
  const [pending, setPending] = useState(false), [error, setError] = useState<Error>()
  const active = useRef(true), locked = useRef(false), attempt = useRef<{fingerprint: string; key: string} | undefined>(undefined)
  useEffect(() => {active.current = true; return () => {active.current = false}}, [])
  const domains = useDatasetResource(useCallback(signal => catalogRepository.all('domains', {}, signal), [catalogRepository]), 'create-domains')
  const options = useDatasetResource(useCallback(async signal => domainId ? {
    kpis: await catalogRepository.all('kpi-definitions', {domainId}, signal), components: await catalogRepository.all('components', {domainId}, signal),
  } : {kpis: [], components: []}, [catalogRepository, domainId]), `selection/${domainId}`)
  const kpis = options.data?.kpis.filter(k => selected.includes(k.id)) ?? []
  const refs = new Set(kpis.flatMap(k => [...(k.dimensionIds ?? []), ...(k.measureIds ?? [])]))
  const domain = domains.data?.find(d => d.id === domainId)
  const capture: Capture = {domain: {id: domainId, name: domain?.name ?? '', version: domain?.version ?? 1},
    kpis: kpis.map(k => ({...k, dimensionIds: k.dimensionIds ?? [], measureIds: k.measureIds ?? []})), components: options.data?.components.filter(c => refs.has(c.id)) ?? []}
  async function save() {
    if (locked.current || !name.trim() || !domain || options.loading || options.error) return
    locked.current = true; setPending(true); setError(undefined)
    const body = {name: name.trim().normalize('NFC'), description: description.trim(), domainId, kpiIds: [...selected].sort()}
    const fingerprint = JSON.stringify(body)
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = {fingerprint, key: crypto.randomUUID()}
    try {const result = await repository.create(body, attempt.current.key); if (active.current) onSaved(result)}
    catch (e) {if (active.current) setError(e instanceof Error ? e : new Error('No se pudo guardar el borrador.'))}
    finally {if (active.current) {locked.current = false; setPending(false)}}
  }
  return <><AppLink className="source-back" to="/modelos-semanticos">← Volver a modelos</AppLink><header className="models-heading"><div><span className="models-eyebrow">US-004 · Modelos semánticos · Borradores versionados</span><h1>Crear modelo semántico</h1><p>Compón definiciones y dependencias declaradas de un único dominio.</p></div></header><ModelNotice /><ModelError error={error} />
    <form onSubmit={e => {e.preventDefault(); void save()}}><fieldset disabled={pending}><div className="models-grid"><div className="models-sections"><section className="models-card"><h2>Identificación y dominio</h2><div className="models-fields"><label>Nombre del modelo<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><label>Identificador del sistema<input readOnly value="Se asignará al guardar" /></label><label>Dominio de negocio<select required value={domainId} onChange={e => {setDomainId(e.target.value); setSelected([])}}><option value="">Selecciona un dominio</option>{domains.data?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label>Descripción técnica<textarea maxLength={2000} rows={2} value={description} onChange={e => setDescription(e.target.value)} /></label></div><p>El dominio quedará fijo tras la creación. Los demás modelos del dominio no se modificarán.</p><ModelError error={domains.error} retry={domains.refresh} /></section>
    <section className="models-card"><h2>Seleccionar KPI del dominio {domain?.name ?? ''}</h2><p>Sólo definiciones autorizadas. No se calculan valores de negocio.</p><ModelError error={options.error} retry={options.refresh} />{options.loading ? <p role="status">Cargando definiciones…</p> : <div className="models-table-scroll" role="region" aria-label="Selección de KPI" tabIndex={0}><table><thead><tr><th>Incluir</th><th>KPI e identificador</th><th>Definición</th><th>Dependencias</th><th>Documentación</th></tr></thead><tbody>{options.data?.kpis.map(k => <tr key={k.id}><td><input type="checkbox" aria-label={`Incluir KPI ${k.name}`} checked={selected.includes(k.id)} disabled={!selected.includes(k.id) && selected.length >= 100} onChange={e => setSelected(e.target.checked ? [...selected, k.id] : selected.filter(id => id !== k.id))} /></td><td><strong>{k.name}</strong><code>{k.id}</code></td><td>{k.definition ?? 'Pendiente'}</td><td>{(k.measureIds?.length ?? 0) + (k.dimensionIds?.length ?? 0)} referencias</td><td><span className="models-badge">{k.completeness === 'complete' ? 'Documentación completa' : 'Faltantes documentales'}</span></td></tr>)}</tbody></table>{!options.data?.kpis.length && <p className="models-empty">{domainId ? 'Este dominio no tiene KPI disponibles.' : 'Selecciona un dominio para ver sus KPI.'}</p>}</div>}<p>Hasta 100 KPI. Puedes guardar un borrador sin KPI; sus faltantes no implican aprobación ni publicación.</p></section></div><CaptureSummary capture={capture} pending /></div>
    <footer className="models-actions"><span>{selected.length} KPI · {refs.size} dependencias únicas</span><AppLink className="source-button" to="/modelos-semanticos">Cancelar</AppLink><button className="source-button primary" disabled={!name.trim() || !domain || options.loading || !!options.error} type="submit">Guardar borrador</button></footer></fieldset>{pending && <p role="status">Guardando borrador…</p>}</form></>
}
