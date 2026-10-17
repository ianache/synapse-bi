import { useState } from 'react'
import { Modal } from '@bi-analytics/design-system'
import type { Component } from '../../domain/semanticCatalog'
import type { SemanticCatalogRepository } from '../../adapters/semanticCatalogRepository'
import { DraftForm, TextField } from './DraftForm'

export function CopyComponentDialog({repository, component, onClose, onSaved}: {repository: SemanticCatalogRepository; component: Component; onClose: () => void; onSaved: (item: Component) => void}) {
  const [name, setName] = useState('')
  return <Modal title="Crear copia" onClose={onClose}><DraftForm title="Crear copia" headingLevel={2} body={{name}} onSaved={onSaved}
    save={async (body, key) => { const saved = await repository.copyComponent(component.id, body.name, key); return repository.get('components', saved.id) }}>
    <p>Origen: {component.name}. Conserva definición y vínculo histórico. No reasigna ningún KPI automáticamente.</p>
    <TextField label="Nombre de la copia" value={name} required maxLength={100} onChange={setName} />
  </DraftForm><button className="source-button" onClick={onClose}>Cancelar</button></Modal>
}
