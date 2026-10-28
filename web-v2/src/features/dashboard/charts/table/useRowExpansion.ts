import { useCallback, useMemo, useState } from 'react';
import type { JsonObject } from '@/core/json/json';
import { toggledRows, type ExpandedRows } from './collapseTable.utils';
import type { TableRow } from './table.utils';

const NONE: ExpandedRows = new Map();

interface Expansion {
  readonly records: readonly JsonObject[];
  readonly open: ExpandedRows;
}

/**
 * A collapse or pivot table's expanded rows, with each one's path (a pivot table queries the rows under it by it). New
 * records (another page, a refresh, a new sort) start collapsed again, as v1 rebuilt its rows on new data.
 */
export function useRowExpansion(records: readonly JsonObject[]) {
  const [expansion, setExpansion] = useState<Expansion>({ records, open: NONE });
  const open = expansion.records === records ? expansion.open : NONE;
  const expandedKeys = useMemo(() => [...open.keys()], [open]);
  const onToggle = useCallback(
    (row: TableRow) => setExpansion(current => ({ records, open: toggledRows(current.records === records ? current.open : NONE, row) })),
    [records]
  );
  return { expanded: open, expandedKeys, onToggle };
}
