import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class BigQueryIngestionUsage implements Usage {
  className = UsageClassName.BigQueryIngestionUsage;

  static fromObject(obj: any): BigQueryIngestionUsage {
    return new BigQueryIngestionUsage();
  }
}
