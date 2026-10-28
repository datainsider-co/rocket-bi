import { useCallback, useState } from 'react';
import { SEARCH_DEBOUNCE_MS } from './listing.utils';
import { useDebouncedCallback } from './useDebouncedCallback';

export interface DebouncedSearch {
  /** What is in the search box now. */
  readonly text: string;
  readonly onChange: (text: string) => void;
}

/** A controlled search box that calls `onSearch` once typing pauses (v1 `SearchInput` `timeBound`). */
export function useDebouncedSearch(onSearch: (keyword: string) => void, delayMs = SEARCH_DEBOUNCE_MS): DebouncedSearch {
  const [text, setText] = useState('');
  const search = useDebouncedCallback(onSearch, delayMs);
  const onChange = useCallback(
    (next: string) => {
      setText(next);
      search(next);
    },
    [search]
  );
  return { text, onChange };
}
