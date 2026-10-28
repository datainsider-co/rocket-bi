import { vi } from 'vitest';
import type { SchemaEditService } from '@/core/schema/SchemaEditService';
import type { TableSchema } from '@/core/schema/SchemaService';

const EMPTY_TABLE: TableSchema = { dbName: 'sample_v2', name: 'sales', columns: [] };

/** Test-only: a SchemaEditService that accepts every change; each change gives back an empty `sample_v2.sales`. */
export function fakeSchemaEditService(overrides: Partial<SchemaEditService> = {}): SchemaEditService {
  return {
    detectExpressionType: vi.fn<SchemaEditService['detectExpressionType']>(async () => 'double'),
    createColumn: vi.fn<SchemaEditService['createColumn']>(async () => EMPTY_TABLE),
    updateColumn: vi.fn<SchemaEditService['updateColumn']>(async () => EMPTY_TABLE),
    deleteColumn: vi.fn<SchemaEditService['deleteColumn']>(async () => {}),
    updateTableQuery: vi.fn<SchemaEditService['updateTableQuery']>(async () => EMPTY_TABLE),
    dropTable: vi.fn<SchemaEditService['dropTable']>(async () => {}),
    ...overrides
  };
}
