import { describe, expect, it } from 'vitest';
import { fakeHttp } from '@/test/fakeHttp';
import fixture from './admin.fixture.json';
import { HttpPermissionAdminService } from './PermissionAdminService';
import { UserGroup } from './UserGroup';

describe('HttpPermissionAdminService', () => {
  it('changes permissions with include and exclude lists', async () => {
    const { http, requests } = fakeHttp({ body: fixture.changePermissionsInclude.response });

    await new HttpPermissionAdminService(http).changePermissions('u', ['user:view:*'], ['etl:*:*']);

    expect(requests[0]).toEqual({
      method: 'PUT',
      url: 'http://api.test/admin/permissions/u/change',
      body: { username: 'u', include_permissions: ['user:view:*'], exclude_permissions: ['etl:*:*'] }
    });
  });

  it('changes the group', async () => {
    const { http, requests } = fakeHttp({ body: fixture.changeGroup.response });

    await new HttpPermissionAdminService(http).changeGroup('u', UserGroup.Viewer);

    expect(requests[0]).toEqual({
      method: 'POST',
      url: 'http://api.test/admin/permissions/u/group',
      body: { user_group: 'Viewer' }
    });
  });
});
