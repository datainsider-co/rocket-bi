import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { useDi } from '@/app/di/DiContext';
import { DashboardService } from '@/core/dashboard/DashboardService';
import type { JsonObject } from '@/core/json/json';
import { canDrillThrough, drillThroughFilters } from '@/core/query/drillThrough';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import type { DrillThroughChoices } from './chartMenus.utils';
import { carriedFilters, DRILL_THROUGH_PAGE_SIZE, drillThroughUrl, filterFields, nextDrillThroughFrom, type DrillTarget } from './drillThrough.utils';

const openInNewTab = (url: string) => void window.open(url, '_blank');

/**
 * Drill through from a clicked value (v1 `WidgetContextMenu.handleClickDrillThrough`): the dashboards that have a
 * filter on one of the carried fields, loaded once the point menu opens, and opening one in a new tab.
 */
export function useDrillThrough(setting: JsonObject, value: string | undefined, dashboardId: number, open: (url: string) => void = openInNewTab) {
  const service = useDi(DashboardService);
  const { headerFilters } = useDashboardControls();
  const { search } = useLocation();
  const enabled = value !== undefined && canDrillThrough(setting);

  const filters = useMemo(
    () => (enabled ? carriedFilters(headerFilters, drillThroughFilters(setting, value)) : []),
    [enabled, headerFilters, setting, value]
  );
  const fields = useMemo(() => filterFields(filters), [filters]);
  const query = useInfiniteQuery({
    queryKey: ['dashboard', 'drill-through', dashboardId, fields],
    queryFn: ({ pageParam, signal }) =>
      service.listDrillThrough({ fields, excludeIds: [dashboardId], from: pageParam, size: DRILL_THROUGH_PAGE_SIZE }, signal),
    initialPageParam: 0,
    getNextPageParam: (_last, pages) => nextDrillThroughFrom(pages),
    enabled: enabled && fields.length > 0
  });

  const dashboards = useMemo(() => query.data?.pages.flatMap(page => page.dashboards) ?? [], [query.data]);
  const choices: DrillThroughChoices | undefined = enabled
    ? { dashboards, loading: query.isLoading || query.isFetchingNextPage, hasMore: query.hasNextPage }
    : undefined;

  return {
    choices,
    loadMore: () => void query.fetchNextPage(),
    drillThrough: (target: DrillTarget) => open(drillThroughUrl(target, filters, search))
  };
}
