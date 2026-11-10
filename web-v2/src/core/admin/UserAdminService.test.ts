import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/http/ApiError';
import { fakeHttp, type Reply } from '@/test/fakeHttp';
import fixture from './admin.fixture.json';
import { HttpUserAdminService, profileChangesToJson } from './UserAdminService';
import { UserGroup } from './UserGroup';

function setup(...replies: Reply[]) {
  const { http, requests } = fakeHttp(...replies);
  return { service: new HttpUserAdminService(http), requests };
}

const editor = fixture.createEditor.response.user_info.username;

describe('HttpUserAdminService', () => {
  it('searches with query parameters and no body', async () => {
    const { service, requests } = setup({ body: fixture.searchKeyword.response });

    const page = await service.search({ from: 0, size: 20, keyword: 'os0' });

    expect(requests[0]).toEqual({
      method: 'POST',
      url: 'http://api.test/admin/users/search/v2?from=0&size=20&keyword=os0',
      body: undefined
    });
    expect(page.total).toBe(2);
    expect(page.data[0]?.profile.email).toMatch(/^os0\./);
    expect(page.data[0]?.user.isActive).toBe(true);
  });

  it('leaves an empty keyword out', async () => {
    const { service, requests } = setup({ body: fixture.search.response });

    await service.search({ from: 20, size: 20, keyword: '' });

    expect(requests[0]?.url).toBe('http://api.test/admin/users/search/v2?from=20&size=20');
  });

  it('creates a user and answers the username', async () => {
    const { service, requests } = setup({ body: fixture.createEditor.response });

    const username = await service.create({
      email: 'os0.editor@example.com',
      password: 'secret',
      firstName: 'OS0',
      lastName: 'Editor',
      userGroup: UserGroup.Editor
    });

    expect(username).toBe(editor);
    expect(requests[0]?.body).toEqual({
      email: 'os0.editor@example.com',
      password: 'secret',
      full_name: 'OS0 Editor',
      first_name: 'OS0',
      last_name: 'Editor',
      user_group: 'Editor'
    });
  });

  it('fails a taken email with email_existed', async () => {
    const { service } = setup({ status: 400, body: fixture.createDuplicate.response });

    const error = await service
      .create({ email: 'x@y.z', password: 'p', firstName: 'a', lastName: 'b', userGroup: UserGroup.Viewer })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).reason).toBe('email_existed');
  });

  it('gets a user with their group and stored permissions', async () => {
    const { service, requests } = setup({ body: fixture.detail.response });

    const detail = await service.get(editor);

    expect(requests[0]?.url).toBe(`http://api.test/admin/users/${editor}`);
    expect(detail.userGroup).toBe(UserGroup.Editor);
    expect(detail.user.permissions).toEqual(['0:edit_data', '0:view_data']);
    expect(detail.profile.fullName).toBe('OS0 Editor');
  });

  it('sends only the changed profile fields', async () => {
    const { service, requests } = setup({ body: fixture.editProfileOneField.response });

    const profile = await service.updateProfile(editor, { mobilePhone: '0987654321' });

    expect(requests[0]).toMatchObject({ method: 'PUT', body: { mobile_phone: '0987654321' } });
    expect(profile.mobilePhone).toBe('0987654321');
  });

  it('sends property keys as they are', async () => {
    const { service, requests } = setup({ body: fixture.setProperties.response });

    const profile = await service.updateProperties(editor, { 'My Field': 'a', 'ssl.mode': 'b' }, ['old key']);

    expect(requests[0]).toMatchObject({
      method: 'PUT',
      url: `http://api.test/admin/users/${editor}/property`,
      body: { properties: { 'My Field': 'a', 'ssl.mode': 'b' }, deleted_property_keys: ['old key'] }
    });
    expect(profile.properties['ssl.mode']).toBe('b');
  });

  it('suspends, reactivates and resets the password', async () => {
    const { service, requests } = setup({ body: true }, { body: true }, { body: fixture.resetPassword.response });

    await service.deactivate(editor);
    await service.activate(editor);
    await service.resetPassword(editor);

    expect(requests.map(request => `${request.method} ${request.url}`)).toEqual([
      `POST http://api.test/admin/users/${editor}/deactivate`,
      `POST http://api.test/admin/users/${editor}/activate`,
      `PUT http://api.test/admin/users/${editor}/reset_password`
    ]);
  });

  it('deletes through user-data, with or without a transfer', async () => {
    const { service, requests } = setup({ body: fixture.deleteTransfer.response });

    await service.delete('u1', 'hello@gmail.com');
    await service.delete('u2');

    expect(requests[0]).toEqual({
      method: 'DELETE',
      url: 'http://api.test/user-data/u1',
      body: { username: 'u1', transfer_to_email: 'hello@gmail.com' }
    });
    expect(requests[1]?.body).toEqual({ username: 'u2' });
  });
});

describe('profileChangesToJson', () => {
  it('maps every field to the server name', () => {
    expect(
      profileChangesToJson({
        fullName: 'a b',
        firstName: 'a',
        lastName: 'b',
        mobilePhone: '1',
        gender: 1,
        dob: 946684800000,
        avatar: ''
      })
    ).toEqual({ full_name: 'a b', first_name: 'a', last_name: 'b', mobile_phone: '1', gender: 1, dob: 946684800000, avatar: '' });
  });

  it('is empty for no changes', () => {
    expect(profileChangesToJson({})).toEqual({});
  });
});
