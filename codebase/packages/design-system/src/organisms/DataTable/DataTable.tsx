import type { ReactNode } from 'react'

export type DataTableColumn<T> = { key: keyof T & string; label: string; render?: (value: T[keyof T], row: T) => ReactNode }
export type DataTableProps<T> = { columns: DataTableColumn<T>[]; rows: T[]; loading?: boolean; empty?: boolean; error?: string; onRowClick?: (row: T) => void }

export function DataTable<T extends Record<string, unknown>>({ columns, rows, loading, empty, error, onRowClick }: DataTableProps<T>) {
  return <table><caption className="sr-only">Data table</caption><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead><tbody>
    {loading && <tr><td colSpan={columns.length}>Loading…</td></tr>}
    {!loading && empty && <tr><td colSpan={columns.length}>No results</td></tr>}
    {!loading && !empty && error && <tr><td colSpan={columns.length} role="alert">{error}</td></tr>}
    {!loading && !empty && !error && rows.map((row, index) => <tr key={index} onClick={() => onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined} onKeyDown={(event) => { if (onRowClick && event.key === 'Enter') onRowClick(row) }}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}</td>)}</tr>)}
  </tbody></table>
}
