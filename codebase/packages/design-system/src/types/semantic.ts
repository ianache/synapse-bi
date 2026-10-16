export type LineageReference = {
  source: string
  reference: string
}

export type MetricCardProps = {
  label: string
  value: string | number
  unit?: string
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  status?: 'positive' | 'warning' | 'negative' | 'neutral'
  loading?: boolean
  error?: string
}

export type SemanticQueryState<T> = {
  data?: T
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  freshness?: string
  lineage?: LineageReference[]
}
