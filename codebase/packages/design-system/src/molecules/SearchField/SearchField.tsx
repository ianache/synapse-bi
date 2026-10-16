import { useState, type FormEvent } from 'react'
import { Button } from '../../atoms/Button/Button'
import { Input } from '../../atoms/Input/Input'

export type SearchFieldProps = { label: string; value?: string; onChange?: (value: string) => void; onSubmit: (value: string) => void; placeholder?: string; disabled?: boolean; loading?: boolean }

export function SearchField({ label, value, onChange, onSubmit, placeholder, disabled, loading }: SearchFieldProps) {
  const [internalValue, setInternalValue] = useState(value ?? '')
  const currentValue = value ?? internalValue
  function submit(event: FormEvent) { event.preventDefault(); onSubmit(currentValue) }
  return <form onSubmit={submit} aria-label={`${label} form`} style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
    <label style={{ flex: 1 }}>{label}<Input aria-label={label} value={currentValue} placeholder={placeholder} disabled={disabled} onChange={(event) => { setInternalValue(event.target.value); onChange?.(event.target.value) }} /></label>
    <Button type="submit" disabled={disabled} loading={loading}>Search</Button>
  </form>
}
