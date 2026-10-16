export function MetricValue({ value, unit }: { value: string | number; unit?: string }) { return <strong>{value}{unit ? ` ${unit}` : ''}</strong> }
