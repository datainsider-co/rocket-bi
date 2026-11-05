import { asRecord } from '@/core/json/json';
import { UserInfo } from '@/core/user/UserInfo';
import { UserProfile } from '@/core/user/UserProfile';
import { toUserGroup, type UserGroup } from './UserGroup';

/** A row of `admin/users/search/v2`: the account and its profile. */
export interface ManagedUser {
  readonly user: UserInfo;
  readonly profile: UserProfile;
}

/** `GET admin/users/{username}`: the row plus the user's group. */
export interface ManagedUserDetail extends ManagedUser {
  readonly userGroup: UserGroup;
}

export function managedUserFromJson(value: unknown): ManagedUser {
  const json = asRecord(value);
  return { user: new UserInfo(json['user']), profile: new UserProfile(json['profile']) };
}

export function managedUserDetailFromJson(value: unknown): ManagedUserDetail {
  return { ...managedUserFromJson(value), userGroup: toUserGroup(asRecord(value)['user_group']) };
}
