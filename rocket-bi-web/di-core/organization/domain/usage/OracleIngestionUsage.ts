import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class OracleIngestionUsage implements Usage {
  className = UsageClassName.OracleIngestionUsage;

  static fromObject(obj: any): OracleIngestionUsage {
    return new OracleIngestionUsage();
  }
}
