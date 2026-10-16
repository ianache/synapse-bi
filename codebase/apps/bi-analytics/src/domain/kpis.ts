export interface PublishedKpi {
  id: string
  name: string
  domain: string
  category: string
  definition: string
  owner: string
  freshness: string
  quality: string
  frequency: string
  formula: string
  unit: string
  grain: string
  synonyms: string[]
  modelId?: string
  modelVersion?: number
  dimensions?: string[]
  lineage?: { id: string; label: string; kind: string }[]
  dataMode?: 'synthetic' | 'connected'
}

// Fixtures for the frontend preview, not certified production metrics.
export const publishedKpis: PublishedKpi[] = [
  { id: 'kpi_fin_net_revenue', name: 'Ingresos netos', domain: 'Finanzas', category: 'Ventas', definition: 'Total de ingresos generados por ventas brutas deducidos los descuentos comerciales, devoluciones y bonificaciones contables aplicadas en el período fiscal.', owner: 'Finanzas & Contraloría', freshness: 'Actualizado hace 2 h', quality: '99,8%', frequency: 'Diaria', formula: 'Ventas brutas − descuentos − devoluciones − bonificaciones', unit: 'PEN', grain: 'Día y transacción', synonyms: ['ventas', 'revenue', 'facturación', 'ingresos'] },
  { id: 'kpi_op_gross_margin', name: 'Margen bruto', domain: 'Operaciones & Ventas', category: 'Operaciones', definition: 'Porcentaje de beneficio obtenido al descontar el costo de los bienes vendidos de los ingresos totales. Permite analizar la eficiencia del negocio.', owner: 'Finanzas', freshness: 'Actualizado hace 2 h', quality: '99,2%', frequency: 'Diaria', formula: '(Ingresos totales − costo de bienes vendidos) / ingresos totales × 100', unit: '%', grain: 'Día y producto', synonyms: ['ventas', 'beneficio', 'rentabilidad', 'margen'] },
  { id: 'kpi_sls_conversion_rate', name: 'Tasa de conversión', domain: 'Ventas Digitales', category: 'Clientes', definition: 'Proporción de sesiones de clientes potenciales que concluyen en una transacción comercial efectiva en los canales digitales.', owner: 'Crecimiento & Ventas', freshness: 'Actualizado hace 2 h', quality: '98,9%', frequency: 'Horaria', formula: 'Sesiones con transacción / sesiones elegibles × 100', unit: '%', grain: 'Día y canal', synonyms: ['ventas', 'clientes', 'conversion', 'embudo'] },
]

export function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim()
}

export function searchKpis(query: string, category: string, owner = '', source = publishedKpis) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean)
  return source.filter(kpi => {
    const text = normalizeSearch([kpi.name, kpi.definition, kpi.domain, ...kpi.synonyms].join(' '))
    return words.every(word => text.includes(word)) && (category === 'Todos' || category === 'Publicados' || kpi.category === category) && (!owner || kpi.owner === owner)
  })
}
