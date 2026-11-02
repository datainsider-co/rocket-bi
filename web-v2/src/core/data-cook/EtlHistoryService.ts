import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';
import {
  listingPageFromJson,
  listingRequestToJson,
  type ListingPage,
  type ListingRequest
} from '@/core/listing/Listing';
import { etlHistoryFromJson, type EtlHistory } from './EtlHistory';

/** Columns of the backend's ETL history table that `data_cook/history` can sort by (checked in DC0). */
export const EtlHistorySortField = {
  Id: 'id',
  EtlId: 'etl_job_id',
  CreatedTime: 'created_time',
  UpdatedTime: 'updated_time',
  TotalExecutionTime: 'total_execution_time',
  Status: 'status',
  Message: 'message'
} as const;

export type EtlHistorySortField = (typeof EtlHistorySortField)[keyof typeof EtlHistorySortField];

export interface EtlHistoryService {
  /** Runs of every ETL the user can see; `keyword` matches the ETL's name. */
  list(request: ListingRequest<EtlHistorySortField>, signal?: AbortSignal): Promise<ListingPage<EtlHistory>>;
}

export const EtlHistoryService = token<EtlHistoryService>('EtlHistoryService');

export class HttpEtlHistoryService implements EtlHistoryService {
  constructor(private readonly http: KyInstance) {}

  async list(request: ListingRequest<EtlHistorySortField>, signal?: AbortSignal): Promise<ListingPage<EtlHistory>> {
    const json = await this.http.post('data_cook/history', { json: listingRequestToJson(request), signal }).json();
    return listingPageFromJson(json, etlHistoryFromJson);
  }
}
