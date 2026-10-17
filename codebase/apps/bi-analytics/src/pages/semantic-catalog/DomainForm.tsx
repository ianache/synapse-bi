import { useState } from 'react'
import type { Domain, SaveDomain } from '../../domain/semanticCatalog'
import type { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import { DraftForm, TextField } from './DraftForm'

const input = (item?: Domain): SaveDomain => ({name: item?.name ?? '', description: item?.description ?? '', owner: item?.owner ?? null})
export function DomainForm({repository, initial, onSaved}: {repository: SemanticCatalogRepository; initial?: Domain; onSaved: (item: Domain) => void}) {
  const [body, setBody] = useState(input(initial))
  return <DraftForm body={body} initial={initial} title={initial ? 'Editar dominio' : 'Crear dominio'} onSaved={onSaved}
    reload={initial ? () => repository.get('domains', initial.id) : undefined} onReload={item => setBody(input(item))}
    save={async (draft, key, version) => {
      if (initial) return repository.update('domains', {...initial, version: version!}, draft)
      const saved = await repository.createDomain(draft, key)
      return repository.get('domains', saved.id)
    }}>
    <p>Nombre obligatorio. Descripción y responsable pueden quedar pendientes; guardar no aprueba el dominio.</p>
    <TextField label="Nombre" value={body.name} required maxLength={100} onChange={name => setBody({...body, name})} />
    <TextField label="Descripción" value={body.description} multiline maxLength={2000} onChange={description => setBody({...body, description})} />
    <TextField label="Responsable declarado" value={body.owner} onChange={owner => setBody({...body, owner: owner || null})} />
    <p>El responsable declarado no concede permisos.</p>
  </DraftForm>
}
