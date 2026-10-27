import { useCallback, useMemo, useState } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { DEFAULT_PAGE_SIZE, isPagedSetting, type FilterRequestJson, type Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import { vizFromSetting } from '@/core/query/vizOptions';
import { zoomLevelOf, canZoom } from '@/core/query/zoom';
import { useKpiTrend } from '../../chart-data/useKpiTrend';
import { useWidgetData } from '../../chart-data/useWidgetData';
import { isFilterViz } from '../../charts/filter/FilterRenderer';
import { selectionOf, selectionToControl } from '../../charts/filter/filter.utils';
import { buildChartQuery, isAffectedByFilter } from '../../controls/chartQuery.utils';
import type { ControlEntry } from '../../controls/controls.utils';
import { useDashboardPermissions } from '../../access/DashboardPermissionsContext';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import { canExportSetting, LOAD_MORE_DASHBOARDS_KEY, pointMenuItems, widgetMenuItems } from './chartMenus.utils';
import { useChartExport } from './useChartExport';
import { useChartView } from './useChartView';
import { useDrillFields } from './useDrillFields';
import { useDrillThrough } from './useDrillThrough';

const FIRST_PAGE: Paging = { from: 0, size: DEFAULT_PAGE_SIZE };
const KEEP_OPEN_KEYS = [LOAD_MORE_DASHBOARDS_KEY];
const NO_REQUESTS: readonly FilterRequestJson[] = [];

/** A clicked point waiting for the viewer to pick an action. */
export interface PointMenu {
  value: string;
  position: { x: number; y: number };
}

/**
 * One chart widget (v1 `ChartHolder` + its menus): its query with the dashboard's controls, the header's filters and
 * the viewer's drill down, date function, sort and filter toggle; its page; its own selection as a control for
 * others; its point and widget menus.
 */
export function useChartWidget(widget: ChartWidget, dashboardId: number) {
  const { controls, widgets, entryOf, setControl, headerFilters, headerRequests } = useDashboardControls();
  const [paging, setPaging] = useState<Paging>(FIRST_PAGE);
  const [pointMenu, setPointMenu] = useState<PointMenu | null>(null);
  const view = useChartView(widget);
  const { canDownload } = useDashboardPermissions();

  const filtersOn = view.view.filtersOn ?? isAffectedByFilter(widget.setting);
  const appliedRequests = filtersOn ? headerRequests : NO_REQUESTS;
  const viz = useMemo(() => vizFromSetting(widget.setting), [widget.setting]);
  const query = useMemo(() => buildChartQuery(view.viewed, controls, widgets, appliedRequests), [view.viewed, controls, widgets, appliedRequests]);
  const data = useWidgetData(view.viewed, { dashboardId, query, paging: isPagedSetting(widget.setting) ? paging : undefined });
  const trend = useKpiTrend(view.viewed, query, dashboardId);
  const download = useChartExport(widget, dashboardId, query);
  const drillChoices = useDrillFields(view.viewed.setting, view.drillColumn, pointMenu !== null);
  const drillThrough = useDrillThrough(view.viewed.setting, pointMenu?.value, dashboardId);
  const activeFilters = useMemo(
    () => headerFilters.filter(filter => headerRequests.some(request => request.filter_id === filter.id)),
    [headerFilters, headerRequests]
  );

  const entry = entryOf(widget.id);
  const selected = useMemo(() => selectionOf(entry), [entry]);
  const setEntry = useCallback((values: ControlEntry) => setControl(widget.id, values), [setControl, widget.id]);
  const onSelect = useCallback((values: string[]) => setEntry(selectionToControl(values)), [setEntry]);
  const onPointMenu = useCallback((value: string, position: PointMenu['position']) => setPointMenu({ value, position }), []);
  const onSortChange = useCallback(
    (sort: TableSort | undefined) => {
      view.sort(sort);
      setPaging(FIRST_PAGE);
    },
    [view]
  );

  const close = () => setPointMenu(null);
  const canResetDrill = view.view.drills.length > 0;
  const pointItems = pointMenu
    ? pointMenuItems(
        {
          value: pointMenu.value,
          drill: view.drillColumn ? drillChoices : undefined,
          drillThrough: drillThrough.choices,
          canResetFilter: selected.length > 0,
          canResetDrill
        },
        {
          useAsFilter: value => onSelect([value]),
          drillDown: view.drillDown,
          resetFilter: () => onSelect([]),
          resetDrill: view.reset,
          drillThrough: drillThrough.drillThrough,
          loadMoreDashboards: drillThrough.loadMore
        }
      )
    : [];
  const widgetItems = widgetMenuItems(
    {
      zoomLevel: canZoom(view.viewed.setting) ? zoomLevelOf(view.viewed.setting) : undefined,
      canResetDrill,
      canExport: canDownload && canExportSetting(widget.setting, isFilterViz(viz))
    },
    { zoom: view.zoom, resetDrill: view.reset, download: type => void download(type) }
  );

  return {
    viz,
    query,
    data,
    trend,
    entry,
    setEntry,
    table: { paging, loading: data.isFetching, onPageChange: setPaging, sort: view.view.sort, onSortChange },
    crossFilter: { selected, onSelect, onPointMenu },
    drillPath: { steps: view.view.drills.map(drill => drill.step), onBack: view.back },
    pointMenu: { position: pointMenu?.position, items: pointItems, keepOpenKeys: KEEP_OPEN_KEYS, onClose: close },
    /** The header's filters as this chart sees them (v1 `ActionWidgetFilter`); none when the header has none. */
    appliedFilters: { filters: activeFilters, on: filtersOn, onToggle: view.toggleFilters },
    /** What the chart's inner filter queries with besides its own setting. */
    innerFilterRequests: appliedRequests,
    widgetItems
  };
}

export type ChartWidgetState = ReturnType<typeof useChartWidget>;
