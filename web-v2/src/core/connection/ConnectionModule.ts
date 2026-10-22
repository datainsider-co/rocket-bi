import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { ConnectionService, HttpConnectionService } from './ConnectionService';

export const ConnectionModule: DiModule = di => {
  di.bindSingleton(ConnectionService, d => new HttpConnectionService(d.get(ApiClient)));
};
