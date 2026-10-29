import { vi } from 'vitest';
import type { DatabaseService } from '@/core/schema/DatabaseService';
import { tableDefinitionFromJson } from '@/core/schema/TableDefinition';
import type { TableService } from '@/core/schema/TableService';
import fixture from '@/core/schema/warehouse.fixture.json';

/** Test-only: no databases; creating one succeeds, under the name it is given, unless overridden. */
export function fakeDatabaseService(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    listMyData: vi.fn<DatabaseService['listMyData']>(async () => []),
    create: vi.fn<DatabaseService['create']>(async name => ({ name, displayName: name })),
    delete: vi.fn<DatabaseService['delete']>(async () => {}),
    ...overrides
  };
}

/** Test-only: every table is DW0's `products`; writes answer with what they were given, unless overridden. */
export function fakeTableService(overrides: Partial<TableService> = {}): TableService {
  return {
    getTable: vi.fn<TableService['getTable']>(async () => tableDefinitionFromJson(fixture.tableUpdate.response)),
    createTable: vi.fn<TableService['createTable']>(async table => table),
    updateTable: vi.fn<TableService['updateTable']>(async table => table),
    createTableFromQuery: vi.fn<TableService['createTableFromQuery']>(async () => tableDefinitionFromJson(fixture.fromQueryView.response)),
    ...overrides
  };
}
