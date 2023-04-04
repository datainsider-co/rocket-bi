import { JobListingHandler } from '@/screens/data-ingestion/interfaces/job-listing-handler/JobListingHandler';
import { JobInfo, JobStatus, ListingResponse, SortRequest } from '@core/data-ingestion';
import { JobModule } from '@/screens/data-ingestion/store/JobStore';

export class AllJobListingHandler implements JobListingHandler {
  constructor(public isAutoRefresh: boolean) {}

  list(from: number, size: number, keyword: string, sorts: SortRequest[]): Promise<void> {
    return JobModule.loadJobList({ from: from, size: size, keyword: keyword, sorts: sorts });
  }
}
