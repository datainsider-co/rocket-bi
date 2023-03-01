import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class GoogleOAuthUsage implements Usage {
  className = UsageClassName.GoogleOAuthUsage;

  static fromObject(obj: any): GoogleOAuthUsage {
    return new GoogleOAuthUsage();
  }
}
