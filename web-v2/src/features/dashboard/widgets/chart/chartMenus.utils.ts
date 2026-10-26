import type { MenuProps } from 'antd';
import type { JsonObject } from '@/core/json/json';
import type { ExportType } from '@/core/query/QueryService';
import { ZOOM_LEVELS } from '@/core/query/zoom';
import { DRILL_DATE_LEVELS, type DrillField } from './chartView.utils';
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

/** The point menu stays open when this item is clicked, so the next page shows. */
export const LOAD_MORE_DASHBOARDS_KEY = 'drill-through:more';

export interface PointMenuInput {
  value: string;
  /** The chart can drill; `undefined` hides the item. */
  drill?: DrillChoices;
  /** The chart can drill through; `undefined` hides the item. */
  drillThrough?: DrillThroughChoices;
  canResetFilter: boolean;
  canResetDrill: boolean;
}

export interface PointMenuHandlers {
  useAsFilter: (value: string) => void;
  drillDown: (value: string, field: DrillField, dateLevel?: string) => void;
  resetFilter: () => void;
  resetDrill: () => void;
  drillThrough: (target: DrillTarget) => void;
  loadMoreDashboards: () => void;
}

function drillThroughChildren(choices: DrillThroughChoices, handlers: PointMenuHandlers): MenuItems {
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

function drillChildren(value: string, drill: DrillChoices, onDrill: PointMenuHandlers['drillDown']): MenuItems {
  if (drill.loading) return [{ key: 'drill:loading', label: 'Loading...', disabled: true }];
  if (drill.fields.length === 0) return [{ key: 'drill:none', label: 'No field to drill down', disabled: true }];
  return drill.fields.map((field, index) =>
    field.isDate
      ? {
          key: `drill:${index}`,
          label: field.label,
          children: DRILL_DATE_LEVELS.map(({ level, label }) => ({
            key: `drill:${index}:${level}`,
            label,
            onClick: () => onDrill(value, field, level)
          }))
        }
      : { key: `drill:${index}`, label: field.label, onClick: () => onDrill(value, field) }
  );
}

/** The menu of a clicked point (v1 `WidgetContextMenu.getMenuOptions`). */
export function pointMenuItems(input: PointMenuInput, handlers: PointMenuHandlers): MenuItems {
  const { value, drill, drillThrough, canResetFilter, canResetDrill } = input;
  return [
    { key: 'filter', label: `Use "${value}" as a filter`, onClick: () => handlers.useAsFilter(value) },
    ...(drill ? [{ key: 'drill', label: 'Drill down', children: drillChildren(value, drill, handlers.drillDown) }] : []),
    ...(drillThrough ? [{ key: 'drill-through', label: 'Drill through', children: drillThroughChildren(drillThrough, handlers) }] : []),
    { key: 'reset-filter', label: 'Reset filter', disabled: !canResetFilter, onClick: handlers.resetFilter },
    ...(canResetDrill ? [{ key: 'reset-drill', label: 'Reset drill down', onClick: handlers.resetDrill }] : [])
  ];
}

export interface WidgetMenuInput {
  /** The current date function when the chart can change it. */
  zoomLevel?: string;
  canResetDrill: boolean;
  canExport: boolean;
}

export interface WidgetMenuHandlers {
  zoom: (level: string) => void;
  resetDrill: () => void;
  download: (type: ExportType) => void;
}

/** The widget's own menu (v1 `getWidgetMenuOptions` without the items that need a clicked value). */
export function widgetMenuItems({ zoomLevel, canResetDrill, canExport }: WidgetMenuInput, handlers: WidgetMenuHandlers): MenuItems {
  return [
    ...(zoomLevel
      ? [
          {
            key: 'zoom',
            label: 'Change date function',
            children: ZOOM_LEVELS.map(({ level, label }) => ({
              key: `zoom:${level}`,
              label,
              disabled: level === zoomLevel,
              onClick: () => handlers.zoom(level)
            }))
          }
        ]
      : []),
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
