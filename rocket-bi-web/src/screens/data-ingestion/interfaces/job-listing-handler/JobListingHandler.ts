import { JobStatus, SortRequest } from '@core/data-ingestion';

export interface JobListingHandler {
  isAutoRefresh: boolean;
  list(from: number, size: number, keyword: string, sorts: SortRequest[]): Promise<void>;
}
