export type ChartPoint = { label: string; value: number }
export function ChartCard({ title, series, status = 'success' }: { title: string; series: ChartPoint[]; status?: 'success' | 'loading' | 'empty' | 'error' | 'stale' | 'unauthorized' | 'disabled' }) {
  return <section aria-label={title}><h2>{title}</h2><div data-status={status} role="img" aria-label={`${title} chart`}>{status === 'success' ? series.map((point) => <span key={point.label} data-value={point.value}>{point.label}: {point.value}</span>) : <span>{status}</span>}</div></section>
}
