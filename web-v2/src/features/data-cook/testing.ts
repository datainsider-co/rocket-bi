import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { vi } from 'vitest';
import type { EtlHistoryService } from '@/core/data-cook/EtlHistoryService';
import type { EtlPreviewService } from '@/core/data-cook/EtlPreviewService';
import { treeOperators } from './editor/preview/etlPreview.utils';
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

/** Test-only: an EtlPreviewService that builds every table it is sent, without columns. Override what the test needs. */
export function fakeEtlPreviewService(overrides: Partial<EtlPreviewService> = {}): EtlPreviewService {
  return {
    databaseName: vi.fn<EtlPreviewService['databaseName']>(async id => `preview_etl_${id}`),
    preview: vi.fn<EtlPreviewService['preview']>(async (id, operators) => ({
      status: 'Done',
      tables: [...new Set(operators.flatMap(operator => [...treeOperators(operator).keys()]))].map(name => ({ dbName: `preview_etl_${id}`, name, columns: [] })),
      errors: []
    })),
    viewQuery: vi.fn<EtlPreviewService['viewQuery']>(async () => 'select 1'),
    ...overrides
  };
}

/**
 * Test-only: the open dialog titled `title`. Found by its title: the tests' `useId` gives every element the same id, so
 * a dialog's accessible name is not its own once the editor's tabs are drawn.
 */
export async function findDialog(title: string): Promise<HTMLElement> {
  return waitFor(() => {
    const dialog = screen.getAllByRole('dialog').find(item => item.querySelector('.ant-modal-title')?.textContent === title);
    if (!dialog) throw new Error(`No dialog ${title}`);
    return dialog;
  });
}

/** Test-only: Save on the editor's control bar, then Save in the Save ETL dialog as it opens. */
export async function saveThroughDialog(user: UserEvent): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Save' }));
  const dialog = await findDialog('Save ETL');
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));
}
