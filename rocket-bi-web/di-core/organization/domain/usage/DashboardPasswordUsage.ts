import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class DashboardPasswordUsage implements Usage {
  className = UsageClassName.DashboardPasswordUsage;

  static fromObject(obj: any): DashboardPasswordUsage {
    return new DashboardPasswordUsage();
  }
}
