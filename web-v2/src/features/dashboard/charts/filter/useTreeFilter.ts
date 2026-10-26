import { useCallback, useMemo, useState } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { ValueControlType } from '@/core/query/controlValues';
import { toQueryRequestJson } from '@/core/query/QueryRequest';
import { QueryService } from '@/core/query/QueryService';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import { chartDataKeys } from '../../chart-data/useWidgetData';
import type { ChartQuery } from '../../controls/chartQuery.utils';
import type { ControlEntry } from '../../controls/controls.utils';
import {
  buildTreeNodes,
  initialExpandedKeys,
  keysToLoad,
  treeChildrenSetting,
  treeDepth,
  treePath,
  treeRootKey,
  treeSelectedValues
} from './treeFilter.utils';

export interface TreeFilterInput {
  widget: ChartWidget;
  dashboardId: number;
  query: ChartQuery;
  /** The first level, from the widget's own query. */
  response: VisualizationResponse;
  entry: ControlEntry | undefined;
  onChange: (entry: ControlEntry) => void;
}

function firstColumn(response: VisualizationResponse | undefined): string[] {
  return response?.kind === 'table' ? response.records.map(row => String(row[0] ?? '')) : [];
}

/** Module level so TanStack Query keeps the combined result stable while the queries don't change. */
function combineLevels(results: UseQueryResult<VisualizationResponse>[]) {
  return { rows: results.map(result => firstColumn(result.data)), loading: results.some(result => result.isFetching) };
}

/**
 * Tree filter state (v1 `TreeFilter`): which nodes are open, their children queried level by level as they open, and
 * the checked keys turned into the control's values.
 */
export function useTreeFilter({ widget, dashboardId, query, response, entry, onChange }: TreeFilterInput) {
  const service = useDi(QueryService);
  const { setting, filterRequests, parameters } = query;
  const rootKey = treeRootKey(setting);
  const levels = treeDepth(setting);
  const [expandedKeys, setExpandedKeys] = useState(() => initialExpandedKeys(widget.setting));

  const toLoad = useMemo(() => keysToLoad(expandedKeys, rootKey, levels), [expandedKeys, rootKey, levels]);
  const { rows, loading } = useQueries({
    queries: toLoad.map(key => {
      const request = toQueryRequestJson({
        setting: treeChildrenSetting(setting, treePath(key)) ?? setting,
        filterRequests,
        parameters,
        dashboardId,
        chartId: widget.id
      });
      return {
        queryKey: chartDataKeys.request(dashboardId, widget.id, request),
        queryFn: ({ signal }: { signal: AbortSignal }) => service.query(request, signal)
      };
    }),
    combine: combineLevels
  });

  const nodes = useMemo(() => {
    const children = new Map<string, string[]>([[rootKey, firstColumn(response)]]);
    toLoad.forEach((key, index) => children.set(key, rows[index] ?? []));
    return buildTreeNodes(rootKey, children, levels);
  }, [rootKey, response, toLoad, rows, levels]);

  const onCheck = useCallback(
    (keys: string[]) => {
      const values = treeSelectedValues(keys, rootKey);
      onChange(values.length > 0 ? { keys, [ValueControlType.SelectedValue]: values } : { keys });
    },
    [rootKey, onChange]
  );

  return {
    nodes,
    checkedKeys: entry?.keys ?? [],
    expandedKeys,
    loading,
    onCheck,
    onExpand: setExpandedKeys
  };
}
