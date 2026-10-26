import { isEqual, uniqWith } from 'lodash-es';
import type { JsonObject } from '@/core/json/json';
import { FILTERS_PARAM, toFiltersParam } from '@/core/query/filtersParam';
import type { InternalFilter } from '@/core/query/internalFilter';
import { dashboardPath } from '@/shared/routing/idParam';

/** A dashboard to drill through to. */
export interface DrillTarget {
  id: number;
  name: string;
}

/** v1 `ListingDrillThroughDashboardHandler` loaded 40 at a time. */
export const DRILL_THROUGH_PAGE_SIZE = 40;

/**
 * What the next dashboard opens with: this dashboard's header filters, then the clicked value's. v1 carried only the
 * filters kept in local storage, so a second drill through lost those of the first.
 */
export function carriedFilters(headerFilters: readonly InternalFilter[], clicked: readonly InternalFilter[]): InternalFilter[] {
  return [...headerFilters, ...clicked];
}

/** The fields the server matches dashboards on, each once. */
export function filterFields(filters: readonly InternalFilter[]): JsonObject[] {
  return uniqWith(
    filters.map(filter => filter.field),
    isEqual
  );
}

/** The target's URL, keeping the current query string (a share token) with `filters` replaced (v1 `openDashboardTab`). */
export function drillThroughUrl(target: DrillTarget, filters: readonly InternalFilter[], search: string): string {
  const params = new URLSearchParams(search);
  params.set(FILTERS_PARAM, toFiltersParam(filters));
  return `${dashboardPath(target.id, target.name)}?${params.toString()}`;
}

/** Where the next page starts, or `undefined` once every dashboard is loaded. */
export function nextDrillThroughFrom(pages: readonly { total: number; dashboards: readonly unknown[] }[]): number | undefined {
  const loaded = pages.reduce((count, page) => count + page.dashboards.length, 0);
  const last = pages.at(-1);
  return last && last.dashboards.length > 0 && loaded < last.total ? loaded : undefined;
}
