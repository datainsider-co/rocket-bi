import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class MySqlIngestionUsage implements Usage {
  className = UsageClassName.MySqlIngestionUsage;

  static fromObject(obj: any): MySqlIngestionUsage {
    return new MySqlIngestionUsage();
  }
}
