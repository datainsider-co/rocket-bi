import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { DirectoryService, HttpDirectoryService } from './DirectoryService';

export const DirectoryModule: DiModule = di => {
  di.bindSingleton(DirectoryService, d => new HttpDirectoryService(d.get(ApiClient)));
};
