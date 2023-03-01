import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class PostgreIngestionUsage implements Usage {
  className = UsageClassName.PostgreIngestionUsage;

  static fromObject(obj: any): PostgreIngestionUsage {
    return new PostgreIngestionUsage();
  }
}
