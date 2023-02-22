import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class GoogleSheetIngestionUsage implements Usage {
  className = UsageClassName.GoogleSheetIngestionUsage;

  static fromObject(obj: any): GoogleSheetIngestionUsage {
    return new GoogleSheetIngestionUsage();
  }
}
