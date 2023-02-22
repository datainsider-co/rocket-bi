import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class PrimarySupportUsage implements Usage {
  className = UsageClassName.PrimarySupportUsage;

  static fromObject(obj: any): PrimarySupportUsage {
    return new PrimarySupportUsage();
  }
}
