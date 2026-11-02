import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { EtlJob } from '@/core/data-cook/EtlJob';
import { EtlService, type EtlListing, type EtlSortField } from '@/core/data-cook/EtlService';
import type { Sort } from '@/core/listing/Listing';
import { useDebouncedSearch, type DebouncedSearch } from '@/shared/listing/useDebouncedSearch';
import { useKeepPageInRange } from '@/shared/listing/useKeepPageInRange';
import { useListingState } from '@/shared/listing/useListingState';
import { etlsQueryOptions } from '../dataCookQueries';
import { DEFAULT_ETL_SORT, etlRefetchInterval } from './etlListing.utils';

export interface EtlTableData {
  readonly listing: EtlListing;
  readonly etls: readonly EtlJob[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly sort: Sort<EtlSortField>;
  readonly keyword: string;
  /** First load, or another page / sort / keyword loading over the previous rows. */
  readonly isLoading: boolean;
  readonly error: string | undefined;
}

export interface EtlTableHandlers {
  readonly onPageChange: (page: number, pageSize: number) => void;
  readonly onSort: (field: EtlSortField) => void;
  readonly onRefresh: () => void;
}

export interface EtlListingState {
  readonly search: DebouncedSearch;
  /** A load is in flight, from Refresh or polling. */
  readonly isFetching: boolean;
  readonly table: EtlTableData;
  readonly handlers: EtlTableHandlers;
}

/**
 * One page of an ETL listing (v1 `ListEtlJob`), searched by name, sorted on the server. It reloads every few seconds
 * while one of its ETLs runs (v1 only reloaded on Refresh). `now` is read when TanStack schedules the next poll.
 */
export function useEtlListing(listing: EtlListing, now: () => number = Date.now): EtlListingState {
  const service = useDi(EtlService);
  const { state, request, setKeyword, setPage, sortOn } = useListingState(DEFAULT_ETL_SORT);
  const search = useDebouncedSearch(setKeyword);
  const query = useQuery({
    ...etlsQueryOptions(service, listing, request),
    refetchInterval: ({ state: { data } }) => etlRefetchInterval(data?.data, now())
  });
  useKeepPageInRange({ state, setPage }, query.data?.total);
  const { refetch } = query;
  const onRefresh = useCallback(() => void refetch(), [refetch]);

  return {
    search,
    isFetching: query.isFetching,
    table: {
      listing,
      etls: query.data?.data ?? [],
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
