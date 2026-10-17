import { Icon } from '@bi-analytics/design-system'
import type { Origin, SaveDataset } from '../../domain/datasets'
import { metadataLabels } from '../../domain/datasets'
import type { Observation, SchemaObject } from '../../domain/observations'

export function DatasetRegistrationSummary({origin, kind, observation, object, selected, sourceName, missing}: {origin: Origin; kind: SaveDataset['kind']; observation?: Observation; object?: SchemaObject; selected: number; sourceName?: string; missing: string[]}) {
  return <aside className="wizard-summary" aria-label="Resumen del registro">
    <section className="source-card wizard-card"><h2><Icon name="receipt" />Resumen de origen técnico</h2><dl>
      <div><dt>Fuente declarada</dt><dd>{sourceName || (origin.sourceId ? 'Fuente no disponible' : 'Sin seleccionar')}</dd></div>
      <div><dt>Snapshot DDL</dt><dd>{observation?.status === 'success' ? 'OBS-' + observation.sequence : 'Sin observación exitosa'}</dd></div>
      <div><dt>Fecha de observación</dt><dd>{observation?.status === 'success' ? new Date(observation.createdAt).toLocaleString('es-PE') : '—'}</dd></div>
      <div><dt>Objeto técnico</dt><dd><code>{object ? object.schema + '.' + object.name : 'Sin seleccionar'}</code></dd></div>
      <div><dt>Columnas</dt><dd>{selected} de {object?.columns.length ?? 0}</dd></div>
      <div><dt>Tipo de dataset</dt><dd>{kind === 'direct' ? 'Directo' : 'Preparado'} (declarado)</dd></div>
    </dl><p className="wizard-boundary"><Icon name="lock" size={14} />Solo metadatos DDL. No se leen filas, ejecutan procesos ni infiere el grano.</p></section>
    <section className="wizard-layer-note"><h3><Icon name="layers" />Separación estricta de capas</h3><p>Conexión técnica ≠ dataset registrado ≠ semántica de negocio.</p><dl><div><dt>Gobernanza</dt><dd>Pendiente de validación</dd></div><div><dt>Calidad / Frescura</dt><dd>Sin evaluar</dd></div></dl></section>
    {!!missing.length && <section className="source-card wizard-card wizard-missing"><h3>Metadatos pendientes</h3><ul>{missing.map(field => <li key={field}>{metadataLabels[field] ?? field}</li>)}</ul></section>}
  </aside>
}
