import { LakeUsage } from '@core/Organization';
import { Permission } from './Permission';
import { PermissionClassName } from './PermissionClassName';

export class LakePermission extends Permission<LakeUsage> {
  className = PermissionClassName.LakePermission;

  static fromObject(obj: any): LakePermission {
    return new LakePermission();
  }

  isAllow(usage: LakeUsage): boolean {
    return true;
  }
}
