import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class ShopifyIngestionUsage implements Usage {
  className = UsageClassName.ShopifyIngestionUsage;

  static fromObject(obj: any): ShopifyIngestionUsage {
    return new ShopifyIngestionUsage();
  }
}
