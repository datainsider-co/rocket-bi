import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { HttpPermissionService, PermissionService } from './PermissionService';
import { HttpResourcePermissionService, ResourcePermissionService } from './ResourcePermissionService';

export const PermissionModule: DiModule = di => {
  di.bindSingleton(PermissionService, d => new HttpPermissionService(d.get(ApiClient)));
  di.bindSingleton(ResourcePermissionService, d => new HttpResourcePermissionService(d.get(ApiClient)));
};
