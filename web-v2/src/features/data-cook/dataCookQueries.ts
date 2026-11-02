import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { EtlHistoryService, EtlHistorySortField } from '@/core/data-cook/EtlHistoryService';
import type { EtlId } from '@/core/data-cook/EtlJob';
import type { EtlListing, EtlService, EtlSortField } from '@/core/data-cook/EtlService';
import type { ListingRequest } from '@/core/listing/Listing';

/** Query keys of Data Cook. A run, a delete or a restore changes the listings and the history, so mutations invalidate `all`. */
export const dataCookKeys = {
  all: ['data-cook'] as const,
  etls: (listing: EtlListing, request: ListingRequest<EtlSortField>) => ['data-cook', 'etls', listing, request] as const,
  history: (request: ListingRequest<EtlHistorySortField>) => ['data-cook', 'history', request] as const,
  etl: (id: EtlId) => ['data-cook', 'etl', id] as const
};

/** Listings keep the previous page on screen while the next one loads. */
export function etlsQueryOptions(service: EtlService, listing: EtlListing, request: ListingRequest<EtlSortField>) {
  return queryOptions({
    queryKey: dataCookKeys.etls(listing, request),
    queryFn: ({ signal }) => service.list(listing, request, signal),
    placeholderData: keepPreviousData
  });
}

export function etlHistoryQueryOptions(service: EtlHistoryService, request: ListingRequest<EtlHistorySortField>) {
  return queryOptions({
    queryKey: dataCookKeys.history(request),
    queryFn: ({ signal }) => service.list(request, signal),
    placeholderData: keepPreviousData
  });
}

/** An ETL with its operators, for the editor. Read once when the editor opens; the editor keeps its own copy. */
export function etlQueryOptions(service: EtlService, id: EtlId) {
  return queryOptions({
    queryKey: dataCookKeys.etl(id),
    queryFn: ({ signal }) => service.get(id, signal),
    staleTime: 0
  });
}
