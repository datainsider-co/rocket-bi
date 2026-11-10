import type { MenuProps } from 'antd';
import type { JsonObject } from '@/core/json/json';
import type { ExportType } from '@/core/query/QueryService';
import { ZOOM_LEVELS } from '@/core/query/zoom';
import type { DrillField } from './chartView.utils';
import type { DrillTarget } from './drillThrough.utils';

type MenuItems = NonNullable<MenuProps['items']>;

/** Drill down targets, or why there are none yet. */
export interface DrillChoices {
  fields: readonly DrillField[];
  loading: boolean;
}

/** Dashboards to drill through to, loaded page by page. */
export interface DrillThroughChoices {
  dashboards: readonly DrillTarget[];
  loading: boolean;
  hasMore: boolean;
}

/** The menu stays open when this item is clicked, so the next page shows. */
export const LOAD_MORE_DASHBOARDS_KEY = 'drill-through:more';

export interface ChartMenuInput {
  /** The clicked point's value; absent for a right click on the card. */
  value?: string;
  /** The current date function when the chart can change it. */
  zoomLevel?: string;
  canDrill: boolean;
  /** The chart can drill through from the clicked value; `undefined` hides the item. */
  drillThrough?: DrillThroughChoices;
  canResetFilter: boolean;
  canResetDrill: boolean;
  canExport: boolean;
}

export interface ChartMenuHandlers {
  useAsFilter: (value: string) => void;
  zoom: (level: string) => void;
  /** Opens the drill down panel, on the clicked value when there is one. */
  openDrill: () => void;
  resetFilter: () => void;
  resetDrill: () => void;
  drillThrough: (target: DrillTarget) => void;
  loadMoreDashboards: () => void;
  download: (type: ExportType) => void;
}

function drillThroughChildren(choices: DrillThroughChoices, handlers: Pick<ChartMenuHandlers, 'drillThrough' | 'loadMoreDashboards'>): MenuItems {
  const { dashboards, loading, hasMore } = choices;
  if (dashboards.length === 0) {
    return [{ key: 'drill-through:none', label: loading ? 'Loading...' : 'No dashboard to drill through', disabled: true }];
  }
  return [
    ...dashboards.map(target => ({ key: `drill-through:${target.id}`, label: target.name, onClick: () => handlers.drillThrough(target) })),
    ...(hasMore || loading
      ? [{ key: LOAD_MORE_DASHBOARDS_KEY, label: loading ? 'Loading...' : 'Load more', disabled: loading, onClick: handlers.loadMoreDashboards }]
      : [])
  ];
}

/** The date functions to switch to (v1 `ZoomSetting`), the current one off. */
export function zoomMenuItems(zoomLevel: string, onZoom: (level: string) => void): MenuItems {
  return ZOOM_LEVELS.map(({ level, label }) => ({ key: `zoom:${level}`, label, disabled: level === zoomLevel, onClick: () => onZoom(level) }));
}

/**
 * A chart's menu in view mode (v1 `WidgetContextMenu`): on a clicked point (`getMenuOptions`) or, without a value, on
 * a right click on the card (`getWidgetMenuOptions`). Like v1 it lists only what applies. v1's card menu also had
 * "Use as a filter" and "Drill through" behind a picker of the chart's values; here they need a clicked point.
 */
export function chartMenuItems(input: ChartMenuInput, handlers: ChartMenuHandlers): MenuItems {
  const { value, zoomLevel, canDrill, drillThrough, canResetFilter, canResetDrill, canExport } = input;
  return [
    ...(value !== undefined ? [{ key: 'filter', label: `Use "${value}" as a filter`, onClick: () => handlers.useAsFilter(value) }] : []),
    ...(zoomLevel ? [{ key: 'zoom', label: 'Change date function', children: zoomMenuItems(zoomLevel, handlers.zoom) }] : []),
    ...(canDrill ? [{ key: 'drill', label: 'Drill down', onClick: handlers.openDrill }] : []),
    ...(value !== undefined && drillThrough
      ? [{ key: 'drill-through', label: 'Drill through', children: drillThroughChildren(drillThrough, handlers) }]
      : []),
    ...(canResetFilter ? [{ key: 'reset-filter', label: 'Reset filter', onClick: handlers.resetFilter }] : []),
    ...(canResetDrill ? [{ key: 'reset-drill', label: 'Reset drill down', onClick: handlers.resetDrill }] : []),
    ...(canExport
      ? [
          { key: 'csv', label: 'Download CSV', onClick: () => handlers.download('csv') },
          { key: 'xlsx', label: 'Download Excel', onClick: () => handlers.download('xlsx') }
        ]
      : [])
  ];
}

/** v1 hid downloads for KPIs; filters have no data to download either. */
export function canExportSetting(setting: JsonObject, isFilter: boolean): boolean {
  return !isFilter && setting['class_name'] !== 'number_chart_setting';
}
