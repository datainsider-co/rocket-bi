import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { JobStatus } from '@/core/ingestion/Job';
import { JobService, type JobSortField } from '@/core/ingestion/JobService';
import type { ListingRequest } from '@/core/listing/Listing';
import { jobsQueryOptions } from '../ingestionQueries';

/**
 * A page of jobs, polled every `refetchInterval` ms (`false`: only on demand). Polling pauses while the browser tab is
 * hidden (TanStack's default), unlike v1's `setInterval`.
 */
export function useJobsQuery(
  request: ListingRequest<JobSortField>,
  statuses: readonly JobStatus[] | undefined,
  refetchInterval: number | false
) {
  const service = useDi(JobService);
  return useQuery({ ...jobsQueryOptions(service, request, statuses), refetchInterval });
}
