import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class CdpUsage implements Usage {
  className = UsageClassName.CdpUsage;

  static fromObject(obj: any): CdpUsage {
    return new CdpUsage();
  }
}
