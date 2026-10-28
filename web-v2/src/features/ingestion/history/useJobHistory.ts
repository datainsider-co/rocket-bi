import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { JobHistory } from '@/core/ingestion/JobHistory';
import { JobHistoryService, type JobHistorySortField } from '@/core/ingestion/JobHistoryService';
import type { Sort } from '@/core/listing/Listing';
import { historyQueryOptions } from '../ingestionQueries';
import { useKeepPageInRange } from '../listing/useKeepPageInRange';
import { useListingState } from '../listing/useListingState';
import { DEFAULT_HISTORY_SORT, historyContent, type HistoryContent } from './jobHistory.utils';
import { useDebouncedSearch, type DebouncedSearch } from '../listing/useDebouncedSearch';

/** What `JobHistoryTable` needs: one page of runs and the controls that change it. */
export interface JobHistoryTableState {
  readonly rows: readonly JobHistory[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: Sort<JobHistorySortField>;
  readonly isLoading: boolean;
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly onSortOn: (field: JobHistorySortField) => void;
}

export interface JobHistoryState {
  readonly search: DebouncedSearch;
  readonly content: HistoryContent;
  readonly table: JobHistoryTableState;
  readonly isFetching: boolean;
  /** Reloads the current page (Refresh, and Retry after an error). */
  readonly reload: () => void;
}

/** Job History (v1 `JobHistoryScreen`): server-paged runs, searched once typing pauses, sorted by header click. */
export function useJobHistory(): JobHistoryState {
  const service = useDi(JobHistoryService);
  const { state, request, setKeyword, setPage, sortOn } = useListingState(DEFAULT_HISTORY_SORT);
  const search = useDebouncedSearch(setKeyword);
  const query = useQuery(historyQueryOptions(service, request));
  useKeepPageInRange({ state, setPage }, query.data?.total);
  const rows = query.data?.data ?? [];

  return {
    search,
    content: historyContent({
      error: query.error,
      rowCount: rows.length,
      isLoaded: query.data !== undefined,
      keyword: state.keyword
    }),
    table: {
      rows,
      total: query.data?.total ?? 0,
      page: state.page,
      pageSize: state.pageSize,
      sort: state.sort,
      isLoading: query.isFetching,
      onPageChange: setPage,
      onSortOn: sortOn
    },
    isFetching: query.isFetching,
    reload: () => void query.refetch()
  };
}
