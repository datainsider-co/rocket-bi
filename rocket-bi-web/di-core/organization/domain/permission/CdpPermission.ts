import { CdpUsage } from '@core/organization';
import { Permission } from './Permission';
import { PermissionClassName } from './PermissionClassName';

export class CdpPermission extends Permission<CdpUsage> {
  className = PermissionClassName.CdpPermission;

  static fromObject(obj: any): CdpPermission {
    return new CdpPermission();
  }

  isAllow(usage: CdpUsage): boolean {
    return true;
  }
}
