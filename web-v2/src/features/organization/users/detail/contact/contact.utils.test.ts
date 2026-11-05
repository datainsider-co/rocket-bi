import { describe, expect, it } from 'vitest';
import { UserGroup } from '@/core/admin/UserGroup';
import { ORG_PERMISSIONS, toOrgPermissions } from '../../../organization.utils';
import { contactAbilities, resetPasswordText, roleChangeText } from './contact.utils';

const all = toOrgPermissions(Object.fromEntries(ORG_PERMISSIONS.map(permission => [permission, true])));

describe('contactAbilities', () => {
  it('allows everything with every permission on someone else', () => {
    expect(Object.values(contactAbilities(all, false, UserGroup.Editor)).every(Boolean)).toBe(true);
  });

  it('allows nothing while permissions load', () => {
    expect(Object.values(contactAbilities(undefined, false, UserGroup.Editor)).some(Boolean)).toBe(false);
  });

  it('keeps users from suspending, deleting or demoting themselves', () => {
    const own = contactAbilities(all, true, UserGroup.Editor);
    expect(own).toMatchObject({ suspend: false, delete: false, changeRole: false, editProfile: true, resetPassword: true });
  });

  it('does not change the role of the owner', () => {
    expect(contactAbilities(all, false, UserGroup.None).changeRole).toBe(false);
  });

  it('follows each permission', () => {
    const viewOnly = toOrgPermissions({ 'user:view:*': true, 'permission:view:*': true });
    expect(contactAbilities(viewOnly, false, UserGroup.Viewer)).toEqual({
      editProfile: false,
      changeRole: false,
      resetPassword: false,
      suspend: false,
      delete: false,
      viewPrivileges: true,
      assignPrivileges: false
    });
  });
});

describe('resetPasswordText', () => {
  it('names the password when the deployment gives it', () => {
    expect(resetPasswordText('di@123456')).toBe('The password was reset to di@123456.');
  });

  it("says it is the server's default otherwise", () => {
    expect(resetPasswordText('')).toMatch(/server's default/);
  });
});

describe('roleChangeText', () => {
  it('asks about an Editor', () => {
    expect(roleChangeText('Ann', UserGroup.Editor, [])).toBe('Make Ann an Editor?');
  });

  it('lists what a Viewer loses', () => {
    expect(roleChangeText('Ann', UserGroup.Viewer, ['etl:*:*'])).toContain('removed: etl:*:*');
    expect(roleChangeText('Ann', UserGroup.Viewer, [])).toBe('Make Ann a Viewer?');
  });
});
