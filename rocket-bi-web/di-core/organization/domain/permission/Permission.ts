import { CdpPermission, LakePermission, Usage, PermissionClassName } from '@core/organization';
import { DIException } from '@core/common/domain';

export abstract class Permission<T extends Usage> {
  abstract className: PermissionClassName;

  abstract isAllow(usage: T): boolean;

  static fromObject<U extends Usage = Usage>(obj: any): Permission<U> {
    switch (obj.className) {
      case PermissionClassName.CdpPermission:
        return CdpPermission.fromObject(obj);
      case PermissionClassName.LakePermission:
        return LakePermission.fromObject(obj);
      default:
        throw new DIException(`Unknown permission class name: ${obj.className}`);
    }
  }
}
