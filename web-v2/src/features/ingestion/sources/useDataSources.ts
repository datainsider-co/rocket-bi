import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import { DataSourceService } from '@/core/ingestion/DataSourceService';
import { sourcesQueryOptions } from '../ingestionQueries';
import { useKeepPageInRange } from '../listing/useKeepPageInRange';
import { useListingState } from '../listing/useListingState';
import {
  DEFAULT_SOURCE_SORT,
  sourcesBody,
  type DataSourcesListing
} from './sources.utils';
import { useDebouncedCallback } from '../listing/useDebouncedCallback';
import { SEARCH_DEBOUNCE_MS } from '../listing/listing.utils';

/** v1 `DataSourceScreen` listing: one page of `source/list`, searched once typing pauses, sorted on the server. */
export function useDataSources() {
  const service = useDi(DataSourceService);
  const { state, request, setKeyword, setPage, sortOn } = useListingState(DEFAULT_SOURCE_SORT);
  const query = useQuery(sourcesQueryOptions(service, request));
  useKeepPageInRange({ state, setPage }, query.data?.total);
  const search = useDebouncedCallback(setKeyword, SEARCH_DEBOUNCE_MS);
  const { refetch } = query;
  const refresh = useCallback(() => void refetch(), [refetch]);

  const listing: DataSourcesListing = {
    state,
    body: sourcesBody({
      hasError: query.isError,
      total: query.data?.total,
      isPlaceholder: query.isPlaceholderData,
      keyword: state.keyword
    }),
    rows: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isFetching: query.isFetching,
    error: query.error?.message
  };

  return { listing, search, refresh, setPage, sortOn };
}
