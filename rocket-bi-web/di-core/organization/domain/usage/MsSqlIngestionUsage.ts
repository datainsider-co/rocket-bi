import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class MsSqlIngestionUsage implements Usage {
  className = UsageClassName.MsSqlIngestionUsage;

  static fromObject(obj: any): MsSqlIngestionUsage {
    return new MsSqlIngestionUsage();
  }
}
