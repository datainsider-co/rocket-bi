import { useCallback, useState } from 'react';
import type { JobInfo } from '@/core/ingestion/Job';
import type { JobSortField } from '@/core/ingestion/JobService';
import type { Sort } from '@/core/listing/Listing';
import type { IngestionSection } from '../ingestion.utils';
import { useKeepPageInRange } from '../listing/useKeepPageInRange';
import { useListingState } from '../listing/useListingState';
import { DEFAULT_JOB_SORT, jobListingStatuses } from './jobs.utils';
import { DEFAULT_REFRESH_OPTION, refreshOptionOf, toRefetchInterval, type RefreshOption } from './refresh.utils';
import { useDebouncedSearch, type DebouncedSearch } from '../listing/useDebouncedSearch';
import { useJobsQuery } from './useJobsQuery';

export interface JobsRefresh {
  readonly option: RefreshOption;
  /** A load is in flight, from a click or the timer. */
  readonly isRefreshing: boolean;
  readonly onRefresh: () => void;
  readonly onSelectOption: (key: string) => void;
}

export interface JobsTableData {
  readonly jobs: readonly JobInfo[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: Sort<JobSortField>;
  readonly keyword: string;
  /** First load, or another page / sort / keyword loading over the previous rows. */
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

export interface JobsTableHandlers {
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly onSort: (field: JobSortField) => void;
  readonly onRetry: () => void;
}

export interface JobsListing {
  readonly search: DebouncedSearch;
  readonly refresh: JobsRefresh;
  readonly table: JobsTableData;
  readonly handlers: JobsTableHandlers;
}

/** v1 `JobScreen` listing: one page of jobs (queued ones only on Queued Jobs), searched, sorted and auto refreshed. */
export function useJobsListing(section: IngestionSection): JobsListing {
  const { state, request, setKeyword, setPage, sortOn } = useListingState(DEFAULT_JOB_SORT);
  const search = useDebouncedSearch(setKeyword);
  const [option, setOption] = useState(DEFAULT_REFRESH_OPTION);
  const query = useJobsQuery(request, jobListingStatuses(section), toRefetchInterval(option));
  useKeepPageInRange({ state, setPage }, query.data?.total);
  const { refetch } = query;

  const onRefresh = useCallback(() => void refetch(), [refetch]);
  /** v1 reloaded at once when an option was picked, then on its timer. */
  const onSelectOption = useCallback(
    (key: string) => {
      setOption(current => refreshOptionOf(key, current));
      void refetch();
    },
    [refetch]
  );

  return {
    search,
    refresh: { option, isRefreshing: query.isFetching, onRefresh, onSelectOption },
    table: {
      jobs: query.data?.data ?? [],
      total: query.data?.total ?? 0,
      page: state.page,
      pageSize: state.pageSize,
      sort: state.sort,
      keyword: state.keyword,
      isLoading: query.isPending || query.isPlaceholderData,
      error: query.isError ? query.error.message : undefined
    },
    handlers: { onPageChange: setPage, onSort: sortOn, onRetry: onRefresh }
  };
}
