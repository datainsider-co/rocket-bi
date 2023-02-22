import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class MongoIngestionUsage implements Usage {
  className = UsageClassName.MongoIngestionUsage;

  static fromObject(obj: any): MongoIngestionUsage {
    return new MongoIngestionUsage();
  }
}
