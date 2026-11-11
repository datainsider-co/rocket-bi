import { useCallback, useMemo, useState } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { DEFAULT_PAGE_SIZE, isPagedSetting, type FilterRequestJson, type Paging } from '@/core/query/QueryRequest';
import type { TableSort } from '@/core/query/tableSort';
import { vizFromSetting } from '@/core/query/vizOptions';
import { zoomLevelOf, canZoom } from '@/core/query/zoom';
import { useKpiTrend } from '../../chart-data/useKpiTrend';
import { useSubRowQuery } from '../../chart-data/useSubRowQuery';
import { useWidgetData } from '../../chart-data/useWidgetData';
import type { KpiParts } from '../../charts/ChartRenderer';
import { kpiDateRangeOf } from '../../charts/kpi/kpiDateRange.utils';
import { isFilterViz } from '../../charts/filter/FilterRenderer';
import { selectionOf, selectionToControl } from '../../charts/filter/filter.utils';
import { buildChartQuery, isAffectedByFilter } from '../../controls/chartQuery.utils';
import type { ControlEntry } from '../../controls/controls.utils';
import { useDashboardPermissions } from '../../access/DashboardPermissionsContext';
import { useDashboardControls } from '../../controls/DashboardControlsContext';
import { canDrillThrough } from '@/core/query/drillThrough';
import { dimensionValues } from './drillPanel.utils';
import { canExportSetting, chartMenuItems, dimensionMenuItems, drillThroughMenuItems, staysOpen, zoomMenuItems, type ChartMenuHandlers, type ValuePick } from './chartMenus.utils';
import { useChartExport } from './useChartExport';
import { useChartView } from './useChartView';
import { useDrillThrough } from './useDrillThrough';

const FIRST_PAGE: Paging = { from: 0, size: DEFAULT_PAGE_SIZE };
const NO_REQUESTS: readonly FilterRequestJson[] = [];

type Position = { x: number; y: number };

/** The chart's menu, open at a clicked point (with its value) or at a right click on the card. */
export interface PointMenu {
  value?: string;
  /** The card's menu went on to pick a value for this (v1 `DimensionPicker`); the menu lists the values, then what follows. */
  pick?: ValuePick;
  position: Position;
}

/**
 * One chart widget (v1 `ChartHolder` + its menus): its query with the dashboard's controls, the header's filters and
 * the viewer's drill down, date function, sort, filter toggle and date range; its page; its own selection as a
 * control for others; its point and widget menus.
 */
export function useChartWidget(widget: ChartWidget, dashboardId: number) {
  const { controls, widgets, entryOf, setControl, headerFilters, headerRequests } = useDashboardControls();
  const [paging, setPaging] = useState<Paging>(FIRST_PAGE);
  const [pointMenu, setPointMenu] = useState<PointMenu | null>(null);
  /** The drill down panel opened from the menu, where the menu was. */
  const [drillPanel, setDrillPanel] = useState<PointMenu | null>(null);
  const view = useChartView(widget);
  const { canDownload } = useDashboardPermissions();

  const filtersOn = view.view.filtersOn ?? isAffectedByFilter(widget.setting);
  const appliedRequests = filtersOn ? headerRequests : NO_REQUESTS;
  const viz = useMemo(() => vizFromSetting(widget.setting), [widget.setting]);
  const query = useMemo(() => buildChartQuery(view.viewed, controls, widgets, appliedRequests), [view.viewed, controls, widgets, appliedRequests]);
  const data = useWidgetData(view.viewed, { dashboardId, query, paging: isPagedSetting(widget.setting) ? paging : undefined });
  const trend = useKpiTrend(view.viewed, query, dashboardId);
  const subRows = useSubRowQuery(widget.id, query, dashboardId);
  const dateRange = useMemo(() => kpiDateRangeOf(view.viewed.setting), [view.viewed.setting]);
  const { pickDateRange } = view;
  const kpi = useMemo<KpiParts>(() => ({ trend, dateRange: dateRange && { value: dateRange, onChange: pickDateRange } }), [trend, dateRange, pickDateRange]);
  const download = useChartExport(widget, dashboardId, query);
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
  const zoomLevel = canZoom(view.viewed.setting) ? zoomLevelOf(view.viewed.setting) : undefined;
  const filter = isFilterViz(viz);
  const values = useMemo(() => dimensionValues(data.data), [data.data]);
  const menuHandlers: ChartMenuHandlers = {
    useAsFilter: value => onSelect([value]),
    pickValue: pick => pointMenu && setPointMenu({ ...pointMenu, pick }),
    zoom: view.zoom,
    openDrill: () => setDrillPanel(pointMenu),
    resetFilter: () => onSelect([]),
    resetDrill: view.reset,
    drillThrough: drillThrough.drillThrough,
    loadMoreDashboards: drillThrough.loadMore,
    download: type => void download(type)
  };
  // v1 `WidgetContextMenu`: one list for a clicked point and for a right click on the card, without what does not apply.
  const mainMenuItems = () =>
    chartMenuItems(
      {
        value: pointMenu?.value,
        zoomLevel,
        canDrill: view.drillColumn !== undefined,
        drillThrough: drillThrough.choices,
        pickFor: values.length === 0 ? [] : canDrillThrough(view.viewed.setting) ? ['filter', 'drill-through'] : ['filter'],
        canResetFilter: selected.length > 0,
        canResetDrill,
        canExport: canDownload && canExportSetting(widget.setting, filter)
      },
      menuHandlers
    );
  // The card's menu, one step on: the chart's values to pick from, then for a drill through the dashboards to open.
  const pickMenuItems = (menu: PointMenu) => {
    if (menu.value !== undefined) return drillThrough.choices ? drillThroughMenuItems(drillThrough.choices, menuHandlers) : [];
    if (menu.pick === 'filter') return dimensionMenuItems(values, value => onSelect([value]));
    return dimensionMenuItems(values, value => setPointMenu({ ...menu, value }), true);
  };
  const menuItems = !pointMenu ? [] : pointMenu.pick ? pickMenuItems(pointMenu) : mainMenuItems();
  const options = viz.options as { enableIconZoom?: boolean; isEnableDrilldown?: boolean };

  return {
    viz,
    query,
    data,
    /** A number chart's trend line and its date range, which the viewer can change on the card. */
    kpi,
    entry,
    setEntry,
    table: { paging, onPageChange: setPaging, sort: view.view.sort, onSortChange, subRows },
    crossFilter: { selected, onSelect, onPointMenu },
    drillPath: { steps: view.view.drills.map(drill => drill.step), onBack: view.back },
    pointMenu: { position: pointMenu?.position, items: menuItems, staysOpen, onClose: close },
    /** A right click on the card, off any point: the same menu without a value. Filters have none. */
    onCardMenu: filter ? undefined : (position: Position) => setPointMenu({ position }),
    /** The drill down: what its panel reads and does, and where the panel is when the menu opened it. */
    drill: {
      column: view.drillColumn,
      setting: view.viewed.setting,
      response: data.data,
      steps: view.view.drills.map(drill => drill.step),
      back: view.back,
      reset: view.reset,
      drillDown: view.drillDown,
      panel: drillPanel,
      closePanel: () => setDrillPanel(null),
      /** v1 `enableDrilldownIcon`: the card's drilldown button, when the chart's options turn drill down on. */
      button: options.isEnableDrilldown === true && view.drillColumn !== undefined
    },
    /** v1 `ActionWidgetMore.canZoom`: the card's zoom button and its date functions, when the options show it. */
    zoomItems: options.enableIconZoom === true && zoomLevel ? zoomMenuItems(zoomLevel, view.zoom) : undefined,
    /** The header's filters as this chart sees them (v1 `ActionWidgetFilter`); none when the header has none. */
    appliedFilters: { filters: activeFilters, on: filtersOn, onToggle: view.toggleFilters },
    /** What the chart's inner filter queries with besides its own setting. */
    innerFilterRequests: appliedRequests
  };
}

export type ChartWidgetState = ReturnType<typeof useChartWidget>;
