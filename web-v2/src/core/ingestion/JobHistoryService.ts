import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import {
  listingPageFromJson,
  listingRequestToJson,
  type ListingPage,
  type ListingRequest
} from '@/core/listing/Listing';
import { jobHistoryFromJson, type JobHistory } from './JobHistory';

/** Columns of the backend `history` table that `history/list` can sort by (not the JSON names). */
export const JobHistorySortField = {
  Id: 'id',
  JobId: 'job_id',
  JobName: 'job_name',
  LastSyncTime: 'last_sync_time',
  TotalSyncTime: 'total_sync_time',
  SyncStatus: 'sync_status',
  TotalInsertedRows: 'total_inserted_rows'
} as const;

export type JobHistorySortField = (typeof JobHistorySortField)[keyof typeof JobHistorySortField];

export interface JobHistoryService {
  list(request: ListingRequest<JobHistorySortField>, signal?: AbortSignal): Promise<ListingPage<JobHistory>>;
}

export const JobHistoryService = token<JobHistoryService>('JobHistoryService');

export class HttpJobHistoryService implements JobHistoryService {
  constructor(private readonly http: KyInstance) {}

  async list(request: ListingRequest<JobHistorySortField>, signal?: AbortSignal): Promise<ListingPage<JobHistory>> {
    const json = await this.http.post('history/list', { json: listingRequestToJson(request), signal }).json();
    return listingPageFromJson(json, jobHistoryFromJson);
  }
}
