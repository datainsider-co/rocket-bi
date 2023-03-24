import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class ApiKeyUsage implements Usage {
  className = UsageClassName.ApiKeyUsage;

  static fromObject(obj: any): ApiKeyUsage {
    return new ApiKeyUsage();
  }
}
