import { vi } from 'vitest';
import type { DataSourceService } from '@/core/ingestion/DataSourceService';
import type { JobHistoryService } from '@/core/ingestion/JobHistoryService';
import type { JobService } from '@/core/ingestion/JobService';

/** Test-only: a DataSourceService with no sources. Override what the test needs. */
export function fakeDataSourceService(overrides: Partial<DataSourceService> = {}): DataSourceService {
  return {
    list: vi.fn<DataSourceService['list']>(async () => ({ total: 0, data: [] })),
    get: vi.fn<DataSourceService['get']>(async () => {
      throw new Error('not found');
    }),
    test: vi.fn<DataSourceService['test']>(async () => {}),
    create: vi.fn<DataSourceService['create']>(async source => source),
    update: vi.fn<DataSourceService['update']>(async () => {}),
    delete: vi.fn<DataSourceService['delete']>(async () => {}),
    deleteMany: vi.fn<DataSourceService['deleteMany']>(async () => {}),
    listDatabases: vi.fn<DataSourceService['listDatabases']>(async () => []),
    listTables: vi.fn<DataSourceService['listTables']>(async () => []),
    listColumns: vi.fn<DataSourceService['listColumns']>(async () => []),
    ...overrides
  };
}

/** Test-only: a JobService with no jobs. Override what the test needs. */
export function fakeJobService(overrides: Partial<JobService> = {}): JobService {
  return {
    list: vi.fn<JobService['list']>(async () => ({ total: 0, data: [] })),
    create: vi.fn<JobService['create']>(async job => ({ job, source: undefined, creator: undefined })),
    createForTables: vi.fn<JobService['createForTables']>(async () => {}),
    update: vi.fn<JobService['update']>(async () => {}),
    delete: vi.fn<JobService['delete']>(async () => {}),
    deleteMany: vi.fn<JobService['deleteMany']>(async () => {}),
    syncNow: vi.fn<JobService['syncNow']>(async () => {}),
    syncManyNow: vi.fn<JobService['syncManyNow']>(async ids => Object.fromEntries(ids.map(id => [id, true]))),
    cancel: vi.fn<JobService['cancel']>(async () => true),
    ...overrides
  };
}

/** Test-only: a JobHistoryService with no runs. Override what the test needs. */
export function fakeJobHistoryService(overrides: Partial<JobHistoryService> = {}): JobHistoryService {
  return {
    list: vi.fn<JobHistoryService['list']>(async () => ({ total: 0, data: [] })),
    ...overrides
  };
}
