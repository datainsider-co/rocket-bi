import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { HttpShareService, ShareService } from './ShareService';

export const ShareModule: DiModule = di => {
  di.bindSingleton(ShareService, d => new HttpShareService(d.get(ApiClient)));
};
