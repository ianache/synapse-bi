import { Badge } from '../../atoms/Badge/Badge'
import { Spinner } from '../../atoms/Spinner/Spinner'
import { MetricValue } from '../../molecules/MetricValue/MetricValue'
import type { MetricCardProps } from '../../types/semantic'

export function MetricCard({ label, value, unit, trend, status = 'neutral', loading, error }: MetricCardProps) {
  return <section aria-label={label} style={{ padding: '1rem', background: 'var(--bi-color-surface)', border: '1px solid var(--bi-color-border)', borderRadius: 'var(--bi-radius-lg)', boxShadow: 'var(--bi-shadow-card)' }}>
    <h2 style={{ margin: 0, fontFamily: 'var(--bi-font-body)', fontSize: '0.875rem', color: 'var(--bi-color-muted)' }}>{label}</h2>
    {loading ? <Spinner /> : <MetricValue value={value} unit={unit} />}
    <Badge data-status={status}>{trend ? `${trend.direction} ${trend.value}%` : status}</Badge>
    {error && <p role="alert">{error}</p>}
  </section>
}
