import { vi } from 'vitest';
import { DashboardSummary } from '@/core/dashboard/DashboardService';
import type { DashboardService } from '@/core/dashboard/DashboardService';
import { widgetFromJson } from '@/core/dashboard/Widget';
import { Directory, DirectoryParents } from '@/core/directory/Directory';
import type { DirectoryService } from '@/core/directory/DirectoryService';

type Service = DirectoryService;

/** Test-only: an empty directory tree whose changes all succeed unless overridden. */
export function fakeDirectoryService(overrides: Partial<Service> = {}): Service {
  return {
    get: vi.fn<Service['get']>(async id => new Directory({ id, parent_id: 1, directory_type: 'directory' })),
    getRoot: vi.fn<Service['getRoot']>(async () => new Directory({ id: 1, name: 'root-root', parent_id: -1 })),
    getParents: vi.fn<Service['getParents']>(async () => new DirectoryParents()),
    list: vi.fn<Service['list']>(async () => []),
    listSharedWithMe: vi.fn<Service['listSharedWithMe']>(async () => []),
    listRecent: vi.fn<Service['listRecent']>(async () => []),
    listStarred: vi.fn<Service['listStarred']>(async () => []),
    listTrash: vi.fn<Service['listTrash']>(async () => []),
    createFolder: vi.fn<Service['createFolder']>(
      async (name, parentId) => new Directory({ id: 100, name, parent_id: parentId, directory_type: 'directory' })
    ),
    rename: vi.fn<Service['rename']>(async () => {}),
    move: vi.fn<Service['move']>(async () => {}),
    remove: vi.fn<Service['remove']>(async () => {}),
    deleteForever: vi.fn<Service['deleteForever']>(async () => {}),
    restore: vi.fn<Service['restore']>(async () => {}),
    star: vi.fn<Service['star']>(async () => {}),
    unstar: vi.fn<Service['unstar']>(async () => {}),
    ...overrides
  };
}

/** Test-only: dashboard calls that succeed unless overridden. */
export function fakeDashboardService(overrides: Partial<DashboardService> = {}): DashboardService {
  return {
    get: vi.fn<DashboardService['get']>(async () => {
      throw new Error('not stubbed');
    }),
    create: vi.fn<DashboardService['create']>(async name => new DashboardSummary({ id: 50, name })),
    rename: vi.fn<DashboardService['rename']>(async () => {}),
    resizeWidgets: vi.fn<DashboardService['resizeWidgets']>(async () => {}),
    createWidget: vi.fn<DashboardService['createWidget']>(async (_dashboardId, widget) => widgetFromJson({ ...widget, id: 900 })),
    editWidget: vi.fn<DashboardService['editWidget']>(async () => {}),
    deleteWidget: vi.fn<DashboardService['deleteWidget']>(async () => {}),
    editSetting: vi.fn<DashboardService['editSetting']>(async () => {}),
    getDirectoryId: vi.fn<DashboardService['getDirectoryId']>(async id => id + 100),
    listDrillThrough: vi.fn<DashboardService['listDrillThrough']>(async () => ({ total: 0, dashboards: [] })),
    ...overrides
  };
}
