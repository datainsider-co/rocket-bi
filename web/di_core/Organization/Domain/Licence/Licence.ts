import { LicenceStatus, PermissionClassName, Usage } from '@core/Organization/Domain';
import { Permission } from '@core/Organization/Domain/Permission/Permission';

export class Licence {
  licenceKey: string;
  createdAt: number;
  expiredAt: number;
  status: LicenceStatus;
  permissions: Permission<Usage>[];
  maxSessionCount: number;

  constructor(licenceKey: string, createdAt: number, expiredAt: number, status: LicenceStatus, permissions: Permission<Usage>[], maxSessionCount: number) {
    this.licenceKey = licenceKey;
    this.createdAt = createdAt;
    this.expiredAt = expiredAt;
    this.status = status;
    this.permissions = permissions;
    this.maxSessionCount = maxSessionCount;
  }

  static fromObject(obj: any): Licence {
    const permissions: Permission<Usage>[] = obj.permissions.map((permission: any) => Permission.fromObject(permission));
    return new Licence(obj.licenceKey, obj.createdAt, obj.expiredAt, obj.status, permissions, obj.maxSessionCount);
  }

  static community(): Licence {
    return new Licence('', Date.now(), Date.now(), LicenceStatus.Community, [], 1);
  }

  getPermission<T extends Usage>(className: PermissionClassName): Permission<T>[] {
    return this.permissions.filter(permission => permission.className === className);
  }

  isAllowAll(className: PermissionClassName, usage: Usage): boolean {
    // trick find exist not allow permission will return false
    const isNotAllow = this.getPermission(className).some(permission => !permission.isAllow(usage));
    return isNotAllow == false;
  }
}
