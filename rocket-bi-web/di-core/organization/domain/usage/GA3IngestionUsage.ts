import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class GA3IngestionUsage implements Usage {
  className = UsageClassName.GA3IngestionUsage;

  static fromObject(obj: any): GA3IngestionUsage {
    return new GA3IngestionUsage();
  }
}
