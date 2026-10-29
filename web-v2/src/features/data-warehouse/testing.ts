import { vi } from 'vitest';
import type { DatabaseService } from '@/core/schema/DatabaseService';

/** Test-only: no databases; creating one succeeds, under the name it is given, unless overridden. */
export function fakeDatabaseService(overrides: Partial<DatabaseService> = {}): DatabaseService {
  return {
    listMyData: vi.fn<DatabaseService['listMyData']>(async () => []),
    create: vi.fn<DatabaseService['create']>(async name => ({ name, displayName: name })),
    delete: vi.fn<DatabaseService['delete']>(async () => {}),
    ...overrides
  };
}
