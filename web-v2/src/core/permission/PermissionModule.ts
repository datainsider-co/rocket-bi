import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { HttpPermissionService, PermissionService } from './PermissionService';

export const PermissionModule: DiModule = di => {
  di.bindSingleton(PermissionService, d => new HttpPermissionService(d.get(ApiClient)));
};
