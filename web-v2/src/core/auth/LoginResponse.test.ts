import { describe, expect, it } from 'vitest';
import { Organization } from '@/core/user/Organization';
import { UserInfo } from '@/core/user/UserInfo';
import { UserProfile } from '@/core/user/UserProfile';
import { LoginResponse } from './LoginResponse';
import { SessionInfo } from './SessionInfo';

// Captured from POST /user/auth/login on the local docker stack.
const LOGIN_JSON = {
  session: {
    key: 'ssid',
    value: '3fbcbf72-9d7c-45c1-bac2-6f105165b027',
    domain: '.datainsider.co',
    max_age_in_ms: 31104000000,
    created_at: 1792680149166,
    path: '/',
    max_age: 31104000,
    expired_at: 1823784149166
  },
  user_info: {
    username: 'root',
    roles: [],
    is_active: true,
    created_time: 1792599231000,
    organization: {
      organization_id: 0,
      owner: 'root',
      name: 'Data Insider',
      domain: '',
      is_active: true,
      report_time_zone_id: 'Asia/Saigon',
      created_time: 1792599231000,
      updated_time: 1792599231000,
      updated_by: 'root',
      licence_key: '67a63147-cd6a-11f1-accf-5a41580efba6'
    },
    permissions: ['0:*:*:*', '0:directory:*:1', '0:edit_data', '0:view_data']
  },
  user_profile: {
    username: 'root',
    full_name: 'root',
    email: 'hello@gmail.com',
    gender: 0,
    already_confirmed: true,
    updated_time: 1792599231000,
    created_time: 1792599231000
  }
};

describe('LoginResponse', () => {
  it('maps every snake_case field of a real login response', () => {
    const response = new LoginResponse(LOGIN_JSON);

    expect(response.session).toBeInstanceOf(SessionInfo);
    expect(response.session).toMatchObject({
      key: 'ssid',
      value: '3fbcbf72-9d7c-45c1-bac2-6f105165b027',
      domain: '.datainsider.co',
      path: '/',
      maxAge: 31104000,
      maxAgeInMs: 31104000000,
      createdAt: 1792680149166,
      expiredAt: 1823784149166
    });

    expect(response.userInfo).toBeInstanceOf(UserInfo);
    expect(response.userInfo).toMatchObject({
      username: 'root',
      roles: [],
      isActive: true,
      createdTime: 1792599231000,
      permissions: ['0:*:*:*', '0:directory:*:1', '0:edit_data', '0:view_data']
    });
    expect(response.userInfo.organization).toBeInstanceOf(Organization);
    expect(response.userInfo.organization).toMatchObject({
      organizationId: 0,
      owner: 'root',
      name: 'Data Insider',
      isActive: true,
      reportTimeZoneId: 'Asia/Saigon',
      updatedBy: 'root',
      licenceKey: '67a63147-cd6a-11f1-accf-5a41580efba6'
    });

    expect(response.userProfile).toBeInstanceOf(UserProfile);
    expect(response.userProfile).toMatchObject({
      username: 'root',
      fullName: 'root',
      email: 'hello@gmail.com',
      gender: 0,
      alreadyConfirmed: true,
      createdTime: 1792599231000
    });
  });

  it('parses a response without user_profile to an empty profile', () => {
    const { user_profile: _, ...withoutProfile } = LOGIN_JSON;

    expect(new LoginResponse(withoutProfile).userProfile.username).toBe('');
  });

  it('falls back to defaults for an empty body', () => {
    const response = new LoginResponse(undefined);

    expect(response.session.value).toBe('');
    expect(response.userInfo.organization.name).toBe('');
  });
});

describe('UserProfile', () => {
  it('keeps the keys of properties exactly as sent', () => {
    const profile = new UserProfile({ username: 'a', properties: { order_id: '1', 'Order Date': '2', camelKey: '3' } });

    expect(profile.properties).toEqual({ order_id: '1', 'Order Date': '2', camelKey: '3' });
    expect(profile.toJson()).toMatchObject({ properties: { order_id: '1', 'Order Date': '2', camelKey: '3' } });
  });

  it.each([
    [{ full_name: 'Full', first_name: 'F', last_name: 'L', email: 'e@x', username: 'u' }, 'Full'],
    [{ first_name: 'F', last_name: 'L', email: 'e@x', username: 'u' }, 'F L'],
    [{ first_name: 'F', email: 'e@x', username: 'u' }, 'F'],
    [{ email: 'e@x', username: 'u' }, 'e@x'],
    [{ username: 'u' }, 'u']
  ])('displayName of %j is %s', (json, expected) => {
    expect(new UserProfile(json).displayName).toBe(expected);
  });
});
