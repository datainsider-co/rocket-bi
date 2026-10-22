import Deneric from 'deneric2';
import { Organization } from './Organization';

/** Account data: roles, permissions and organization. Field names follow the backend `UserInfo` case class. */
export class UserInfo extends Deneric {
  username = '';
  roles: number[] = [];
  permissions: string[] = [];
  isActive = false;
  createdTime = 0;
  organization = new Organization();

  constructor(json?: unknown) {
    super({
      username: ['username', String],
      roles: ['roles', Deneric.Array(Number)],
      permissions: ['permissions', Deneric.Array(String)],
      isActive: ['is_active', Boolean],
      createdTime: ['created_time', Number],
      organization: ['organization', Organization]
    });
    this.fromJson(json);
  }
}
