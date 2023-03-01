import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class GenericJdbcIngestionUsage implements Usage {
  className = UsageClassName.GenericJdbcIngestionUsage;

  static fromObject(obj: any): GenericJdbcIngestionUsage {
    return new GenericJdbcIngestionUsage();
  }
}
