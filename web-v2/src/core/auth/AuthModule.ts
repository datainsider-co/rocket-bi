import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { AuthenticationService, HttpAuthenticationService } from './AuthenticationService';

export const AuthModule: DiModule = di => {
  di.bindSingleton(AuthenticationService, d => new HttpAuthenticationService(d.get(ApiClient)));
};
