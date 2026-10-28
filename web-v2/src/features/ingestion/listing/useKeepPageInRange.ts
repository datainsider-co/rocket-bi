import { useEffect } from 'react';
import type { ListingControls } from './useListingState';
import { lastPage } from './listing.utils';

/**
 * Moves back to the last page when the server's `total` no longer reaches the current one, so the listing doesn't show
 * an empty page. `total` is `undefined` while nothing has loaded.
 */
export function useKeepPageInRange<Field extends string>(
  { state, setPage }: Pick<ListingControls<Field>, 'state' | 'setPage'>,
  total: number | undefined
): void {
  useEffect(() => {
    if (total === undefined) return;
    const last = lastPage(total, state.pageSize);
    if (state.page > last) setPage(last, state.pageSize);
  }, [total, state.page, state.pageSize, setPage]);
}
