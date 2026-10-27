import { describe, expect, it } from 'vitest';
import { needsPassword, OWNER_PERMISSIONS, passwordError, permissionsOf, VIEW_ONLY } from './access.utils';

/** sha256("abc"), as v1 stored it for the password "abc". */
const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

describe('permissionsOf', () => {
  it('grants each action on its own', () => {
    expect(permissionsOf(['view', 'download'])).toEqual({
      canEdit: false,
      canDownload: true,
      canCopy: false,
      canDelete: false,
      canCreate: false,
      canShare: false
    });
  });

  it('grants everything, Share included, for *', () => {
    expect(permissionsOf(['*'])).toEqual(OWNER_PERMISSIONS);
    expect(Object.values(OWNER_PERMISSIONS).every(Boolean)).toBe(true);
  });

  it('grants nothing for an empty list', () => {
    expect(Object.values(permissionsOf([])).some(Boolean)).toBe(false);
    expect(VIEW_ONLY.canDownload).toBe(false);
  });
});

describe('needsPassword', () => {
  it('asks everyone but the owner once the password is on', () => {
    expect(needsPassword({ passwordEnabled: true, ownerId: 'root' }, 'ann')).toBe(true);
    expect(needsPassword({ passwordEnabled: true, ownerId: 'root' }, 'root')).toBe(false);
    expect(needsPassword({ passwordEnabled: false, ownerId: 'root' }, 'ann')).toBe(false);
  });
});

describe('passwordError', () => {
  it.each([
    ['', ABC, 'Password is required!'],
    ['abc', '', 'Password not found!'],
    ['abd', ABC, 'Password is incorrect!'],
    ['abc', ABC, undefined]
  ])('%j against %j → %j', (password, hashed, error) => {
    expect(passwordError(password, hashed)).toBe(error);
  });
});
