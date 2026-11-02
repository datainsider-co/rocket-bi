import { useCallback, useMemo, useState } from 'react';
import type { ListingRequest, Sort } from '@/core/listing/Listing';
import {
  initialListingState,
  toListingRequest,
  withKeyword,
  withPage,
  withSortOn,
  type ListingState
} from './listing.utils';

export interface ListingControls<Field extends string> {
  readonly state: ListingState<Field>;
  /** What to send to the service; stable while the state is. */
  readonly request: ListingRequest<Field>;
  readonly setKeyword: (keyword: string) => void;
  readonly setPage: (page: number, pageSize: number) => void;
  readonly sortOn: (field: Field) => void;
}

/** Paging, search and sort of one listing page. `defaultSort` is read once. */
export function useListingState<Field extends string>(defaultSort: Sort<Field>): ListingControls<Field> {
  const [state, setState] = useState(() => initialListingState(defaultSort));
  const request = useMemo(() => toListingRequest(state), [state]);
  const setKeyword = useCallback((keyword: string) => setState(current => withKeyword(current, keyword)), []);
  const setPage = useCallback(
    (page: number, pageSize: number) => setState(current => withPage(current, page, pageSize)),
    []
  );
  const sortOn = useCallback((field: Field) => setState(current => withSortOn(current, field)), []);
  return { state, request, setKeyword, setPage, sortOn };
}
