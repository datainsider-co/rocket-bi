import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { HttpLoginMethodService, LoginMethodService } from './LoginMethodService';
import { HttpPermissionAdminService, PermissionAdminService } from './PermissionAdminService';
import { HttpUserAdminService, UserAdminService } from './UserAdminService';

export const AdminModule: DiModule = di => {
  di.bindSingleton(UserAdminService, d => new HttpUserAdminService(d.get(ApiClient)));
  di.bindSingleton(PermissionAdminService, d => new HttpPermissionAdminService(d.get(ApiClient)));
  di.bindSingleton(LoginMethodService, d => new HttpLoginMethodService(d.get(ApiClient)));
};
