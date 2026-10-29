import { describe, expect, it } from 'vitest';
import { SHARE_LEVEL_ACTIONS, ShareLevel, shareLevelOf } from './shareLevel';

describe('shareLevelOf', () => {
  it.each([
    [['0:directory:view:7', '0:directory:edit:7'], ShareLevel.Edit],
    [['0:directory:edit:7'], ShareLevel.Edit],
    [['0:directory:view:7', '0:directory:download:7'], ShareLevel.ViewAndDownload],
    [['0:directory:view:7'], ShareLevel.View],
    [['0:directory:download:7'], ShareLevel.None],
    [[], ShareLevel.None]
  ])('reads %j as %s', (permissions, level) => {
    expect(shareLevelOf(permissions, 'directory', 7)).toBe(level);
  });

  it('ignores permissions on other resources', () => {
    expect(shareLevelOf(['0:directory:edit:70', '0:dashboard:edit:7', '0:directory:view:7'], 'directory', 7)).toBe(ShareLevel.View);
  });

  it('ignores malformed permissions', () => {
    expect(shareLevelOf(['view', 'directory:view', ''], 'directory', 7)).toBe(ShareLevel.None);
  });

  it('reads a database share, named by the database (DW0)', () => {
    const permissions = ['0:database:view:dw0_probe', '0:database:download:dw0_probe', '0:database:edit:other'];
    expect(shareLevelOf(permissions, 'database', 'dw0_probe')).toBe(ShareLevel.ViewAndDownload);
  });
});

describe('SHARE_LEVEL_ACTIONS', () => {
  it('sends v1 actions per level', () => {
    expect(SHARE_LEVEL_ACTIONS[ShareLevel.Edit]).toEqual(['view', 'download', 'edit', 'copy', 'delete', 'create']);
    expect(SHARE_LEVEL_ACTIONS[ShareLevel.ViewAndDownload]).toEqual(['view', 'download']);
    expect(SHARE_LEVEL_ACTIONS[ShareLevel.View]).toEqual(['view']);
    expect(SHARE_LEVEL_ACTIONS[ShareLevel.None]).toEqual([]);
  });

  it('gives back the level it was built from', () => {
    for (const level of Object.values(ShareLevel)) {
      const permissions = SHARE_LEVEL_ACTIONS[level].map(action => `0:directory:${action}:7`);
      expect(shareLevelOf(permissions, 'directory', 7)).toBe(level);
    }
  });
});
