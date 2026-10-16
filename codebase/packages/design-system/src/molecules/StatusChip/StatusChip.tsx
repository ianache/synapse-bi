import { Badge } from '../../atoms/Badge/Badge'
export function StatusChip({ status }: { status: 'positive' | 'warning' | 'negative' | 'neutral' }) {
  const color = status === 'positive' ? 'var(--bi-color-positive)' : status === 'warning' ? 'var(--bi-color-warning)' : status === 'negative' ? 'var(--bi-color-negative)' : 'var(--bi-color-secondary)'
  return <Badge data-status={status} style={{ color, background: 'var(--bi-color-surface)' }}>{status}</Badge>
}
