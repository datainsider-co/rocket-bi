import { useCallback, useMemo } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import type { JsonObject } from '@/core/json/json';
import { pivotColumnsOf } from '@/core/query/pivotQuery';
import type { JsonTableResponse, VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { SubRowQuery } from '../../chart-data/useSubRowQuery';
import { toTreeRows } from './collapseTable.utils';
import type { RowCollapse } from './FlattenTableView';
import { toLazyPivotRows } from './pivotTable.utils';
import { useRowExpansion } from './useRowExpansion';

interface LoadedRows {
  /** The rows loaded under each expanded row, by its key. */
  loaded: ReadonlyMap<string, readonly JsonObject[]>;
  loading: boolean;
}

/**
 * A pivot table's rows and their expansion (v1 `PivotTable.handleToggleCollapse`). Without columns across, the server
 * nested the row groups already; with them, an expanded row loads the rows under it through `subRows`, once, from the
 * cache afterwards.
 */
export function usePivotRows(response: JsonTableResponse, setting: JsonObject, from: number, subRows?: SubRowQuery): { collapse: RowCollapse; loading: boolean } {
  const { records, headers } = response;
  const { expanded, expandedKeys, onToggle } = useRowExpansion(records);
  const groupKey = headers.find(header => header.isGroupBy)?.key;
  const lazy = subRows !== undefined && groupKey !== undefined;
  const pending = useMemo(
    () =>
      lazy
        ? [...expanded].flatMap(([key, path]) => {
            const query = subRows(path);
            return query ? [{ key, query }] : [];
          })
        : [],
    [lazy, expanded, subRows]
  );
  const combine = useCallback(
    (results: UseQueryResult<VisualizationResponse>[]): LoadedRows => ({
      loaded: new Map(
        results.flatMap((result, index) => {
          const key = pending[index]?.key;
          return key !== undefined && result.data?.kind === 'json_table' ? [[key, result.data.records] as const] : [];
        })
      ),
      loading: results.some(result => result.isFetching)
    }),
    [pending]
  );
  const { loaded, loading } = useQueries({ queries: pending.map(({ query }) => query), combine });
  const levels = pivotColumnsOf(setting, 'rows').length;
  const rows = useMemo(
    () => (lazy && groupKey !== undefined ? toLazyPivotRows({ records, from, groupKey, levels, childrenOf: key => loaded.get(key) }) : toTreeRows(records, from)),
    [lazy, groupKey, records, from, levels, loaded]
  );
  const collapse = useMemo(() => ({ rows, expandedKeys, onToggle }), [rows, expandedKeys, onToggle]);
  return { collapse, loading };
}
