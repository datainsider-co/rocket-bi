import dayjs from 'dayjs';
import { SortOrder, type ListingRequest, type Sort } from '@/core/listing/Listing';

/** v1 `SearchInput` `timeBound` of the ingestion listings. */
export const SEARCH_DEBOUNCE_MS = 400;

/** v1 `DefaultPaging.DefaultPageSize`. */
export const DEFAULT_PAGE_SIZE = 20;

/** v1 `ListingFooter` page sizes. */
export const PAGE_SIZE_OPTIONS: readonly number[] = [20, 30, 50, 100, 200];

/** antd `Table` `pagination` shared by the ingestion listings: total, page size picker, always shown. */
export interface ListingPagination {
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
  readonly showSizeChanger: true;
  readonly pageSizeOptions: number[];
  readonly showTotal: (total: number) => string;
}

export function listingPagination(page: number, pageSize: number, total: number): ListingPagination {
  return {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    pageSizeOptions: [...PAGE_SIZE_OPTIONS],
    showTotal: count => `Total: ${count}`
  };
}

/**
 * Paging, search and sort of a server-paged listing. `page` starts at 1, like antd's `Pagination`. Changing the
 * keyword, the sort or the page size goes back to page 1, as v1 did.
 */
export interface ListingState<Field extends string> {
  readonly page: number;
  readonly pageSize: number;
  readonly keyword: string;
  readonly sort: Sort<Field>;
}

export function initialListingState<Field extends string>(sort: Sort<Field>): ListingState<Field> {
  return { page: 1, pageSize: DEFAULT_PAGE_SIZE, keyword: '', sort };
}

export function toListingRequest<Field extends string>({
  page,
  pageSize,
  keyword,
  sort
}: ListingState<Field>): ListingRequest<Field> {
  return { from: (page - 1) * pageSize, size: pageSize, keyword: keyword.trim() || undefined, sorts: [sort] };
}

export function withKeyword<Field extends string>(state: ListingState<Field>, keyword: string): ListingState<Field> {
  return keyword === state.keyword ? state : { ...state, keyword, page: 1 };
}

export function withPage<Field extends string>(
  state: ListingState<Field>,
  page: number,
  pageSize: number
): ListingState<Field> {
  return pageSize === state.pageSize ? { ...state, page } : { ...state, page: 1, pageSize };
}

/**
 * The last page that has rows for `total` (at least 1). A page past it shows nothing, which happens when rows go away
 * while the user is on the last page (jobs leaving the Queued listing, a delete).
 */
export function lastPage(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** v1's header click: the same column flips its order, another column starts ascending. */
export function withSortOn<Field extends string>(state: ListingState<Field>, field: Field): ListingState<Field> {
  const order = state.sort.field === field && state.sort.order === SortOrder.Asc ? SortOrder.Desc : SortOrder.Asc;
  return { ...state, sort: { field, order }, page: 1 };
}

/** antd `Table` column `sortOrder` for `field`: only the sorted column shows an arrow. */
export function columnSortOrder<Field extends string>(
  sort: Sort<Field>,
  field: Field
): 'ascend' | 'descend' | null {
  if (sort.field !== field) return null;
  return sort.order === SortOrder.Asc ? 'ascend' : 'descend';
}

/** v1 `DateTimeUtils.formatAsMMMDDYYYHHmmss` (`Oct 29, 2026 07:30:00`), in the browser's time zone; `--` for 0. */
export function formatDateTime(epochMillis: number): string {
  return epochMillis > 0 ? dayjs(epochMillis).format('MMM DD, YYYY HH:mm:ss') : '--';
}
