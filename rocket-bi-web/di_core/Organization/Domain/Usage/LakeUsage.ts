import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class LakeUsage implements Usage {
  className = UsageClassName.LakeUsage;

  static fromObject(obj: any): LakeUsage {
    return new LakeUsage();
  }
}
