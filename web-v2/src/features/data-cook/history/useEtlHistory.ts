import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { EtlHistory } from '@/core/data-cook/EtlHistory';
import { EtlHistoryService, type EtlHistorySortField } from '@/core/data-cook/EtlHistoryService';
import type { Sort } from '@/core/listing/Listing';
import { useDebouncedSearch, type DebouncedSearch } from '@/shared/listing/useDebouncedSearch';
import { useKeepPageInRange } from '@/shared/listing/useKeepPageInRange';
import { useListingState } from '@/shared/listing/useListingState';
import { etlHistoryQueryOptions } from '../dataCookQueries';
import { DEFAULT_ETL_HISTORY_SORT } from './etlHistory.utils';

export interface EtlHistoryTableData {
  readonly runs: readonly EtlHistory[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: Sort<EtlHistorySortField>;
  readonly keyword: string;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

export interface EtlHistoryHandlers {
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly onSort: (field: EtlHistorySortField) => void;
  /** Refresh in the header, and Retry after an error. */
  readonly onRefresh: () => void;
}

export interface EtlHistoryState {
  readonly search: DebouncedSearch;
  readonly isFetching: boolean;
  readonly table: EtlHistoryTableData;
  readonly handlers: EtlHistoryHandlers;
}

/** ETL History (v1 `EtlHistory`): server-paged runs of every ETL the user sees, searched by ETL name. */
export function useEtlHistory(): EtlHistoryState {
  const service = useDi(EtlHistoryService);
  const { state, request, setKeyword, setPage, sortOn } = useListingState(DEFAULT_ETL_HISTORY_SORT);
  const search = useDebouncedSearch(setKeyword);
  const query = useQuery(etlHistoryQueryOptions(service, request));
  useKeepPageInRange({ state, setPage }, query.data?.total);
  const { refetch } = query;
  const onRefresh = useCallback(() => void refetch(), [refetch]);

  return {
    search,
    isFetching: query.isFetching,
    table: {
      runs: query.data?.data ?? [],
      total: query.data?.total ?? 0,
      page: state.page,
      pageSize: state.pageSize,
      sort: state.sort,
      keyword: state.keyword,
      isLoading: query.isPending || query.isPlaceholderData,
      error: query.isError ? query.error.message : undefined
    },
    handlers: { onPageChange: setPage, onSort: sortOn, onRefresh }
  };
}
