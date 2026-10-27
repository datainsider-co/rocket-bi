import type { Options } from 'highcharts';
import { camelCase, snakeCase } from 'lodash-es';
import { asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';

/**
 * A chart's viz options: `setting.options` = `{ class_name, options }`, where the inner `options` is a Highcharts
 * options object plus v1's own keys.
 *
 * v1 renamed every key of every request and response (lodash `snakeCase` / `camelCase`), so these options are stored
 * snake_case (`plot_options.series.data_labels`). This is the one place v2 does the same conversion, and only for this
 * subtree, so stored dashboards read exactly as v1 read them. Keys that are data (series names under
 * `plot_options.series.response`, `typesByLabel`, ...) went through the conversion too; v1 looks them up with
 * `camelCase(name)`, and so must v2 (`vizKey`).
 */

/** v1's own keys next to the Highcharts ones (v1 `ChartOptionData`), the ones the renderers read. */
export interface VizExtras {
  affectedByFilter?: boolean;
  /** Card background; `var(--chart-background-color)` means the theme's. */
  background?: string;
  themeColor?: { enabled?: boolean; colors?: string[] };
  precision?: number;
  decimalPoint?: string;
  thousandSep?: string;
  /** Series type per series name, keys through `vizKey` (stacked and combo charts). */
  typesByLabel?: Record<string, string>;
  [key: string]: unknown;
}

export type VizOptions = Options & VizExtras;

export interface ChartViz {
  /** v1 `ChartOptionClassName`, e.g. `highcharts_series_chart_setting`. */
  readonly className: string;
  readonly options: VizOptions;
}

function convertKeys(value: unknown, transform: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map(item => convertKeys(item, transform));
  if (!isRecord(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [transform(key), convertKeys(item, transform)]));
}

/** How v1 keyed data inside viz options (series name → `camelCase`). */
export function vizKey(name: string): string {
  return camelCase(name);
}

export function vizFromSetting(setting: JsonObject): ChartViz {
  const stored = asRecord(setting['options']);
  return {
    className: asString(stored['class_name']),
    options: convertKeys(asRecord(stored['options']), camelCase) as VizOptions
  };
}

/** Viz options written in v1's camelCase, keyed the way v1 sent them (`snakeCase`, data keys included). */
export function toStoredKeys(options: object): JsonObject {
  return asRecord(convertKeys(options, snakeCase));
}

/** Back to the stored shape, for saving a chart (ChartBuilder). */
export function vizToStored(viz: ChartViz): JsonObject {
  return { class_name: viz.className, options: toStoredKeys(viz.options) };
}
