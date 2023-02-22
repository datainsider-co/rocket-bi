import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class GoogleAdsIngestionUsage implements Usage {
  className = UsageClassName.GoogleAdsIngestionUsage;

  static fromObject(obj: any): GoogleAdsIngestionUsage {
    return new GoogleAdsIngestionUsage();
  }
}
