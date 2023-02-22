import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class GA4IngestionUsage implements Usage {
  className = UsageClassName.GA4IngestionUsage;

  static fromObject(obj: any): GA4IngestionUsage {
    return new GA4IngestionUsage();
  }
}
