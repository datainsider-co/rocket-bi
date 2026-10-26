import { asArray, asBoolean, asNumber, asRecord, asString, getPath, isRecord, type JsonObject } from '@/core/json/json';
import type { WidgetId } from './Position';

/**
 * Widgets of a dashboard (backend `Widget`, discriminated by `class_name`). Plain values instead of deneric2 entities,
 * like `Position`, so the dashboard can sit in the query cache and be updated with spreads.
 *
 * Each widget keeps the JSON it was read from in `json`. Parts v2 doesn't model yet (most of a chart's query setting,
 * `extra_data`) are read from there, and edits are merged onto it, so nothing the server or v1 stored gets lost.
 */

/** Backend `class_name` values. `link_widget` and `image_widget` are deprecated in v1 but may still be stored. */
export const WidgetClassName = {
  Chart: 'chart_v3',
  Text: 'text_widget',
  Image: 'image_widget',
  Tab: 'tab_widget',
  Link: 'link_widget',
  DynamicFilter: 'dynamic_filter'
} as const;

/** `extra_data.current_chart_type` of a tab widget that is a filter panel (v1 `GroupFilter`). */
const FILTER_PANEL_TYPE = 'filter_panel';

interface WidgetBase {
  readonly id: WidgetId;
  readonly name: string;
  readonly description: string;
  readonly json: JsonObject;
}

/**
 * A chart, a filter or a control. `setting` is the backend query setting (`ChartSetting`) as stored; v2 reads what it
 * needs with the functions in `core/query` instead of porting v1's 35 QuerySetting classes.
 */
export interface ChartWidget extends WidgetBase {
  readonly kind: 'chart';
  readonly setting: JsonObject;
  /** The chart's own filter (v1 inner filter), shown in its action bar. */
  readonly chartFilter?: ChartWidget;
}

export interface TextWidget extends WidgetBase {
  readonly kind: 'text';
  readonly content: string;
  readonly isHtmlRender: boolean;
}

export interface ImageWidget extends WidgetBase {
  readonly kind: 'image';
  readonly url: string;
}

export interface TabItem {
  readonly name: string;
  readonly widgetIds: readonly WidgetId[];
  readonly options: JsonObject;
}

/** A tab widget, or a filter panel (same backend class, told apart by `extra_data.current_chart_type`). */
export interface TabWidget extends WidgetBase {
  readonly kind: 'tab' | 'filter_panel';
  readonly tabItems: readonly TabItem[];
}

/** Stored widgets v2 doesn't render (deprecated link widgets, v1's dynamic filters). */
export interface UnsupportedWidget extends WidgetBase {
  readonly kind: 'unsupported';
  readonly className: string;
}

export type Widget = ChartWidget | TextWidget | ImageWidget | TabWidget | UnsupportedWidget;

/** v1 `ChartInfoUtils.generatedChartFilterId`: an inner filter's id follows its chart's. */
export function innerFilterId(chartId: WidgetId): WidgetId {
  return -(chartId + 10);
}

function chartFromJson(json: JsonObject, base: Omit<WidgetBase, 'json'>): ChartWidget {
  // Read from the chart's id rather than stored: a chart duplicated by v1 kept its original's, so both shared one
  // selection.
  const stored = isRecord(json['chart_filter']) ? widgetFromJson(json['chart_filter']) : undefined;
  const chartFilter = stored && { ...stored, id: innerFilterId(base.id) };
  return {
    ...base,
    json,
    kind: 'chart',
    setting: asRecord(json['setting']),
    chartFilter: chartFilter?.kind === 'chart' ? chartFilter : undefined
  };
}

function tabItemFromJson(value: unknown): TabItem {
  const json = asRecord(value);
  return {
    name: asString(json['name']),
    widgetIds: asArray(json['widget_ids']).filter((id): id is number => typeof id === 'number'),
    options: asRecord(json['options'])
  };
}

export function widgetFromJson(value: unknown): Widget {
  const json = asRecord(value);
  const base = { id: asNumber(json['id'], -1), name: asString(json['name']), description: asString(json['description']) };
  const className = asString(json['class_name']);
  switch (className) {
    case WidgetClassName.Chart:
      return chartFromJson(json, base);
    case WidgetClassName.Text:
      return { ...base, json, kind: 'text', content: asString(json['content']), isHtmlRender: asBoolean(json['is_html_render']) };
    case WidgetClassName.Image:
      return { ...base, json, kind: 'image', url: asString(json['url']) };
    case WidgetClassName.Tab: {
      const isFilterPanel = getPath(json, ['extra_data', 'current_chart_type']) === FILTER_PANEL_TYPE;
      return {
        ...base,
        json,
        kind: isFilterPanel ? 'filter_panel' : 'tab',
        tabItems: asArray(json['tab_items']).map(tabItemFromJson)
      };
    }
    default:
      return { ...base, json, kind: 'unsupported', className };
  }
}

/** Ids of the widgets that live inside a tab or filter panel instead of the dashboard grid. */
export function nestedWidgetIds(widgets: readonly Widget[]): Set<WidgetId> {
  const ids = new Set<WidgetId>();
  for (const widget of widgets) {
    if (widget.kind === 'tab' || widget.kind === 'filter_panel') {
      for (const tab of widget.tabItems) tab.widgetIds.forEach(id => ids.add(id));
    }
  }
  return ids;
}
