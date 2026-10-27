import { asBoolean, asRecord, asString, type JsonObject } from '@/core/json/json';
import type { Position } from '@/core/dashboard/Position';
import { innerFilterId, WidgetClassName } from '@/core/dashboard/Widget';
import { vizTitleOf } from './defaultVizOptions';

export interface ChartWidgetInput {
  /** The edited chart as stored; none for a new one. Keys the builder doesn't own stay as they are. */
  readonly stored?: JsonObject;
  readonly setting: JsonObject;
  /** The builder's keys of `extra_data` (`builderExtraDataOf`), put over the stored ones. */
  readonly extraData: JsonObject;
}

/** The viz options as stored, keys in snake_case (`text_color`, `display_as`). */
const vizOptionsOf = (setting: JsonObject) => asRecord(asRecord(setting['options'])['options']);

/**
 * The chart widget the builder saves (v1 `ChartBuilderController.getFinalChartInfo`): named by its title, described by
 * its subtitle, coloured by its options (v1's fallbacks otherwise). A new one has id -1.
 */
export function chartWidgetJson({ stored = {}, setting, extraData }: ChartWidgetInput): JsonObject {
  const options = vizOptionsOf(setting);
  return {
    class_name: WidgetClassName.Chart,
    id: -1,
    ...stored,
    name: vizTitleOf(asRecord(setting['options'])),
    description: asString(asRecord(options['subtitle'])['text']),
    background_color: asString(options['background']) || '#0000001A',
    text_color: asString(options['text_color']) || '#fff',
    extra_data: { ...asRecord(stored['extra_data']), ...extraData },
    setting
  };
}

/** v1 `DefaultSize`: width and height in grid cells. */
const DEFAULT_SIZE: readonly [number, number] = [16, 10];

const SMALL_KPI_THEMES = new Set(['style_9', 'style_10', 'style_11', 'style_12']);
const WIDE_KPI_THEMES = new Set(['style_7', 'style_8']);

function tabControlSize(options: JsonObject): readonly [number, number] {
  switch (options['display_as']) {
    case 'drop_down':
    case 'flat':
      return [12, 2];
    case 'normal':
    case 'single_choice':
    case 'multi_choice':
      if (options['direction'] === 'column') return [12, 8];
      return asBoolean(asRecord(options['search'])['enabled'], true) ? [12, 4] : [12, 2];
    default:
      return DEFAULT_SIZE;
  }
}

/** A new chart's size by its setting (v1 `QuerySetting.getDefaultSize` of each setting class). */
export function chartSizeOf(setting: JsonObject): readonly [number, number] {
  const vizClass = asString(asRecord(setting['options'])['class_name']);
  const options = vizOptionsOf(setting);
  switch (asString(setting['class_name'])) {
    case 'number_chart_setting': {
      const theme = asString(options['theme']);
      if (SMALL_KPI_THEMES.has(theme)) return [8, 8];
      return WIDE_KPI_THEMES.has(theme) ? [15, 5] : [16, 8];
    }
    case 'pie_chart_setting':
      return options['is_semi_pie'] === true ? [18, 10] : [10, 10];
    case 'input_control_chart_setting':
      if (vizClass === 'slice_filter_setting') return [12, 4];
      return vizClass === 'date_select_filter_setting' ? [12, 3] : [12, 2];
    case 'tab_control_chart_setting':
      return vizClass === 'tree_filter_chart_setting' ? [12, 8] : tabControlSize(options);
    default:
      return DEFAULT_SIZE;
  }
}

/** Where a new chart goes: nowhere yet, the grid finds it a free slot (v1 `ChartInfo.getDefaultPosition`). */
export function newChartPosition(setting: JsonObject): Position {
  const [width, height] = chartSizeOf(setting);
  return { row: -1, column: -1, width, height, zIndex: 1 };
}

/** The chart with its inner filter (v1 `handleAddInnerFilter`): the filter's id follows the chart's. */
export function withChartFilter(chart: JsonObject, filter: JsonObject, chartId: number): JsonObject {
  return { ...chart, chart_filter: { ...filter, id: innerFilterId(chartId) } };
}

/** The chart without its inner filter (v1 `handleDeleteInnerFilter`). */
export function withoutChartFilter(chart: JsonObject): JsonObject {
  return Object.fromEntries(Object.entries(chart).filter(([key]) => key !== 'chart_filter'));
}
