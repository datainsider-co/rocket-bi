import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDi } from '@/app/di/DiContext';
import type { ConditionData } from '@/core/chart-builder/ConditionData';
import { toQueryRequestJson } from '@/core/query/QueryRequest';
import { QueryService } from '@/core/query/QueryService';
import { useBuilder } from '../../state/BuilderContext';
import { columnValuesSetting, nextValuesFrom, sqlViewsOf, VALUES_PAGE_SIZE, valuesPageOf } from './columnValues.utils';

export interface ColumnValues {
  readonly values: readonly string[];
  readonly status: 'loading' | 'error' | 'ready';
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  readonly loadMore: () => void;
  readonly retry: () => void;
}

/** The condition's column values from the server, page by page (v1 `SelectionFilter.handleLoadChartData`). */
export function useColumnValues(condition: ConditionData, enabled: boolean): ColumnValues {
  const service = useDi(QueryService);
  const { sqlQueryOf, dashboardId } = useBuilder();
  const setting = useMemo(
    () => columnValuesSetting(condition.field, condition.isNested, sqlViewsOf(condition.field, sqlQueryOf)),
    [condition.field, condition.isNested, sqlQueryOf]
  );
  const query = useInfiniteQuery({
    queryKey: ['chart-builder', 'column-values', dashboardId, setting],
    queryFn: async ({ pageParam, signal }) =>
      valuesPageOf(await service.query(toQueryRequestJson({ setting, paging: { from: pageParam, size: VALUES_PAGE_SIZE }, dashboardId }), signal)),
    initialPageParam: 0,
    getNextPageParam: (_last, pages) => nextValuesFrom(pages),
    enabled
  });
  const values = useMemo(() => query.data?.pages.flatMap(page => page.values) ?? [], [query.data]);
  return {
    values,
    status: query.isError ? 'error' : query.isPending ? 'loading' : 'ready',
    hasMore: query.hasNextPage,
    loadingMore: query.isFetchingNextPage,
    loadMore: () => void query.fetchNextPage(),
    retry: () => void query.refetch()
  };
}
