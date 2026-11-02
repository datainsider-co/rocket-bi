import type { DiModule } from '@/core/di/Container';
import { ApiClient } from '@/core/http/tokens';
import { EtlHistoryService, HttpEtlHistoryService } from './EtlHistoryService';
import { EtlPreviewService, HttpEtlPreviewService } from './EtlPreviewService';
import { EtlService, HttpEtlService } from './EtlService';
import { EtlShareService, HttpEtlShareService } from './EtlShareService';

/** Services of the Data Cook pages. v1's `DataCookClient` was the same `/api` client as the others. */
export const DataCookModule: DiModule = di => {
  di.bindSingleton(EtlService, d => new HttpEtlService(d.get(ApiClient)));
  di.bindSingleton(EtlPreviewService, d => new HttpEtlPreviewService(d.get(ApiClient)));
  di.bindSingleton(EtlHistoryService, d => new HttpEtlHistoryService(d.get(ApiClient)));
  di.bindSingleton(EtlShareService, d => new HttpEtlShareService(d.get(ApiClient)));
};
