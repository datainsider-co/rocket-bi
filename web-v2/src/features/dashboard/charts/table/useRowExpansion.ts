import { useCallback, useState } from 'react';
import type { JsonObject } from '@/core/json/json';
import { toggledKeys } from './collapseTable.utils';

const NONE: readonly string[] = [];

interface Expansion {
  readonly records: readonly JsonObject[];
  readonly keys: readonly string[];
}

/**
 * The collapse table's expanded rows. New records (another page, a refresh, a new sort) start collapsed again, as v1
 * rebuilt its rows on new data.
 */
export function useRowExpansion(records: readonly JsonObject[]) {
  const [expansion, setExpansion] = useState<Expansion>({ records, keys: NONE });
  const expandedKeys = expansion.records === records ? expansion.keys : NONE;
  const onToggle = useCallback(
    (key: string) => setExpansion(current => ({ records, keys: toggledKeys(current.records === records ? current.keys : NONE, key) })),
    [records]
  );
  return { expandedKeys, onToggle };
}
