import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class S3IngestionUsage implements Usage {
  className = UsageClassName.S3IngestionUsage;

  static fromObject(obj: any): S3IngestionUsage {
    return new S3IngestionUsage();
  }
}
