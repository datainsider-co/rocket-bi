import { describe, expect, it } from 'vitest';
import {
  CATALOG_PERMISSIONS,
  PERMISSION_GROUPS,
  canHold,
  groupPermissions,
  isGroupAllSelected,
  isViewPermission,
  permissionChanges,
  permissionsToDropForViewer,
  selectionFromPermitted,
  setGroupAll,
  setPermission,
  storedCatalogPermissions,
  type PermissionGroup
} from './permissionGroups';
import { UserGroup } from './UserGroup';

const users = PERMISSION_GROUPS.find(group => group.name === 'User Management') as PermissionGroup;
const insights = PERMISSION_GROUPS.find(group => group.name === 'Insights') as PermissionGroup;
const userItems = users.items.map(item => item.permission);

describe('catalog', () => {
  it('lists every group permission once, sudo first', () => {
    expect(new Set(CATALOG_PERMISSIONS).size).toBe(CATALOG_PERMISSIONS.length);
    expect(groupPermissions(users)[0]).toBe('user:*:*');
    expect(groupPermissions(insights)).toEqual(['insight:*:*']);
  });

  it('names the Data Cook group without v1 trailing space', () => {
    expect(PERMISSION_GROUPS.map(group => group.name)).toContain('DataCook');
  });
});

describe('isViewPermission and canHold', () => {
  it.each([
    ['user:view:*', true],
    ['ingestion_history:view:*', true],
    ['user:*:*', false],
    ['insight:*:view', false],
    ['login_method:manage', false]
  ])('%s → %s', (permission, expected) => {
    expect(isViewPermission(permission)).toBe(expected);
  });

  it('lets editors hold anything and viewers only view permissions', () => {
    expect(canHold(UserGroup.Editor, 'user:*:*')).toBe(true);
    expect(canHold(UserGroup.None, 'user:*:*')).toBe(true);
    expect(canHold(UserGroup.Viewer, 'user:*:*')).toBe(false);
    expect(canHold(UserGroup.Viewer, 'user:view:*')).toBe(true);
  });
});

describe('selectionFromPermitted', () => {
  it('keeps the catalog permissions answered true', () => {
    expect(selectionFromPermitted({ 'user:view:*': true, 'user:edit:*': false, 'other:x:*': true })).toEqual(['user:view:*']);
  });

  it('is empty for no answers', () => {
    expect(selectionFromPermitted({})).toEqual([]);
  });
});

describe('storedCatalogPermissions', () => {
  it('drops the organization prefix and what is not in the catalog', () => {
    expect(storedCatalogPermissions(['0:user:view:*', '0:database:*:*', '0:edit_data', '0:directory:view:14'])).toEqual([
      'user:view:*',
      'database:*:*'
    ]);
  });

  it('reads permissions without a prefix too', () => {
    expect(storedCatalogPermissions(['etl:*:*'])).toEqual(['etl:*:*']);
  });
});

describe('setGroupAll', () => {
  it('selects the sudo and every item, keeping other groups', () => {
    const next = setGroupAll(['etl:*:*'], users, true);
    expect(next).toEqual(['etl:*:*', ...groupPermissions(users)]);
  });

  it('clears the group', () => {
    expect(setGroupAll(['etl:*:*', 'user:*:*', 'user:view:*'], users, false)).toEqual(['etl:*:*']);
  });

  it('does not mutate the selection', () => {
    const selection = ['etl:*:*'];
    setGroupAll(selection, users, true);
    expect(selection).toEqual(['etl:*:*']);
  });
});

describe('setPermission', () => {
  it('adds an item', () => {
    expect(setPermission([], users, 'user:view:*', true)).toEqual(['user:view:*']);
  });

  it('adds the sudo once every item is ticked', () => {
    const allButOne = userItems.slice(1);
    const next = setPermission(allButOne, users, userItems[0] as string, true);
    expect(next).toContain('user:*:*');
    expect(isGroupAllSelected(next, users)).toBe(true);
  });

  it('removes an item and the sudo with it', () => {
    const all = groupPermissions(users);
    const next = setPermission(all, users, 'user:delete:*', false);
    expect(next).not.toContain('user:delete:*');
    expect(next).not.toContain('user:*:*');
    expect(next).toContain('user:view:*');
  });

  it('never adds a sudo for a group without one', () => {
    expect(setPermission([], insights, 'insight:*:*', true)).toEqual(['insight:*:*']);
  });
});

describe('isGroupAllSelected', () => {
  it('is false while an item is missing', () => {
    expect(isGroupAllSelected(userItems.slice(1), users)).toBe(false);
    expect(isGroupAllSelected(userItems, users)).toBe(true);
  });
});

describe('permissionChanges', () => {
  it('sends nothing when nothing changed', () => {
    expect(permissionChanges(['user:view:*'], ['user:view:*'], ['user:view:*'])).toEqual({ include: [], exclude: [] });
  });

  it('includes a newly ticked item', () => {
    expect(permissionChanges([], ['user:view:*'], [])).toEqual({ include: ['user:view:*'], exclude: [] });
  });

  it('excludes a stored item that was unticked', () => {
    expect(permissionChanges(['user:view:*', 'etl:*:*'], ['etl:*:*'], ['user:view:*', 'etl:*:*'])).toEqual({
      include: [],
      exclude: ['user:view:*']
    });
  });

  it('stores only the sudo when All is ticked', () => {
    const selection = setGroupAll([], users, true);
    expect(permissionChanges([], selection, [])).toEqual({ include: ['user:*:*'], exclude: [] });
  });

  it('replaces a stored sudo with the items still ticked when one is unticked', () => {
    const all = groupPermissions(users);
    const selection = setPermission(all, users, 'user:delete:*', false);
    const { include, exclude } = permissionChanges(all, selection, ['user:*:*']);
    expect(exclude).toEqual(['user:*:*', 'user:delete:*']);
    expect(include).toEqual(userItems.filter(item => item !== 'user:delete:*'));
  });

  it('leaves groups the admin did not touch, even when granted through a wildcard', () => {
    // Everything answered true through `*:*:*`, nothing stored; only Insights unticked.
    const initial = [...CATALOG_PERMISSIONS];
    const selection = initial.filter(permission => permission !== 'insight:*:*');
    expect(permissionChanges(initial, selection, [])).toEqual({ include: [], exclude: ['insight:*:*'] });
  });

  it('does not resend a stored item', () => {
    expect(permissionChanges(['user:view:*'], ['user:view:*', 'user:edit:*'], ['user:view:*'])).toEqual({
      include: ['user:edit:*'],
      exclude: []
    });
  });
});

describe('permissionsToDropForViewer', () => {
  it('keeps view permissions only', () => {
    expect(permissionsToDropForViewer(['user:view:*', 'database:*:*', 'etl:*:*'])).toEqual(['database:*:*', 'etl:*:*']);
  });

  it('is empty when nothing is stored', () => {
    expect(permissionsToDropForViewer([])).toEqual([]);
  });
});
