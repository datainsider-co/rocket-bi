import { UsageClassName } from './UsageClassName';
import { CdpUsage } from '@core/organization/domain/usage/CdpUsage';
import { DIException } from '@core/common/domain/exception/DIException';

export abstract class Usage {
  abstract className: UsageClassName;

  static fromObject<T extends Usage>(obj: any): T {
    const className = obj.className as UsageClassName;
    switch (className) {
      case UsageClassName.CdpUsage:
        return CdpUsage.fromObject(obj) as T;
      case UsageClassName.LakeUsage:
        return CdpUsage.fromObject(obj) as T;
      default:
        throw new DIException(`unsupported class name: ${className}`);
    }
  }
}
