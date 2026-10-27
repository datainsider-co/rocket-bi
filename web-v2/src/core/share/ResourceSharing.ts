import Deneric from 'deneric2';
import { UserProfile } from '@/core/user/UserProfile';

/**
 * One user a resource is shared with (`users_sharing[]` of `GET share/{type}/{id}`, v1 `SharedUserInfo`). `id` is the
 * share's id (`s_1`), what `share/{type}/{id}/edit` is keyed by. `permissions` are `{orgId}:{type}:{action}:{id}`.
 */
export class SharedUser extends Deneric {
  id = '';
  user = new UserProfile();
  permissions: string[] = [];
  createdAt = 0;
  updatedAt = 0;
  createdBy = '';

  constructor(json?: unknown) {
    super({
      id: ['id', String],
      user: ['user', UserProfile],
      permissions: ['permissions', Deneric.Array(String)],
      createdAt: ['created_at', Number],
      updatedAt: ['updated_at', Number],
      createdBy: ['created_by', String]
    });
    this.fromJson(json);
  }
}

/** `GET share/{type}/{id}`: who owns the resource and who it is shared with (v1 `ResourceInfo`). */
export class ResourceSharing extends Deneric {
  owner = new UserProfile();
  totalUserSharing = 0;
  usersSharing: SharedUser[] = [];

  constructor(json?: unknown) {
    super({
      owner: ['owner', UserProfile],
      totalUserSharing: ['total_user_sharing', Number],
      usersSharing: ['users_sharing', Deneric.Array(SharedUser)]
    });
    this.fromJson(json);
  }
}

/** The link anyone can open (`share/{type}/{id}/anyone`, v1 `PermissionTokenResponse`). */
export class PermissionToken extends Deneric {
  tokenId = '';
  creator = '';
  permissions: string[] = [];
  createdTime = 0;

  constructor(json?: unknown) {
    super({
      tokenId: ['token_id', String],
      creator: ['creator', String],
      permissions: ['permissions', Deneric.Array(String)],
      createdTime: ['created_time', Number]
    });
    this.fromJson(json);
  }
}
