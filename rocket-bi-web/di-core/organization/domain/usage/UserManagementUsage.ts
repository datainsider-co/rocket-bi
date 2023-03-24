import { Usage } from './Usage';
import { UsageClassName } from './UsageClassName';

export class UserManagementUsage implements Usage {
  className = UsageClassName.UserManagementUsage;

  static fromObject(obj: any): UserManagementUsage {
    return new UserManagementUsage();
  }
}
