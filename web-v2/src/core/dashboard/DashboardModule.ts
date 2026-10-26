import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { DashboardService, HttpDashboardService } from './DashboardService';

export const DashboardModule: DiModule = di => {
  di.bindSingleton(DashboardService, d => new HttpDashboardService(d.get(ApiClient)));
};
