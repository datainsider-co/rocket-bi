import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class DataCookUsage implements Usage {
  className = UsageClassName.DataCookUsage;

  static fromObject(obj: any): DataCookUsage {
    return new DataCookUsage();
  }
}
