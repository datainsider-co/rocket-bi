import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class LogoAndCompanyNameUsage implements Usage {
  className = UsageClassName.LogoAndCompanyNameUsage;

  static fromObject(obj: any): LogoAndCompanyNameUsage {
    return new LogoAndCompanyNameUsage();
  }
}
