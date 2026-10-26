import { describe, expect, it } from 'vitest';
import { DefaultDirectoryId, Directory, DirectoryParents, DirectoryType } from '@/core/directory/Directory';
import { SortOrder } from '@/core/directory/DirectoryService';
import {
  DEFAULT_SORT,
  DirectoryAction,
  DirectorySection,
  avatarColor,
  buildSorts,
  createParentId,
  formatDateTime,
  getSection,
  itemPath,
  menuActions,
  movableFolders,
  nameSchema,
  parseIdParam,
  sectionFromPath,
  toBreadcrumbs,
  toIdParam,
  toSlug,
  toggleSortOrder,
  typeLabel
} from './directory.utils';

function folder(id: number, name: string, parentId: number) {
  return { id, name, parent_id: parentId, directory_type: 'directory' };
}

describe('getSection', () => {
  it('returns the config of a section', () => {
    expect(getSection(DirectorySection.Trash)).toMatchObject({ path: '/trash', rootId: DefaultDirectoryId.Trash });
  });

  it('throws for an unknown key', () => {
    expect(() => getSection('nope' as DirectorySection)).toThrow('Unknown directory section');
  });
});

describe('sectionFromPath', () => {
  it.each([
    ['/mydata', DirectorySection.MyData],
    ['/mydata/a-1', DirectorySection.MyData],
    ['/shared/b-2', DirectorySection.Shared],
    ['/recent', DirectorySection.Recent],
    ['/starred', DirectorySection.Starred],
    ['/trash', DirectorySection.Trash],
    ['/', DirectorySection.MyData],
    ['/other', DirectorySection.MyData]
  ])('%s → %s', (pathname, expected) => {
    expect(sectionFromPath(pathname)).toBe(expected);
  });
});

describe('toSlug', () => {
  it.each([
    ['Sales Report', 'sales-report'],
    ['Báo cáo Đầu tư Q1', 'bao-cao-dau-tu-q1'],
    ['  --a__b!!c--  ', 'a-b-c'],
    ['', ''],
    ['!!!', '']
  ])('%j → %j', (name, expected) => {
    expect(toSlug(name)).toBe(expected);
  });
});

describe('toIdParam / parseIdParam', () => {
  it('builds <slug>-<id>', () => {
    expect(toIdParam(12, 'My Folder')).toBe('my-folder-12');
  });

  it('builds -<id> for an empty name, like v1', () => {
    expect(toIdParam(5, '')).toBe('-5');
  });

  it.each([
    ['my-folder-12', 12],
    ['-5', 5],
    ['7', 7],
    ['folder-2024-9', 9]
  ])('parses %j → %d', (param, expected) => {
    expect(parseIdParam(param)).toBe(expected);
  });

  it.each([[undefined], [''], ['folder'], ['folder-'], ['folder-1a']])('rejects %j', param => {
    expect(parseIdParam(param)).toBeUndefined();
  });

  it('round-trips', () => {
    expect(parseIdParam(toIdParam(42, 'Báo cáo 2025'))).toBe(42);
  });
});

describe('itemPath', () => {
  it('opens a folder under My Data', () => {
    expect(itemPath(new Directory(folder(3, 'Sales', 1)))).toBe('/mydata/sales-3');
  });

  it('opens a dashboard by its dashboard id', () => {
    const dashboard = new Directory({ id: 3, name: 'KPI', directory_type: 'dashboard', dashboard_id: 9 });
    expect(itemPath(dashboard)).toBe('/dashboard/kpi-9');
  });

  it('opens a saved query in the query editor', () => {
    const query = new Directory({ id: 3, name: 'q', directory_type: 'queries', dashboard_id: 4 });
    expect(itemPath(query)).toBe('/data-warehouse/query-editor?adhoc=4');
  });
});

describe('toBreadcrumbs', () => {
  it('is empty without parents', () => {
    expect(toBreadcrumbs(undefined)).toEqual([]);
  });

  it('lists every folder below the root when the path starts at the root', () => {
    const parents = new DirectoryParents({
      is_all: true,
      parent_directories: [folder(1, 'root', -1), folder(2, 'A', 1), folder(4, 'B', 2), folder(5, 'C', 4)]
    });

    expect(toBreadcrumbs(parents)).toEqual([
      { key: '2', label: 'A', to: '/mydata/a-2' },
      { key: '4', label: 'B', to: '/mydata/b-4' },
      { key: '5', label: 'C', to: '/mydata/c-5' }
    ]);
  });

  it('keeps a short shared path whole', () => {
    const parents = new DirectoryParents({ parent_directories: [folder(7, 'Shared', 3), folder(8, 'Sub', 7)] });

    expect(toBreadcrumbs(parents).map(crumb => crumb.label)).toEqual(['Shared', 'Sub']);
  });

  it('shortens a deep shared path with ...', () => {
    const parents = new DirectoryParents({
      parent_directories: [folder(7, 'Shared', 3), folder(8, 'Sub', 7), folder(9, 'Deep', 8)]
    });

    expect(toBreadcrumbs(parents)).toEqual([
      { key: 'more', label: '...' },
      { key: '8', label: 'Sub', to: '/mydata/sub-8' },
      { key: '9', label: 'Deep', to: '/mydata/deep-9' }
    ]);
  });

  it('does not mutate the parents', () => {
    const parents = new DirectoryParents({ parent_directories: [folder(1, 'root', -1), folder(2, 'A', 1)] });
    toBreadcrumbs(parents);
    expect(parents.parentDirectories).toHaveLength(2);
  });
});

describe('toggleSortOrder', () => {
  it.each([
    [SortOrder.Asc, SortOrder.Desc],
    [SortOrder.Desc, SortOrder.Asc]
  ])('%s → %s', (order, expected) => {
    expect(toggleSortOrder(order)).toBe(expected);
  });
});

describe('buildSorts', () => {
  it('uses the chosen sort alone', () => {
    expect(buildSorts(DefaultDirectoryId.MyData, DEFAULT_SORT)).toEqual([DEFAULT_SORT]);
  });

  it('puts the latest deleted first at the root of Trash', () => {
    expect(buildSorts(DefaultDirectoryId.Trash, DEFAULT_SORT)).toEqual([
      { field: 'updated_date', order: SortOrder.Desc },
      DEFAULT_SORT
    ]);
  });
});

describe('createParentId', () => {
  it('creates in the open folder of My Data', () => {
    expect(createParentId(DirectorySection.MyData, 12)).toBe(12);
  });

  it('creates at the root of My Data', () => {
    expect(createParentId(DirectorySection.MyData, undefined)).toBe(DefaultDirectoryId.MyData);
  });

  it.each([DirectorySection.Shared, DirectorySection.Recent, DirectorySection.Starred, DirectorySection.Trash])(
    'creates at the root from %s',
    section => {
      expect(createParentId(section, 12)).toBe(DefaultDirectoryId.MyData);
    }
  );
});

describe('menuActions', () => {
  it('offers move only in My Data', () => {
    expect(menuActions({ isStarred: false }, DirectorySection.MyData)).toEqual([
      DirectoryAction.Rename,
      DirectoryAction.Move,
      DirectoryAction.Star,
      DirectoryAction.Remove
    ]);
    expect(menuActions({ isStarred: false }, DirectorySection.Recent)).not.toContain(DirectoryAction.Move);
  });

  it('offers unstar for a starred item', () => {
    const actions = menuActions({ isStarred: true }, DirectorySection.Starred);
    expect(actions).toContain(DirectoryAction.Unstar);
    expect(actions).not.toContain(DirectoryAction.Star);
  });
});

describe('typeLabel', () => {
  it.each([
    [DirectoryType.Directory, 'folder'],
    [DirectoryType.Dashboard, 'dashboard'],
    [DirectoryType.Query, 'query']
  ])('%s → %s', (type, expected) => {
    expect(typeLabel(type)).toBe(expected);
  });
});

describe('nameSchema', () => {
  it('trims a valid name', () => {
    expect(nameSchema.parse({ name: '  Sales  ' })).toEqual({ name: 'Sales' });
  });

  it.each([
    ['', 'Field is required.'],
    ['   ', 'Field is required.'],
    ['a'.repeat(251), 'Max length is 250 chars.'],
    ['a/b', "Field can't contain"],
    ['a:b', "Field can't contain"],
    ['a|b', "Field can't contain"]
  ])('rejects %j', (name, message) => {
    const result = nameSchema.safeParse({ name });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });

  it('accepts 250 chars', () => {
    expect(nameSchema.safeParse({ name: 'a'.repeat(250) }).success).toBe(true);
  });
});

describe('movableFolders', () => {
  const items = [
    new Directory(folder(1, 'A', 0)),
    new Directory(folder(2, 'B', 0)),
    new Directory({ id: 3, name: 'D', directory_type: 'dashboard' })
  ];

  it('keeps folders that are not excluded', () => {
    expect(movableFolders(items, [2]).map(item => item.id)).toEqual([1]);
  });

  it('returns every folder with nothing excluded', () => {
    expect(movableFolders(items, []).map(item => item.id)).toEqual([1, 2]);
  });

  it('is empty for no items', () => {
    expect(movableFolders([], [])).toEqual([]);
  });
});

describe('formatDateTime', () => {
  it('formats like v1: MMM DD, YYYY HH:mm:ss', () => {
    expect(formatDateTime(Date.UTC(2026, 2, 4, 14, 5, 9), 'UTC')).toBe('Mar 04, 2026 14:05:09');
  });

  it('uses 24-hour time from midnight', () => {
    expect(formatDateTime(Date.UTC(2026, 11, 31, 0, 0, 0), 'UTC')).toBe('Dec 31, 2026 00:00:00');
  });

  it.each([0, -1])('is -- for %d', value => {
    expect(formatDateTime(value)).toBe('--');
  });
});

describe('avatarColor', () => {
  it('picks by the first letter, ignoring case', () => {
    // 'R' is 82; 82 % 19 = 6.
    expect(avatarColor('root')).toBe('#27ae60');
    expect(avatarColor('Root')).toBe(avatarColor('root'));
  });

  it('falls back to the first color for an empty name', () => {
    expect(avatarColor('')).toBe('#1abc9c');
  });
});
