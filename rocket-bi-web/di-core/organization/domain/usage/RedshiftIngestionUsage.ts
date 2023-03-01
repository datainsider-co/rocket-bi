import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class RedshiftIngestionUsage implements Usage {
  className = UsageClassName.RedshiftIngestionUsage;

  static fromObject(obj: any): RedshiftIngestionUsage {
    return new RedshiftIngestionUsage();
  }
}
