import { describe, expect, it } from 'vitest';
import {
  OrgPermission,
  OrganizationSection,
  organizationSectionFromPath,
  toOrgPermissions,
  userDetailPath,
  visibleSections
} from './organization.utils';

describe('toOrgPermissions', () => {
  it('reads granted permissions and treats missing ones as refused', () => {
    const permissions = toOrgPermissions({ 'user:view:*': true, 'user:create:*': false, other: true });
    expect(permissions[OrgPermission.viewUsers]).toBe(true);
    expect(permissions[OrgPermission.createUsers]).toBe(false);
    expect(permissions[OrgPermission.manageConnection]).toBe(false);
    expect(Object.keys(permissions)).not.toContain('other');
  });
});

describe('visibleSections', () => {
  it('shows the sections the user may see, in sidebar order', () => {
    const all = toOrgPermissions({ 'user:view:*': true, 'organization:manage:connection': true });
    expect(visibleSections(all).map(section => section.key)).toEqual([
      OrganizationSection.Users,
      OrganizationSection.DataSource
    ]);
  });

  it('hides a section without its permission', () => {
    const permissions = toOrgPermissions({ 'organization:manage:connection': true });
    expect(visibleSections(permissions).map(section => section.key)).toEqual([OrganizationSection.DataSource]);
  });

  it('is empty without any permission', () => {
    expect(visibleSections(toOrgPermissions({}))).toEqual([]);
  });
});

describe('organizationSectionFromPath', () => {
  it.each([
    ['/settings/organization/user-management', OrganizationSection.Users],
    ['/settings/organization/user-management/up-1', OrganizationSection.Users],
    ['/settings/organization/clickhouse-config', OrganizationSection.DataSource],
    ['/settings/organization/overview', undefined],
    ['/settings/organization', undefined],
    ['/settings/organizationx/user-management', undefined]
  ])('%s → %s', (pathname, expected) => {
    expect(organizationSectionFromPath(pathname)).toBe(expected);
  });
});

describe('userDetailPath', () => {
  it('encodes the username', () => {
    expect(userDetailPath('up-1')).toBe('/settings/organization/user-management/up-1');
    expect(userDetailPath('a b')).toBe('/settings/organization/user-management/a%20b');
  });
});
