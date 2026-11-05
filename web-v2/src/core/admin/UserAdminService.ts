import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import { asRecord, asString, withoutUndefined } from '@/core/json/json';
import { listingPageFromJson, type ListingPage } from '@/core/listing/Listing';
import { UserProfile } from '@/core/user/UserProfile';
import { managedUserDetailFromJson, managedUserFromJson, type ManagedUser, type ManagedUserDetail } from './ManagedUser';
import type { UserGroup } from './UserGroup';

export interface UserSearch {
  readonly from: number;
  readonly size: number;
  readonly keyword?: string | undefined;
}

export interface NewUser {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly userGroup: UserGroup;
}

/** Fields of `PUT admin/users/{username}`; only those given are changed. `dob` is epoch millis. */
export interface ProfileChanges {
  readonly fullName?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly mobilePhone?: string;
  readonly gender?: number;
  readonly dob?: number;
  readonly avatar?: string;
}

/** The organization's users, for admins (v1 `UserAdminService`). Paths and fields checked in OS0. */
export interface UserAdminService {
  /** People only: the server leaves API key users out unless asked for them. */
  search(request: UserSearch): Promise<ListingPage<ManagedUser>>;
  /** Resolves with the new user's username. Fails with reason `email_existed` for a taken email. */
  create(user: NewUser): Promise<string>;
  get(username: string): Promise<ManagedUserDetail>;
  updateProfile(username: string, changes: ProfileChanges): Promise<UserProfile>;
  /** `properties` are merged into the stored ones; `deletedKeys` are removed. Keys are data, sent as they are. */
  updateProperties(username: string, properties: Record<string, string>, deletedKeys: readonly string[]): Promise<UserProfile>;
  activate(username: string): Promise<void>;
  deactivate(username: string): Promise<void>;
  /** Sets the password to the server's configured default; the server doesn't say what it is. */
  resetPassword(username: string): Promise<void>;
  /**
   * Deletes the user. With `transferToEmail`, their dashboards and folders go to that user first; without it they are
   * deleted too (BI's `user-data`, not caas' `admin/users/{u}/delete`, which leaves the data behind).
   */
  delete(username: string, transferToEmail?: string): Promise<void>;
}

export const UserAdminService = token<UserAdminService>('UserAdminService');

function userPath(username: string): string {
  return `admin/users/${encodeURIComponent(username)}`;
}

export function profileChangesToJson(changes: ProfileChanges): Record<string, unknown> {
  return withoutUndefined({
    full_name: changes.fullName,
    first_name: changes.firstName,
    last_name: changes.lastName,
    mobile_phone: changes.mobilePhone,
    gender: changes.gender,
    dob: changes.dob,
    avatar: changes.avatar
  });
}

export class HttpUserAdminService implements UserAdminService {
  constructor(private readonly http: KyInstance) {}

  async search({ from, size, keyword }: UserSearch): Promise<ListingPage<ManagedUser>> {
    // Query parameters, no body, as the server reads them.
    const searchParams = withoutUndefined({ from, size, keyword: keyword || undefined });
    return listingPageFromJson(await this.http.post('admin/users/search/v2', { searchParams }).json(), managedUserFromJson);
  }

  async create({ email, password, firstName, lastName, userGroup }: NewUser): Promise<string> {
    const json = asRecord(
      await this.http
        .post('admin/users/create', {
          json: {
            email,
            password,
            full_name: `${firstName} ${lastName}`.trim(),
            first_name: firstName,
            last_name: lastName,
            user_group: userGroup
          }
        })
        .json()
    );
    return asString(asRecord(json['user_info'])['username']);
  }

  async get(username: string): Promise<ManagedUserDetail> {
    return managedUserDetailFromJson(await this.http.get(userPath(username)).json());
  }

  async updateProfile(username: string, changes: ProfileChanges): Promise<UserProfile> {
    return new UserProfile(await this.http.put(userPath(username), { json: profileChangesToJson(changes) }).json());
  }

  async updateProperties(
    username: string,
    properties: Record<string, string>,
    deletedKeys: readonly string[]
  ): Promise<UserProfile> {
    const json = { properties: { ...properties }, deleted_property_keys: [...deletedKeys] };
    return new UserProfile(await this.http.put(`${userPath(username)}/property`, { json }).json());
  }

  async activate(username: string): Promise<void> {
    await this.http.post(`${userPath(username)}/activate`);
  }

  async deactivate(username: string): Promise<void> {
    await this.http.post(`${userPath(username)}/deactivate`);
  }

  async resetPassword(username: string): Promise<void> {
    await this.http.put(`${userPath(username)}/reset_password`);
  }

  async delete(username: string, transferToEmail?: string): Promise<void> {
    const json = withoutUndefined({ username, transfer_to_email: transferToEmail });
    await this.http.delete(`user-data/${encodeURIComponent(username)}`, { json });
  }
}
