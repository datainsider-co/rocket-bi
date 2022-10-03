import { LakeUsage } from '@core/organization';
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
