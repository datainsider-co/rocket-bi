import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { DataSourceService, SourceSortField } from '@/core/ingestion/DataSourceService';
import type { JobStatus } from '@/core/ingestion/Job';
import type { JobHistoryService, JobHistorySortField } from '@/core/ingestion/JobHistoryService';
import type { JobService, JobSortField } from '@/core/ingestion/JobService';
import type { ListingRequest } from '@/core/listing/Listing';

/**
 * Query keys of Data Ingestion. A change to a source can change the jobs listing (it shows the source) and a sync adds
 * history, so mutations invalidate `ingestionKeys.all`.
 */
export const ingestionKeys = {
  all: ['ingestion'] as const,
  sources: (request: ListingRequest<SourceSortField>) => ['ingestion', 'sources', request] as const,
  jobs: (request: ListingRequest<JobSortField>, statuses: readonly JobStatus[] | undefined) =>
    ['ingestion', 'jobs', request, statuses ?? null] as const,
  history: (request: ListingRequest<JobHistorySortField>) => ['ingestion', 'history', request] as const
};

/** Listings keep the previous page on screen while the next one loads. */
export function sourcesQueryOptions(service: DataSourceService, request: ListingRequest<SourceSortField>) {
  return queryOptions({
    queryKey: ingestionKeys.sources(request),
    queryFn: ({ signal }) => service.list(request, signal),
    placeholderData: keepPreviousData
  });
}

export function jobsQueryOptions(
  service: JobService,
  request: ListingRequest<JobSortField>,
  statuses?: readonly JobStatus[]
) {
  return queryOptions({
    queryKey: ingestionKeys.jobs(request, statuses),
    queryFn: ({ signal }) => service.list(request, statuses, signal),
    placeholderData: keepPreviousData
  });
}

export function historyQueryOptions(service: JobHistoryService, request: ListingRequest<JobHistorySortField>) {
  return queryOptions({
    queryKey: ingestionKeys.history(request),
    queryFn: ({ signal }) => service.list(request, signal),
    placeholderData: keepPreviousData
  });
}
