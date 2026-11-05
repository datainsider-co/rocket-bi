import { keepPreviousData, queryOptions, type QueryClient } from '@tanstack/react-query';
import type { EtlHistoryService, EtlHistorySortField } from '@/core/data-cook/EtlHistoryService';
import type { EtlId } from '@/core/data-cook/EtlJob';
import type { EtlPreviewService } from '@/core/data-cook/EtlPreviewService';
import type { EtlListing, EtlService, EtlSortField } from '@/core/data-cook/EtlService';
import type { ListingRequest } from '@/core/listing/Listing';

/** Query keys of Data Cook. A run, a delete or a restore changes the listings and the history, so mutations invalidate `all`. */
export const dataCookKeys = {
  all: ['data-cook'] as const,
  etls: (listing: EtlListing, request: ListingRequest<EtlSortField>) => ['data-cook', 'etls', listing, request] as const,
  history: (request: ListingRequest<EtlHistorySortField>) => ['data-cook', 'history', request] as const,
  etl: (id: EtlId) => ['data-cook', 'etl', id] as const,
  /** The editor's previews of an ETL's tables, each under its branch's signature (`editor/preview`). */
  database: (id: EtlId) => ['data-cook', 'database', id] as const,
  fieldsSample: (id: EtlId, request: unknown) => ['data-cook', 'fields-sample', id, request] as const,
  previews: (id: EtlId) => ['data-cook', 'preview', id] as const,
  previewsOf: (id: EtlId, tblName: string) => ['data-cook', 'preview', id, tblName] as const,
  preview: (id: EtlId, tblName: string, signature: string) => ['data-cook', 'preview', id, tblName, signature] as const
};

/** What the editor reads of the tables it builds: a save or a run changes none of it. */
const EDITOR_KEYS: ReadonlySet<unknown> = new Set(['preview', 'database', 'fields-sample']);

/**
 * Marks the listings, the history and the ETLs stale after a save, a create or a run. Not the editor's previews: they
 * follow the draft, and building them again is a forced `preview_sync`.
 */
export function etlsChanged(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: dataCookKeys.all, predicate: query => !EDITOR_KEYS.has(query.queryKey[1]) });
}

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

/** `preview_etl_<id>`, where the editor's tables are built; it never changes. */
export function etlDatabaseQueryOptions(service: EtlPreviewService, id: EtlId) {
  return queryOptions({
    queryKey: dataCookKeys.database(id),
    queryFn: ({ signal }) => service.databaseName(id, signal),
    staleTime: Number.POSITIVE_INFINITY
  });
}
