import { useCallback, useState } from 'react';
import { selectedOnPage } from './listing.utils';

/** Checked rows of a listing page, by id. Only the ids still on the page count (`selectedOnPage`). */
export function useRowSelection<Id>(pageIds: readonly Id[]) {
  const [selected, setSelected] = useState<readonly Id[]>([]);
  const clear = useCallback(() => setSelected([]), []);
  return { selectedIds: selectedOnPage(selected, pageIds), setSelected, clear };
}
