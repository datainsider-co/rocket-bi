import { vi } from 'vitest';
import type { EtlHistoryService } from '@/core/data-cook/EtlHistoryService';
import type { EtlService } from '@/core/data-cook/EtlService';

/** Test-only: an EtlService with no ETLs. Override what the test needs. */
export function fakeEtlService(overrides: Partial<EtlService> = {}): EtlService {
  return {
    list: vi.fn<EtlService['list']>(async () => ({ total: 0, data: [] })),
    get: vi.fn<EtlService['get']>(async () => {
      throw new Error('not found');
    }),
    create: vi.fn<EtlService['create']>(async () => {
      throw new Error('not used');
    }),
    update: vi.fn<EtlService['update']>(async etl => etl),
    moveToTrash: vi.fn<EtlService['moveToTrash']>(async () => {}),
    restore: vi.fn<EtlService['restore']>(async () => {}),
    deleteForever: vi.fn<EtlService['deleteForever']>(async () => {}),
    forceRun: vi.fn<EtlService['forceRun']>(async () => {}),
    cancel: vi.fn<EtlService['cancel']>(async () => {}),
    getSourceTable: vi.fn<EtlService['getSourceTable']>(async (dbName, tblName) => ({ name: tblName, db_name: dbName, columns: [] })),
    ...overrides
  };
}

/** Test-only: an EtlHistoryService with no runs. Override what the test needs. */
export function fakeEtlHistoryService(overrides: Partial<EtlHistoryService> = {}): EtlHistoryService {
  return {
    list: vi.fn<EtlHistoryService['list']>(async () => ({ total: 0, data: [] })),
    ...overrides
  };
}
