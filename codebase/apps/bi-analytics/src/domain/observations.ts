export interface Column { name: string; position: number; type: string; nullable: boolean; generated: boolean; comment: string | null }
export interface Constraint { name: string; kind: 'p' | 'u' | 'f' | 'c'; columns: string[]; referencedSchema: string | null; referencedTable: string | null; referencedColumns: string[] }
export interface SchemaObject { schema: string; name: string; kind: 'table' | 'view'; comment: string | null; columns: Column[]; constraints: Constraint[] }
export interface Observation {
  id: string; sequence: number; sourceVersion: number; createdAt: string; status: 'success' | 'failed'
  errorCode: string | null; tables: number; views: number
  snapshot?: { serverVersion: number; schemas: string[]; objects: SchemaObject[] } | null
}
